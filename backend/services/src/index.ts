// Import the Fastify framework
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { registerUser } from "./services/auth.service";

// Interface for the request body
interface IRegisterBody {
  email: string;
  password: string;
}

// Interface for error objects
interface AppError {
  message: string;
}

const isAppError = (error: unknown): error is AppError => {
  return typeof error === "object" && error !== null && "message" in error;
}

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
server.get("/", async (_request, _reply) => {
  //It simply sends back a JSON object.
  return { hello: "auth-service" };
});

server.post<{Body: IRegisterBody}>("/api/register", async (_request, _reply) => {
  try {
    server.log.info("Registering user");
    console.log(_request.body);
    const newUser = await registerUser(_request.body.email, _request.body.password);
    server.log.info("User registered!")
    console.log(newUser);
    _reply.status(200).send(newUser);
  } catch (err) {
    if (isAppError(err)) {
      _reply.status(400).send({ error: err.message });
    }
    server.log.error(err)
  }
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
