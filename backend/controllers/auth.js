const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, validateUser } = require('../models/User');
const { Account } = require('../models/Account');
const { Analytics } = require('../models/Analytics');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const {
  compressImage,
  WelcomeEmailTemp,
  forgotPasswordTemp,
} = require('../utils');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(404).json({ message: 'email and password missing' });
    }

    // Check if user exists in the database
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(404).json({ message: 'Invalid credentials' });
    }
    if (userData.isSocial) {
      return res.status(400).json({
        message: 'try to login with social account',
      });
    }

    // Check if the password is correct
    const passwordMatches = await bcrypt.compare(password, userData.password);

    if (!passwordMatches) {
      return res.status(400).json({ message: 'Invalid Password' });
    }

    // Creating a token and setting it in the response
    const token = jwt.sign(
      {
        id: userData.id,
        email: userData.email,
      },
      'your-secret-key', // Replace with your actual secret key for token generation
      { expiresIn: '1d' } // You can adjust the expiration time as needed
    );

    await User.findByIdAndUpdate(userData.id, {
      token,
      lastLoginAt: Math.floor(Date.now() / 1000),
    });

    return res.status(200).json({
      data: {
        token,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          profile: userData.profile,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const { error } = await validateUser(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const profilePic = req.file;
    let profile = 'https://i.stack.imgur.com/l60Hf.png';
    if (profilePic) {
      const { error, data } = await compressImage(profilePic);
      if (error) {
        return res.status(400).json({ error });
      }
      profile = data;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      profilePic: profile,
      role: 'user',
      isActive: true,
    });

    const defaultAccount = new Account({
      name: `${newUser.name} default account`,
      owner: newUser.id,
      createdBy: newUser.id,
    });

    const analyticsData = await Analytics.create({
      account: defaultAccount.id,
      user: newUser.id,
    });

    defaultAccount.analytics = analyticsData.id;

    await defaultAccount.save();

    await newUser.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: 'expenssManger1234@gmail.com',
      to: newUser.email,
      subject: 'Welcome email',
      html: WelcomeEmailTemp(
        newUser.name,
        process.env.LOGINPAGE,
        newUser.email
      ),
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info.response);
      }
    });
    return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId).select(
      '_id name email profilePic lastLoginAt createdAt'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      token: null,
    });

    return res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const isValidUser = await User.findOne({ email });

    if (!isValidUser) {
      return res.status(400).json({ message: 'User not found' });
    }

    // generate resetPasswordToken
    const resetPasswordToken = crypto.randomBytes(32).toString('hex');

    // hash resetPasswordToken
    const hashedResetPasswordToken = crypto
      .createHash('sha256')
      .update(resetPasswordToken)
      .digest('hex');

    // update user
    await User.findOneAndUpdate(
      { email },
      {
        resetPasswordToken: hashedResetPasswordToken,
      }
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASS,
      },
    });

    const BASE_URL = req.headers.origin;

    const forgotPasswordLink = `${BASE_URL}/reset-password?token=${resetPasswordToken}`;

    const mailOptions = {
      from: 'expenssManger1234@gmail.com',
      to: isValidUser.email,
      subject: 'Forgot Password',
      html: forgotPasswordTemp(
        isValidUser.name,
        forgotPasswordLink,
        isValidUser.email
      ),
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info.response);
      }
    });

    return res
      .status(200)
      .json({ message: 'Reset password link sent to your email' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password, resetPasswordToken } = req.body;

    // Validate if password and resetPasswordToken are provided
    if (!password || !resetPasswordToken) {
      return res
        .status(400)
        .json({ message: 'Password and reset password token are required' });
    }

    // Hash the resetPasswordToken
    const hashedResetPasswordToken = crypto
      .createHash('sha256')
      .update(resetPasswordToken)
      .digest('hex');

    // Find user by resetPasswordToken
    const user = await User.findOne({
      resetPasswordToken: hashedResetPasswordToken,
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: 'Invalid or expired reset password token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    user.password = hashedPassword;
    user.resetPasswordToken = undefined; // Clear the reset password token

    // Save the updated user
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  login,
  signup,
  me,
  logout,
  forgotPassword,
  resetPassword,
};
