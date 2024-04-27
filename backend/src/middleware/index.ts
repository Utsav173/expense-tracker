import { MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';
import { db } from '../database';

// Define the authMiddleware function, which takes a context and a next function as arguments
const authMiddleware: MiddlewareHandler<any> = async (c, next) => {
  try {
    // Check if the request path is for file downloads, if so, skip authentication
    if (c.req.routePath === '/download/:fileId') {
      return next();
    } else {
      // Get the authorization header from the request
      const authorizationHeader = c.req.raw.headers.get('authorization');

      // If no authorization header is present, throw an error
      if (!authorizationHeader) {
        throw new HTTPException(403, {
          message: 'Authorization header not found',
        });
      }

      // Extract the token from the authorization header
      const token = authorizationHeader.split(' ')[1];
      if (!token) {
        throw new HTTPException(403, { message: 'Token not found' });
      }

      // Verify the token using the "secret" key
      const data = await verify(token, 'secret');

      // If the token is invalid, throw an error
      if (!data) {
        throw new HTTPException(403, { message: 'Invalid token' });
      } else {
        // If the token is valid, find the user in the database
        const findUser = await db.query.User.findFirst({
          where(fields, operators) {
            return operators.eq(fields.id, data.id);
          },
        });

        // If the user is not found, throw an error
        if (!findUser) {
          throw new HTTPException(404, { message: 'User not found' });
        }

        // Set the userId in the context for later use
        c.set('userId', findUser.id);

        // Continue processing the request
        return next();
      }
    }
  } catch (error: Error | any) {
    // If any errors occur, throw a 403 error with the error message
    throw new HTTPException(403, { message: error.message });
  }
};

// Export the authMiddleware function
export default authMiddleware;
