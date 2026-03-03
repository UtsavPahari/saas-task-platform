import { Schema, model, Types } from "mongoose";

export type OrgRole = "ADMIN" | "MANAGER" | "MEMBER";

export interface IMembership {
  userId: Types.ObjectId;
  orgId: Types.ObjectId;
  role: OrgRole;
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    role: { type: String, required: true, enum: ["ADMIN", "MANAGER", "MEMBER"] },
  },
  { timestamps: true }
);

// One user can have only one membership per org
membershipSchema.index({ userId: 1, orgId: 1 }, { unique: true });

export const Membership = model<IMembership>("Membership", membershipSchema);