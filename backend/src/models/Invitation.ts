import { Schema, model, Types } from "mongoose";
import type { OrgRole } from "./Membership";

export interface IInvitation {
  orgId: Types.ObjectId;
  email: string;
  role: OrgRole;
  tokenHash: string;
  expiresAt: Date;
  acceptedAt?: Date | null;
  acceptedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, required: true, enum: ["ADMIN", "MANAGER", "MEMBER"] },

    // IMPORTANT: store hash, not raw token
    tokenHash: { type: String, required: true, unique: true },

    expiresAt: { type: Date, required: true, index: true },

    acceptedAt: { type: Date, default: null },
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Prevent spamming same email with multiple active invites per org
invitationSchema.index(
  { orgId: 1, email: 1, acceptedAt: 1 },
  { unique: true, partialFilterExpression: { acceptedAt: null } }
);

export const Invitation = model<IInvitation>("Invitation", invitationSchema);