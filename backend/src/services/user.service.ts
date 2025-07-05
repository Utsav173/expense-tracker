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
import { encryptApiKey } from '../utils/crypto.utils';
import { invitationService } from './invitation.service';

type UserInsert = InferInsertModel<typeof User>;
type LoginPayload = Pick<UserInsert, 'email' | 'password'>;
type SignupPayload = Pick<UserInsert, 'name' | 'email' | 'password'> & {
  profilePic?: any;
  token?: string;
};
export type UpdatePayload = Partial<Pick<UserInsert, 'name' | 'preferredCurrency'>> & {
  profilePic?: any;
};

interface UserJwtPayload {
  id: string;
  email: string;
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
        aiApiKeyEncrypted: true,
      },
    }).catch((err) => {
      console.error('DB Error in getMe:', err);
      throw new HTTPException(500, { message: 'Database error retrieving user.' });
    });

    if (!user) {
      throw new HTTPException(404, { message: 'User not found' });
    }

    return {
      ...user,
      hasAiApiKey: !!user.aiApiKeyEncrypted,
    };
  }

  async login(payload: LoginPayload) {
    const { email, password } = payload;
    const findUser = await db.query.User.findFirst({
      where: eq(User.email, email),
      columns: {
        id: true,
        name: true,
        email: true,
        password: true,
        profilePic: true,
        isSocial: true,
        isActive: true,
        preferredCurrency: true,
      },
    }).catch((err) => {
      console.error('DB Error in login (findUser):', err);
      throw new HTTPException(500, { message: 'Database error during login.' });
    });

    if (!findUser) throw new HTTPException(404, { message: 'User not found' });
    if (!findUser.isActive) throw new HTTPException(403, { message: 'User account is inactive.' });
    if (findUser.isSocial)
      throw new HTTPException(400, {
        message: 'Please log in using your social account provider.',
      });

    const isMatch = await bcrypt.compare(password, findUser.password).catch((err) => {
      console.error('Bcrypt compare error:', err);
      throw new HTTPException(500, { message: 'Error comparing password.' });
    });

    if (!isMatch) throw new HTTPException(401, { message: 'Invalid credentials' });

    const token = await sign(
      { id: findUser.id, email: findUser.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
      config.JWT_SECRET,
    );

    await db
      .update(User)
      .set({ token, lastLoginAt: new Date() })
      .where(eq(User.id, findUser.id))
      .catch((err) => {
        console.error('DB Error in login (updateToken):', err);
        throw new HTTPException(500, { message: 'Failed to update login state.' });
      });

    return {
      token,
      user: {
        id: findUser.id,
        name: findUser.name,
        email: findUser.email,
        profile: findUser.profilePic,
        preferredCurrency: findUser.preferredCurrency,
      },
    };
  }

  async signup(payload: SignupPayload) {
    const { name, email, password, profilePic, token } = payload;

    if (token) {
      // If a token is provided, verify it first
      const invitation = await invitationService.verifyInvitation(token);
      if (invitation.inviteeEmail !== email) {
        throw new HTTPException(400, { message: 'Email does not match invitation.' });
      }
    }

    const findUser = await db.query.User.findFirst({
      where: eq(User.email, email),
      columns: { id: true },
    }).catch((err) => {
      console.error('DB Error in signup (check existing):', err);
      throw new HTTPException(500, { message: 'Database error checking user existence.' });
    });

    if (findUser) {
      throw new HTTPException(409, { message: 'User with this email already exists' });
    }

    let profileUrl: string | undefined;
    if (profilePic && profilePic.size > 0) {
      try {
        const compressionResult = await compressImage(profilePic);
        profileUrl = compressionResult.data;
      } catch (compError) {
        if (compError instanceof HTTPException) throw compError;
        throw new HTTPException(500, { message: 'Failed to process profile picture.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const signupResult = await db.transaction(async (tx) => {
      const newUserResult = await tx
        .insert(User)
        .values({
          name: name,
          email: email,
          password: hashedPassword,
          profilePic: profileUrl,
          isSocial: false,
          preferredCurrency: 'INR',
          createdAt: new Date(),
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
        .values({ account: defaultAccount.id, user: newUser.id, createdAt: new Date() })
        .catch((err) => {
          throw new HTTPException(500, { message: `Analytics creation failed: ${err.message}` });
        });

      await tx
        .insert(Category)
        .values({ name: 'Default', owner: newUser.id, createdAt: new Date() })
        .catch((err) => {
          throw new HTTPException(500, {
            message: `Default category creation failed: ${err.message}`,
          });
        });

      if (token) {
        await invitationService.acceptInvitation(token, newUser.id, email);
      }

      return newUser;
    });

    await emailService.sendWelcomeEmail(signupResult.name, signupResult.email);

    return { message: 'User created successfully!' };
  }

  async forgotPassword(email: string) {
    if (!email) {
      throw new HTTPException(400, { message: 'Email is required' });
    }
    const validUser = await db.query.User.findFirst({
      where: eq(User.email, email),
      columns: { id: true, name: true, email: true, isActive: true },
    });
    if (validUser && validUser.isActive) {
      try {
        const token = await sign({ id: validUser.id, email: validUser.email }, config.JWT_SECRET);
        await db.update(User).set({ resetPasswordToken: token }).where(eq(User.email, email));
        await emailService.sendForgotPasswordEmail(validUser.name, validUser.email, token);
      } catch (error: any) {
        console.error('Forgot Password Error (Token/DB/Email):', error);
      }
    } else {
      if (!validUser) console.warn(`Password reset requested for non-existent email: ${email}`);
      else console.warn(`Password reset requested for inactive user: ${email}`);
    }
    return {
      message:
        'If a user with that email exists and is active, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, password: string) {
    if (!password || !token)
      throw new HTTPException(400, { message: 'Password and reset password token are required' });
    if (password.length < 8)
      throw new HTTPException(400, { message: 'Password must be at least 8 characters long' });

    let payload: UserJwtPayload;
    try {
      const unknownPayload = await verify(token, config.JWT_SECRET);
      if (
        typeof unknownPayload !== 'object' ||
        unknownPayload === null ||
        typeof unknownPayload.id !== 'string' ||
        typeof unknownPayload.email !== 'string'
      ) {
        throw new Error('Invalid token payload structure');
      }
      payload = unknownPayload as unknown as UserJwtPayload;
    } catch (e: any) {
      throw new HTTPException(401, {
        message: `Invalid or expired reset password token: ${e.message}`,
      });
    }

    const user = await db.query.User.findFirst({
      where: and(eq(User.email, payload.email), eq(User.isActive, true)),
      columns: { resetPasswordToken: true },
    });
    if (!user || user.resetPasswordToken !== token) {
      throw new HTTPException(400, {
        message: 'Reset token mismatch, already used, or user inactive.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .update(User)
      .set({ password: hashedPassword, resetPasswordToken: null, updatedAt: new Date() })
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
      try {
        const compressionResult = await compressImage(profilePic);
        updateData.profilePic = compressionResult.data;
      } catch (compError) {
        if (compError instanceof HTTPException) throw compError;
        throw new HTTPException(500, { message: 'Failed to process profile picture.' });
      }
    } else if (payload.hasOwnProperty('profilePic') && profilePic === null) {
      updateData.profilePic = 'https://i.stack.imgur.com/l60Hf.png';
    }

    if (Object.keys(updateData).length <= 1) {
      throw new HTTPException(400, { message: 'No valid update fields provided' });
    }

    const result = await db
      .update(User)
      .set(updateData)
      .where(eq(User.id, userId))
      .returning({
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
    return { message: 'User updated successfully', data: result[0] };
  }

  async updateUserAiApiKey(userId: string, apiKey: string | null) {
    let encryptedKey: string | null = null;
    if (apiKey && apiKey.trim() !== '') {
      if (!apiKey.startsWith('sk-') && !apiKey.startsWith('AIza')) {
        console.warn('API key format might be unusual, proceeding with encryption.');
      }
      try {
        encryptedKey = await encryptApiKey(apiKey);
      } catch (error) {
        console.error(`Encryption error for user ${userId}:`, error);
        throw new HTTPException(500, { message: 'Failed to secure API key.' });
      }
    }

    const result = await db
      .update(User)
      .set({ aiApiKeyEncrypted: encryptedKey, updatedAt: new Date() })
      .where(eq(User.id, userId))
      .returning({ id: User.id });

    if (result.length === 0) {
      throw new HTTPException(404, { message: 'User not found.' });
    }

    return { message: apiKey ? 'AI API Key saved successfully.' : 'AI API Key removed.' };
  }

  async updatePreferences(userId: string, preferredCurrency: string) {
    if (!preferredCurrency || preferredCurrency.length !== 3) {
      throw new HTTPException(400, { message: 'Invalid preferred currency (must be 3 letters).' });
    }

    const result = await db
      .update(User)
      .set({ preferredCurrency: preferredCurrency.toUpperCase(), updatedAt: new Date() })
      .where(eq(User.id, userId))
      .returning({ preferredCurrency: User.preferredCurrency });

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
    const result = await db
      .update(User)
      .set({ token: null, updatedAt: new Date() })
      .where(eq(User.id, userId))
      .returning({ id: User.id });

    if (result.length === 0) {
      console.warn(`Logout attempt for non-existent or already logged out user: ${userId}`);
    }
    return { message: 'User logged out successfully!' };
  }
}

export const userService = new UserService();
