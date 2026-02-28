import type { SignOptions } from "jsonwebtoken";
import { buildAuthResolvers } from "./auth.resolvers";
import { userResolvers } from "./user.resolvers";

export function buildResolvers(env: { JWT_SECRET: string; JWT_EXPIRES_IN: SignOptions["expiresIn"] }) {
  const auth = buildAuthResolvers(env);

  return {
    Query: {
      health: () => "ok",
      me: userResolvers.me,
    },
    Mutation: {
      register: auth.register,
      login: auth.login,
    },
  };
}