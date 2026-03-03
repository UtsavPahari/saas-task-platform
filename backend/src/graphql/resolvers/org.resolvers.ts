import { z } from "zod";
import { Types } from "mongoose";
import { Organization } from "../../models/Organization";
import { Membership, type OrgRole } from "../../models/Membership";
import { User } from "../../models/User";
import { requireAuth, requireOrgRole } from "../../rbac/guards";

const createOrgSchema = z.object({
  name: z.string().min(2),
});

const addMemberSchema = z.object({
  orgId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]),
});

export const orgResolvers = {
  // Query
  myOrganizations: async (_: any, __: any, ctx: any) => {
    const userId = requireAuth(ctx);

    const memberships = await Membership.find({ userId: new Types.ObjectId(userId) }).sort({
      createdAt: -1,
    });

    // We return Membership objects; GraphQL field resolver below will resolve "org"
    return memberships.map((m) => ({
      id: m._id.toString(),
      role: m.role,
      orgId: m.orgId.toString(),
    }));
  },

  // Mutation
  createOrganization: async (_: any, args: any, ctx: any) => {
    const userId = requireAuth(ctx);
    const { name } = createOrgSchema.parse(args);

    const org = await Organization.create({ name });

    // creator becomes ADMIN
    await Membership.create({
      userId: new Types.ObjectId(userId),
      orgId: org._id,
      role: "ADMIN",
    });

    return {
      id: org._id.toString(),
      name: org.name,
      createdAt: org.createdAt.toISOString(),
    };
  },

  addMember: async (_: any, args: any, ctx: any) => {
    const userId = requireAuth(ctx);
    const { orgId, email, role } = addMemberSchema.parse(args);

    // Only ADMIN can add members
    await requireOrgRole({ userId, orgId, allowed: ["ADMIN"] });

    const invited = await User.findOne({ email });
    if (!invited) throw new Error("User not found. Ask them to register first.");

    const membership = await Membership.create({
      userId: invited._id,
      orgId: new Types.ObjectId(orgId),
      role: role as OrgRole,
    });

    return {
      id: membership._id.toString(),
      role: membership.role,
      orgId: membership.orgId.toString(),
    };
  },

  // Field resolver for Membership.org
  Membership: {
    org: async (parent: any) => {
      const org = await Organization.findById(parent.orgId);
      if (!org) throw new Error("Organization not found");

      return {
        id: org._id.toString(),
        name: org.name,
        createdAt: org.createdAt.toISOString(),
      };
    },
  },
};