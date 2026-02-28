import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";

import { connectDB } from "./config/db";
import { typeDefs } from "./graphql/schema";
import { buildResolvers } from "./graphql/resolvers";
import { verifyToken } from "./auth/jwt";

async function main() {
  // 1) Read config from .env
  const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
  const MONGODB_URI = process.env.MONGODB_URI;

  // JWT settings (used for signing/verifying tokens)
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

  // 2) Validate required env vars early (fail fast)
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI in .env");
  if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in .env");

  // 3) Connect to MongoDB before starting the server
  await connectDB(MONGODB_URI);

  // 4) Create Express app (HTTP server)
  const app = express();
  app.use(cors());
  app.use(express.json());

  // 5) Create Apollo GraphQL server
  const server = new ApolloServer({
    typeDefs,
    resolvers: buildResolvers({ JWT_SECRET, JWT_EXPIRES_IN }),
  });

  // Apollo must be started before we attach middleware
  await server.start();

  // 6) Attach GraphQL endpoint + Context
  // Context runs for EVERY request. It's the right place to:
  // - read the Authorization header
  // - verify the JWT
  // - expose userId to resolvers
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        let userId: string | undefined = undefined;

        if (token) {
          try {
            userId = verifyToken(token, JWT_SECRET).userId;
          } catch {
            // invalid/expired token -> user stays unauthenticated
            userId = undefined;
          }
        }

        return { userId };
      },
    })
  );

  // 7) Start listening
  app.listen(PORT, () => {
    console.log(`🚀 GraphQL running at http://localhost:${PORT}/graphql`);
  });
}

main().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});