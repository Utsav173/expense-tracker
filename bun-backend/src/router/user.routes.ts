import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { loginSchema, userSchema } from '../utils/schema.validations';
import { db } from '../database';
import { Account, Analytics, User } from '../database/schema';
import { eq } from 'drizzle-orm';
import { WelcomeEmailTemp, compressImage, forgotPasswordTemp } from '../utils';
import authMiddleware from '../middleware';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

const userRouter = new Hono();

userRouter.get('/me', authMiddleware, async (c) => {
  const userId = await c.get('userId' as any);

  const findUser = await db.query.User.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, userId);
    },
    columns: {
      id: true,
      name: true,
      email: true,
      profilePic: true,
      lastLoginAt: true,
      createdAt: true,
    },
  }).catch((err) => {
    throw new HTTPException(500, { message: err.message });
  });

  return c.json(findUser ?? {});
});

userRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = await c.req.json();

  const findUser = await db.query.User.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, email);
    },
    columns: {
      id: true,
      name: true,
      email: true,
      password: true,
      profilePic: true,
      isSocial: true,
    },
  }).catch((err) => {
    throw new HTTPException(500, { message: err.message });
  });

  if (!findUser) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  if (findUser.isSocial) {
    throw new HTTPException(400, { message: 'Login with social account' });
  }

  // check if password is correct
  const isMatch = await bcrypt.compare(password, findUser.password);

  if (!isMatch) {
    throw new HTTPException(400, { message: 'Invalid credentials' });
  }

  const token = await sign(
    { id: findUser.id, email: findUser.email },
    'secret'
  );

  await db.update(User).set({ token, lastLoginAt: new Date() }).where(eq(User.id, findUser.id));

  return c.json({
    data: {
      token,
      user: {
        id: findUser.id,
        name: findUser.name,
        email: findUser.email,
        profile: findUser.profilePic,
      },
    },
  });
});

userRouter.post('/signup', zValidator('form', userSchema), async (c) => {

  const data = await c.req.parseBody();
  const { name, email, password } = data;

  const findUser = await db.query.User.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, email.toString());
    },
    columns: {
      id: true,
    },
  }).catch((err) => {
    throw new HTTPException(500, { message: err.message });
  });

  if (findUser) {
    throw new HTTPException(409, { message: 'User already exists' });
  }

  let profilePic = await c.req.formData()

  profilePic = profilePic.get('profilePic') as any;

  let profile;
  if (profilePic) {
    const { error, data } = await compressImage(profilePic);

    if (error) {
      throw new HTTPException(400, { message: data });
    }

    profile = data;
  }

  const hashedPassword = await bcrypt.hash(password.toString(), 10);

  const newUser = await db
    .insert(User)
    .values({
      name: name.toString(),
      email: email.toString(),
      password: hashedPassword,
      profilePic: profile,
      isSocial: false,
    })
    .returning()
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  const defaultAccount = await db
    .insert(Account)
    .values({
      name: `${newUser[0].name}'s Account`,
      owner: newUser[0].id,
      balance: 0,
    })
    .returning()
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  await db
    .insert(Analytics)
    .values({
      account: defaultAccount[0].id,
      user: newUser[0].id,
    })
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: 'expenssManger1234@gmail.com',
    to: email.toString(),
    subject: 'Welcome email',
    text: WelcomeEmailTemp(name, process.env.LOGINPAGE, email),
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  c.status(201);

  return c.json({ message: 'User created successfully!' });
});

userRouter.post('/forgot-password', async (c) => {
  const { email } = await c.req.json();

  if (!email) {
    throw new HTTPException(400, { message: 'Email is required' });
  }

  const validUser = await db.query.User.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, email);
    },
    columns: {
      name: true,
      email: true,
    },
  });

  if (!validUser) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  // generate token
  const token = await sign(
    { name: validUser.name, email: validUser.email },
    'secret'
  );

  await db
    .update(User)
    .set({ resetPasswordToken: token })
    .where(eq(User.email, email));

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const forgotPasswordLink = `${process.env.RESETPAGE}?token=${token}`;

  const mailOptions = {
    from: 'expenssManger1234@gmail.com',
    to: validUser.email,
    subject: 'Forgot Password',
    html: forgotPasswordTemp(
      validUser.name,
      forgotPasswordLink,
      validUser.email
    ),
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log(info.response);
    }
  });

  return c.json({ message: 'Password reset link sent to your email' });
});

userRouter.post('/reset-password', async (c) => {
  const { password, resetPasswordToken } = await c.req.json();

  if (!password || !resetPasswordToken) {
    throw new HTTPException(400, {
      message: 'Password and reset password token are required',
    });
  }

  //verify token
  const verifyToken = await verify(resetPasswordToken, 'secret');

  if (!verifyToken) {
    throw new HTTPException(400, { message: 'Invalid reset password token' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db
    .update(User)
    .set({ password: hashedPassword, resetPasswordToken: null })
    .where(eq(User.email, verifyToken.email))
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json({ message: 'Password reset successfully!' });
});

userRouter.post('/logout', authMiddleware, async (c) => {
  const userId = await c.get('userId' as any);

  await db.update(User).set({ token: null }).where(eq(User.id, userId));

  return c.json({ message: 'User logged out successfully!' });
});

userRouter.post('/hc', (c) => {
  return c.json({
    message: 'Hello Health Chekkers!',
  });
});

export default userRouter;
