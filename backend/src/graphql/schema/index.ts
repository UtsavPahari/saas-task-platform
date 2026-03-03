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
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createOrganization(name: String!): Organization!
    addMember(orgId: ID!, email: String!, role: OrgRole!): Membership!
  }
`;