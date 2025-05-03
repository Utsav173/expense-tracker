import { db } from '../database';
import { Account, Analytics, Category, User } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';
import { InferInsertModel } from 'drizzle-orm';
import { compressImage } from '../utils/image.utils';
import { emailService } from './email.service';
import { config } from '../config';

type UserInsert = InferInsertModel<typeof User>;
type LoginPayload = Pick<UserInsert, 'email' | 'password'>;
type SignupPayload = Pick<UserInsert, 'name' | 'email' | 'password'> & {
  profilePic?: any;
};
export type UpdatePayload = Pick<UserInsert, 'name' | 'preferredCurrency'> & {
  profilePic?: any;
};

// Define expected payload structure for JWT
interface UserJwtPayload {
  id: string;
  email: string;
  // Add 'exp' and 'iat' if you need them, though verify handles expiration
  exp?: number;
  iat?: number;
}

export class UserService {
  async getMe(userId: string) {
    const user = await db.query.User.findFirst({
      where: eq(User.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
        lastLoginAt: true,
        createdAt: true,
        preferredCurrency: true,
      },
    }).catch((err) => {
      // Log the specific DB error for debugging
      console.error('DB Error in getMe:', err);
      throw new HTTPException(500, { message: 'Database error retrieving user.' });
    });

    if (!user) {
      throw new HTTPException(404, { message: 'User not found' });
    }
    return user;
  }

