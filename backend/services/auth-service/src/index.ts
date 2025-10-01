// Import the Fastify framework
import Fastify, { FastifyRequest, FastifyReply } from "fastify";

// Initialize a Fastify server instance
// The logger option is great for development. It prints out information
// about incoming requests and server status
const server = Fastify({
  logger: {
    transport: {
      target: "pino-pretty", // Use pino-pretty for nicely formatted logs
    },
  },
});

// Define a basic "route". This tells the server what to do when it
// receives a GET request to the main URL ("/").
server.get("/", async (_request: FastifyRequest, _reply: FastifyReply) => {
  //It simply sends back a JSON object.
  return { hello: "auth-service" };
});

// A function to start the server
const start = async () => {
  try {
    // Tell the server to listen for requests on port 3001
    await server.listen({ port: 3011, host: "0.0.0.0" });
  } catch (err) {
    // If something goes wrong on startup, log the error and exit
    server.log.error(err);
    process.exit(1);
  }
};

// Call the start function to get everything running
start();
