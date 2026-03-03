import { z } from "zod";
import { Types } from "mongoose";
import { Invitation } from "../../models/Invitation";
import { Membership, type OrgRole } from "../../models/Membership";
import { Organization } from "../../models/Organization";
import { requireAuth, requireOrgRole } from "../../rbac/guards";
import { generateInviteToken, hashToken } from "../../utils/tokens";

const inviteSchema = z.object({
  orgId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]),
});

const acceptSchema = z.object({
  token: z.string().min(10),
});

export const inviteResolvers = {
  inviteMember: async (_: any, args: any, ctx: any) => {
    const userId = requireAuth(ctx);
    const { orgId, email, role } = inviteSchema.parse(args);

    // Only ADMIN can invite
    await requireOrgRole({ userId, orgId, allowed: ["ADMIN"] });

    // Ensure org exists
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    // Create token + hash
    const token = generateInviteToken();
    const tokenHash = hashToken(token);

    // Expires in 7 days (need to adjust later)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create invite (unique active invite constraint helps avoid duplicates)
    const invite = await Invitation.create({
      orgId: new Types.ObjectId(orgId),
      email: email.toLowerCase(),
      role: role as OrgRole,
      tokenHash,
      expiresAt,
      acceptedAt: null,
      acceptedBy: null,
    });

    return {
      id: invite._id.toString(),
      orgId: invite.orgId.toString(),
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
      acceptedAt: invite.acceptedAt ? invite.acceptedAt.toISOString() : null,
      token, // returned ONLY once
    };
  },

  acceptInvite: async (_: any, args: any, ctx: any) => {
    const userId = requireAuth(ctx);
    const { token } = acceptSchema.parse(args);

    const tokenHash = hashToken(token);

    const invite = await Invitation.findOne({ tokenHash });
    if (!invite) throw new Error("Invalid invite token");

    if (invite.acceptedAt) throw new Error("Invite already accepted");

    if (invite.expiresAt.getTime() < Date.now()) throw new Error("Invite expired");

    // Create membership (if already a member, this will throw due to unique index)
    const membership = await Membership.create({
      userId: new Types.ObjectId(userId),
      orgId: invite.orgId,
      role: invite.role,
    });

    // Mark invite accepted
    invite.acceptedAt = new Date();
    invite.acceptedBy = new Types.ObjectId(userId);
    await invite.save();

    return {
      id: membership._id.toString(),
      role: membership.role,
      orgId: membership.orgId.toString(),
    };
  },
};