  async login(payload: LoginPayload) {
    const { email, password } = payload;
    const findUser = await db.query.User.findFirst({
      where: eq(User.email, email),
      // Select necessary fields including password for comparison
      columns: {
        id: true,
        name: true,
        email: true,
        password: true,
        profilePic: true,
        isSocial: true,
        isActive: true, // Check if user is active
      },
    }).catch((err) => {
      console.error('DB Error in login (findUser):', err);
      throw new HTTPException(500, { message: 'Database error during login.' });
    });

    if (!findUser) {
      throw new HTTPException(404, { message: 'User not found' });
    }

    if (!findUser.isActive) {
      throw new HTTPException(403, { message: 'User account is inactive.' });
    }

    if (findUser.isSocial) {
      throw new HTTPException(400, {
        message: 'Please log in using your social account provider.',
      });
    }

    const isMatch = await bcrypt.compare(password, findUser.password).catch((err) => {
      console.error('Bcrypt compare error:', err);
      throw new HTTPException(500, { message: 'Error comparing password.' }); // Internal error
    });

    if (!isMatch) {
      throw new HTTPException(401, { message: 'Invalid credentials' }); // Use 401 Unauthorized
    }

    const token = await sign(
      { id: findUser.id, email: findUser.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
      config.JWT_SECRET,
    );

    // Update token and last login time
    await db
      .update(User)
      .set({ token, lastLoginAt: new Date() })
      .where(eq(User.id, findUser.id))
      .catch((err) => {
        console.error('DB Error in login (updateToken):', err);
        // Log error but might still return token to user if update fails? Decide on behavior.
        // For now, let's throw to indicate inconsistency.
        throw new HTTPException(500, { message: 'Failed to update login state.' });
      });

    return {
      token,
      user: {
        id: findUser.id,
        name: findUser.name,
        email: findUser.email,
        profile: findUser.profilePic,
      },
    };
  }

  async signup(payload: SignupPayload) {
    const { name, email, password, profilePic } = payload;

    const findUser = await db.query.User.findFirst({
      where: eq(User.email, email),
      columns: { id: true },
    }).catch((err) => {
      console.error('DB Error in signup (check existing):', err);
      throw new HTTPException(500, { message: 'Database error checking user existence.' });
    });

    if (findUser) {
      throw new HTTPException(409, { message: 'User with this email already exists' }); // 409 Conflict
    }

    let profileUrl: string | undefined;
    if (profilePic && profilePic.size > 0) {
      // Check if profilePic is a valid file object
      try {
        const compressionResult = await compressImage(profilePic);
        // compressImage now throws HTTPException on error, so no need to check 'error' field
        profileUrl = compressionResult.data;
      } catch (compError) {
        if (compError instanceof HTTPException) throw compError; // Re-throw known errors
        throw new HTTPException(500, { message: 'Failed to process profile picture.' }); // Generic for unknown compression errors
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use transaction for atomicity
    const signupResult = await db.transaction(async (tx) => {
      const newUserResult = await tx
        .insert(User)
        .values({
          name: name,
          email: email,
          password: hashedPassword,
          profilePic: profileUrl,
          isSocial: false,
          preferredCurrency: 'INR', // Default currency
          createdAt: new Date(), // Explicitly set createdAt
        })
        .returning()
        .catch((err) => {
          console.error('DB Error creating user:', err);
          throw new HTTPException(500, { message: `User creation failed: ${err.message}` });
        });
      if (!newUserResult || newUserResult.length === 0)
        throw new HTTPException(500, { message: 'Failed to create user record.' });
      const newUser = newUserResult[0];

      const defaultAccountResult = await tx
        .insert(Account)
        .values({
          name: `${newUser.name}'s Account`,
          owner: newUser.id,
          balance: 0,
          currency: 'INR',
          createdAt: new Date(),
        })
        .returning()
        .catch((err) => {
          throw new HTTPException(500, {
            message: `Default account creation failed: ${err.message}`,
          });
        });
      if (!defaultAccountResult || defaultAccountResult.length === 0)
        throw new HTTPException(500, { message: 'Failed to create default account.' });
      const defaultAccount = defaultAccountResult[0];

      await tx
        .insert(Analytics)
        .values({
          account: defaultAccount.id,
          user: newUser.id,
          createdAt: new Date(), // Initialize analytics
        })
        .catch((err) => {
          throw new HTTPException(500, { message: `Analytics creation failed: ${err.message}` });
        });

      await tx
        .insert(Category)
        .values({
          name: 'Default',
          owner: newUser.id,
          createdAt: new Date(), // Create user-specific 'Default' category
        })
        .catch((err) => {
          throw new HTTPException(500, {
            message: `Default category creation failed: ${err.message}`,
          });
        });

      return newUser; // Return the created user
    });

    // Send welcome email outside the transaction
    await emailService.sendWelcomeEmail(signupResult.name, signupResult.email);

    return { message: 'User created successfully!' };
  }

  async forgotPassword(email: string) {
    if (!email) {
      throw new HTTPException(400, { message: 'Email is required' });
    }

    const validUser = await db.query.User.findFirst({
      where: eq(User.email, email),
      columns: { id: true, name: true, email: true, isActive: true }, // Check if active
    });

    // Don't reveal if user exists or is inactive, just send the generic message
    if (validUser && validUser.isActive) {
      try {
        // Use sign from hono/jwt, add expiration
        const token = await sign({ id: validUser.id, email: validUser.email }, config.JWT_SECRET);
        await db.update(User).set({ resetPasswordToken: token }).where(eq(User.email, email));
        await emailService.sendForgotPasswordEmail(validUser.name, validUser.email, token);
      } catch (error: any) {
        console.error('Forgot Password Error (Token/DB/Email):', error);
        // Log error but still return generic success message to client
      }
    } else {
      // Log if user not found or inactive, but don't tell the client
      if (!validUser) console.warn(`Password reset requested for non-existent email: ${email}`);
      else console.warn(`Password reset requested for inactive user: ${email}`);
    }

    return {
      message:
        'If a user with that email exists and is active, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, password: string) {
    if (!password || !token) {
      throw new HTTPException(400, { message: 'Password and reset password token are required' });
    }
    if (password.length < 8) {
      // Add basic password length validation
      throw new HTTPException(400, { message: 'Password must be at least 8 characters long' });
    }

    let payload: UserJwtPayload;
    try {
      // Use verify from hono/jwt
      const unknownPayload = await verify(token, config.JWT_SECRET);
      // Basic type check for the payload
      if (
        typeof unknownPayload !== 'object' ||
        unknownPayload === null ||
        typeof unknownPayload.id !== 'string' ||
        typeof unknownPayload.email !== 'string'
      ) {
        throw new Error('Invalid token payload structure');
      }
      payload = unknownPayload as UserJwtPayload; // Cast after check
    } catch (e: any) {
      // Catches expired tokens and invalid signatures
      throw new HTTPException(401, {
        message: `Invalid or expired reset password token: ${e.message}`,
      }); // Use 401
    }

    // Verify token still exists on user record
    const user = await db.query.User.findFirst({
      where: and(eq(User.email, payload.email), eq(User.isActive, true)), // Ensure user is active
      columns: { resetPasswordToken: true },
    });
    // Check if token matches the one stored OR if it's already null (meaning it was used/invalidated)
    if (!user || user.resetPasswordToken !== token) {
      throw new HTTPException(400, {
        message: 'Reset token mismatch, already used, or user inactive.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db
      .update(User)
      .set({ password: hashedPassword, resetPasswordToken: null, updatedAt: new Date() }) // Clear the token
      .where(eq(User.email, payload.email))
      .catch((err) => {
        console.error('DB Error resetting password:', err);
        throw new HTTPException(500, { message: 'Failed to update password.' });
      });

    return { message: 'Password reset successfully!' };
  }

  async updateUser(userId: string, payload: UpdatePayload) {
    const { name, preferredCurrency, profilePic } = payload;
    const updateData: Partial<InferInsertModel<typeof User>> = { updatedAt: new Date() };

    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim();
    }
    if (preferredCurrency !== undefined && preferredCurrency?.length === 3) {
      updateData.preferredCurrency = preferredCurrency.toUpperCase();
    }

    if (profilePic && profilePic.size > 0) {
      // Check if profilePic is a valid file object
      try {
        const compressionResult = await compressImage(profilePic);
        updateData.profilePic = compressionResult.data;
      } catch (compError) {
        if (compError instanceof HTTPException) throw compError;
        throw new HTTPException(500, { message: 'Failed to process profile picture.' });
      }
    } else if (payload.hasOwnProperty('profilePic') && profilePic === null) {
      // Allow explicitly setting profile pic to null/default
      updateData.profilePic = 'https://i.stack.imgur.com/l60Hf.png'; // Or your actual default
    }

    if (Object.keys(updateData).length <= 1) {
      // Only updatedAt added
      throw new HTTPException(400, { message: 'No valid update fields provided' });
    }

    const result = await db
      .update(User)
      .set(updateData)
      .where(eq(User.id, userId))
      .returning({
        // Return updated fields for confirmation
        name: User.name,
        preferredCurrency: User.preferredCurrency,
        profilePic: User.profilePic,
        updatedAt: User.updatedAt,
      })
      .catch((err) => {
        console.error('DB Error updating user:', err);
        throw new HTTPException(500, { message: 'Failed to update user profile.' });
      });

    if (result.length === 0) {
      throw new HTTPException(404, { message: 'User not found for update.' });
    }

    return {
      message: 'User updated successfully',
      data: result[0], // Return the updated data
    };
  }

  async updatePreferences(userId: string, preferredCurrency: string) {
    if (!preferredCurrency || preferredCurrency.length !== 3) {
      throw new HTTPException(400, { message: 'Invalid preferred currency (must be 3 letters).' });
    }

    const result = await db
      .update(User)
      .set({ preferredCurrency: preferredCurrency.toUpperCase(), updatedAt: new Date() })
      .where(eq(User.id, userId))
      .returning({ preferredCurrency: User.preferredCurrency }); // Confirm update

    if (result.length === 0) {
      throw new HTTPException(404, { message: 'User not found.' });
    }

    return { message: 'User preferences updated successfully' };
  }

  async getPreferences(userId: string) {
    const user = await db.query.User.findFirst({
      where: eq(User.id, userId),
      columns: { preferredCurrency: true },
    });

    if (!user) {
      throw new HTTPException(404, { message: 'User not found' });
    }
    return user;
  }

  async logout(userId: string) {
    // Invalidate the token by setting it to null in the DB
    const result = await db
      .update(User)
      .set({ token: null, updatedAt: new Date() }) // Clear token
      .where(eq(User.id, userId))
      .returning({ id: User.id }); // Confirm update occurred

    if (result.length === 0) {
      // This might happen if the user was already logged out or deleted
      console.warn(`Logout attempt for non-existent or already logged out user: ${userId}`);
      // Still return success as the state is effectively logged out
    }

    // Client-side should also clear its stored token upon receiving success
    return { message: 'User logged out successfully!' };
  }
}

export const userService = new UserService();
