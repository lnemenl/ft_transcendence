import Fastify from 'fastify';
import dotenv from 'dotenv';
import jwtPlugin from './plugins/jwt';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import userRoutes from './routes/user';

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

// Initialize a Fastify server instance
// Send logs through the pino-pretty module
const app = Fastify(
  process.env.NODE_ENV !== 'test'
    ? {
        logger: {
          transport: {
            target: 'pino-pretty', // Use pino-pretty for nicely formatted logs
          },
        },
      }
    : {},
);

// Registering plugins
app.register(jwtPlugin);

// Registering routes under /api
app.register(authRoutes, { prefix: '/api' });
app.register(profileRoutes, { prefix: '/api' });
app.register(userRoutes, { prefix: '/api/users' });

// Define a basic "route". This tells the server what to do when it
// receives a GET request to the main URL ("/").
app.get('/', async () => ({ hello: 'auth-service' }));

// Only listen if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const start = async () => {
    try {
      await app.listen({ port: 3011, host: '0.0.0.0' });
      app.log.info('Server started');
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}

export default app;
