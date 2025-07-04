import { MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';
import { db } from '../database';
import { config } from '../config';
import { eq } from 'drizzle-orm';
import { User } from '../database/schema';
import { routePath } from 'hono/route';

const authMiddleware: MiddlewareHandler<any> = async (c, next) => {
  try {
    const path = routePath(c);
    if (path === '/download/:fileId') {
      return next();
    } else {
      const authorizationHeader = c.req.raw.headers.get('authorization');

      if (!authorizationHeader) {
        throw new HTTPException(403, {
          message: 'Authorization header not found',
        });
      }

      const token = authorizationHeader.split(' ')[1];
      if (!token) {
        throw new HTTPException(403, { message: 'Token not found' });
      }

      const data = await verify(token, config.JWT_SECRET);

      if (!data) {
        throw new HTTPException(403, { message: 'Invalid token' });
      } else {
        const findUser = await db.query.User.findFirst({
          where: eq(User.id, data.id as string),
        });

        if (!findUser) {
          throw new HTTPException(404, { message: 'User not found' });
        }

        c.set('userId', findUser.id);

        return next();
      }
    }
  } catch (error: Error | any) {
    throw new HTTPException(403, { message: error.message });
  }
};

export default authMiddleware;
