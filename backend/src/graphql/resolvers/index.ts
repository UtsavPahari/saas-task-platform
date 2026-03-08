import type { SignOptions } from "jsonwebtoken";
import { buildAuthResolvers } from "./auth.resolvers";
import { userResolvers } from "./user.resolvers";
import { orgResolvers } from "./org.resolvers";
import { inviteResolvers } from "./invite.resolvers";
import { projectTaskResolvers } from "./project-task.resolvers";

export function buildResolvers(env: { JWT_SECRET: string; JWT_EXPIRES_IN: SignOptions["expiresIn"] }) {
  const auth = buildAuthResolvers(env);

  return {
    Query: {
      health: () => "ok",
      me: userResolvers.me,
      myOrganizations: orgResolvers.myOrganizations,
      orgProjects: projectTaskResolvers.orgProjects,
      projectTasks: projectTaskResolvers.projectTasks,
      orgDashboard: projectTaskResolvers.orgDashboard,
    },
    Mutation: {
      register: auth.register,
      login: auth.login,
      createOrganization: orgResolvers.createOrganization,
      addMember: orgResolvers.addMember,
      inviteMember: inviteResolvers.inviteMember,
      acceptInvite: inviteResolvers.acceptInvite,
      createProject: projectTaskResolvers.createProject,
      createTask: projectTaskResolvers.createTask,
      updateTaskStatus: projectTaskResolvers.updateTaskStatus,
},
    Membership: orgResolvers.Membership,
  };
}