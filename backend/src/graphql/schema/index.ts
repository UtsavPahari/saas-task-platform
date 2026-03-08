import { gql } from "graphql-tag";

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  enum OrgRole {
    ADMIN
    MANAGER
    MEMBER
  }

  type Organization {
    id: ID!
    name: String!
    createdAt: String!
  }

  type Membership {
    id: ID!
    role: OrgRole!
    org: Organization!
  }

  type Query {
    health: String!
    me: User
    myOrganizations: [Membership!]!
    orgProjects(orgId: ID!): [Project!]!
    projectTasks(projectId: ID!): [Task!]!
    orgDashboard(orgId: ID!): OrgDashboard!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createOrganization(name: String!): Organization!
    addMember(orgId: ID!, email: String!, role: OrgRole!): Membership!
    createProject(orgId: ID!, name: String!, description: String): Project!
    createTask(orgId: ID!, projectId: ID!, title: String!, description: String): Task!
    updateTaskStatus(taskId: ID!, status: TaskStatus!): Task!
  }

  type Invite {
  id: ID!
  orgId: ID!
  email: String!
  role: OrgRole!
  expiresAt: String!
  acceptedAt: String
  # token returned only at creation time
  token: String
}

extend type Mutation {
  inviteMember(orgId: ID!, email: String!, role: OrgRole!): Invite!
  acceptInvite(token: String!): Membership!
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

type Project {
  id: ID!
  orgId: ID!
  name: String!
  description: String
  createdAt: String!
}

type Task {
  id: ID!
  orgId: ID!
  projectId: ID!
  title: String!
  description: String
  status: TaskStatus!
  assigneeId: ID
  createdAt: String!
}

type TaskStatusCounts {
  todo: Int!
  inProgress: Int!
  done: Int!
}

type OrgDashboard {
  totalProjects: Int!
  totalTasks: Int!
  tasksByStatus: TaskStatusCounts!
}
`;