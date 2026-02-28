import { User } from "../../models/User";

export const userResolvers = {
  me: async (_: any, __: any, ctx: any) => {
    if (!ctx.userId) return null;

    const user = await User.findById(ctx.userId);
    if (!user) return null;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  },
};