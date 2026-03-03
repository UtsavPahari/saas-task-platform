import { Types } from "mongoose";
import { Membership, type OrgRole } from "../models/Membership";

export function requireAuth(ctx: { userId?: string }) {
  if (!ctx.userId) throw new Error("Not authenticated");
  return ctx.userId;
}

export async function requireOrgRole(params: {
  userId: string;
  orgId: string;
  allowed: OrgRole[];
}) {
  const { userId, orgId, allowed } = params;

  const membership = await Membership.findOne({
    userId: new Types.ObjectId(userId),
    orgId: new Types.ObjectId(orgId),
  });

  if (!membership) throw new Error("Access denied (not a member of this organization)");

  if (!allowed.includes(membership.role)) {
    throw new Error("Access denied (insufficient role)");
  }

  return membership;
}