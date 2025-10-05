// This file contains averything from index.ts but instead of
// listening on any port it is exported to test files

import Fastify from "fastify";
import { registerUser } from "./services/auth.service.ts";
import { loginUser } from "./services/auth.service.ts";

const app = Fastify({
  logger: true,
});

app.get("/", async (_request, _reply) => {
  //It simply sends back a JSON object.
  return { hello: "auth-service" };
});

interface IRegisterBody {
  email: string;
  password: string;
}

app.post<{ Body: IRegisterBody }>(
  "/api/register",
  async (_request, _reply) => {
    try {
      app.log.info("Registering user");
      const newUser = await registerUser(
        _request.body.email,
        _request.body.password,
      );
      app.log.info("User registered!");
      console.log(newUser);
      _reply.status(200).send(newUser);
    } catch (err) {
      app.log.error(err);
      _reply.status(400).send({ error: "User already exists" });
    }
  },
);

interface ILoginBody {
  email: string;
  password: string;
}

app.post<{ Body: ILoginBody }>("/api/login", async (_request, _reply) => {
  try {
    const token = await loginUser(_request.body.email, _request.body.password);
    _reply.status(200).send({ accessToken: token });
  } catch (err) {
    app.log.error(err);
    _reply.status(401).send({ error: "Invalid email or password" });
  }
});

export default app