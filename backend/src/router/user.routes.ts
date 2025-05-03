// src/router/user.routes.ts
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { loginSchema, userSchema, updateUserSchema } from '../utils/schema.validations';
import authMiddleware from '../middleware';
import { UpdatePayload, userService } from '../services/user.service'; // Import the service

const userRouter = new Hono();

userRouter.get('/me', authMiddleware, async (c) => {
  const userId = await c.get('userId');
  try {
    const user = await userService.getMe(userId);
    return c.json(user);
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: error.message });
  }
});

userRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const payload = await c.req.json();
    const result = await userService.login(payload);
    return c.json({ data: result });
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: error.message });
  }
});

userRouter.post('/signup', zValidator('form', userSchema), async (c) => {
  try {
    const formData = await c.req.formData();
    const payload = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      profilePic: formData.get('profilePic'), // Service handles compression
    };
    const result = await userService.signup(payload);
    c.status(201);
    return c.json(result);
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: error.message });
  }
});

userRouter.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    const result = await userService.forgotPassword(email);
    return c.json(result);
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: error.message });
  }
});

userRouter.post('/reset-password', async (c) => {
  try {
    const { password, resetPasswordToken } = await c.req.json();
    const result = await userService.resetPassword(resetPasswordToken, password);
    return c.json(result);
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: error.message });
  }
});

userRouter.put('/update', authMiddleware, zValidator('form', updateUserSchema), async (c) => {
  try {
    const userId = await c.get('userId');
    const formData = await c.req.formData();

    // Construct the payload explicitly matching UpdatePayload
    const payload = {} as UpdatePayload;
    if (formData.has('name')) {
      payload.name = formData.get('name') as string;
    }
    if (formData.has('preferredCurrency')) {
      payload.preferredCurrency = formData.get('preferredCurrency') as string;
    }
    if (formData.has('profilePic')) {
      payload.profilePic = formData.get('profilePic') as string;
    }

    // Validate if the constructed payload is empty (only if all fields are optional)
    if (Object.keys(payload).length === 0) {
      throw new HTTPException(400, { message: 'No update fields provided in form data.' });
    }

    const result = await userService.updateUser(userId, payload); // Pass the correctly typed payload
    return c.json(result);
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    console.error('Update user error:', error); // Log the actual error server-side
    throw new HTTPException(500, { message: 'Something went wrong during user update.' });
  }
});

userRouter.put('/preferences', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId');
    const { preferredCurrency } = await c.req.json();
    if (typeof preferredCurrency !== 'string') {
      throw new HTTPException(400, { message: 'preferredCurrency must be a string.' });
    }
    const result = await userService.updatePreferences(userId, preferredCurrency);
    return c.json(result);
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: error.message });
  }
});

userRouter.get('/preferences', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId');
    const result = await userService.getPreferences(userId);
    return c.json(result);
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: error.message });
  }
});

userRouter.post('/logout', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId');
    const result = await userService.logout(userId);
    return c.json(result);
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: error.message });
  }
});

userRouter.get('/hc', (c) => {
  return c.json({ message: 'Hello Health Checkers!' });
});

export default userRouter;
