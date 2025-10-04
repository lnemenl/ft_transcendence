// Import the Fastify framework
import Fastify from "fastify";
import { registerUser } from "./services/auth.service.ts";
import { loginUser } from "./services/auth.service.ts";

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

interface IRegisterBody {
  email: string;
  password: string;
}

server.post<{ Body: IRegisterBody }>(
  "/api/register",
  async (_request, _reply) => {
    try {
      server.log.info("Registering user");
      const newUser = await registerUser(
        _request.body.email,
        _request.body.password,
      );
      server.log.info("User registered!");
      console.log(newUser);
      _reply.status(200).send(newUser);
    } catch (err) {
      server.log.error(err);
      _reply.status(400).send({ error: "User already exists" });
    }
  },
);

interface ILoginBody {
  email: string;
  password: string;
}

server.post<{ Body: ILoginBody }>("/api/login", async (_request, _reply) => {
  try {
    const token = await loginUser(_request.body.email, _request.body.password);
    _reply.status(200).send({ accessToken: token });
  } catch (err) {
    server.log.error(err);
    _reply.status(401).send({ error: "Invalid email or password" });
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
