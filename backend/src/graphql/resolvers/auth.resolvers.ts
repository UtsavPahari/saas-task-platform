import bcrypt from "bcrypt";
import type { SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { User } from "../../models/User";
import { signToken } from "../../auth/jwt";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function buildAuthResolvers(env: { JWT_SECRET: string; JWT_EXPIRES_IN: SignOptions["expiresIn"] }) {
  return {
    register: async (_: any, args: any) => {
      // 1) validate input
      const { name, email, password } = registerSchema.parse(args);

      // 2) check duplicate email
      const exists = await User.findOne({ email });
      if (exists) throw new Error("Email already in use");

      // 3) hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // 4) create user
      const user = await User.create({ name, email, passwordHash });

      // 5) sign JWT
      const token = signToken(user._id.toString(), env.JWT_SECRET, env.JWT_EXPIRES_IN);

      return {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        },
      };
    },

    login: async (_: any, args: any) => {
      // 1) validate input
      const { email, password } = loginSchema.parse(args);

      // 2) find user
      const user = await User.findOne({ email });
      if (!user) throw new Error("Invalid credentials");

      // 3) compare password
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new Error("Invalid credentials");

      // 4) sign JWT
      const token = signToken(user._id.toString(), env.JWT_SECRET, env.JWT_EXPIRES_IN);

      return {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        },
      };
    },
  };
}