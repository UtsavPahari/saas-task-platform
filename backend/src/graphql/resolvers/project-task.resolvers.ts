import { z } from "zod";
import { Types } from "mongoose";
import { Project } from "../../models/Project";
import { Task, type TaskStatus } from "../../models/Task";
import { requireAuth, requireOrgRole } from "../../rbac/guards";

const createProjectSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
});

const createTaskSchema = z.object({
  orgId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
});

const updateTaskStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});

export const projectTaskResolvers = {
  
  // Queries
  
  orgProjects: async (_: any, args: any, ctx: any) => {
    const userId = requireAuth(ctx);
    const orgId = args.orgId as string;

    // Any member can view projects in their org
    await requireOrgRole({
      userId,
      orgId,
      allowed: ["ADMIN", "MANAGER", "MEMBER"],
    });

    const projects = await Project.find({
      orgId: new Types.ObjectId(orgId),
    }).sort({ createdAt: -1 });

    return projects.map((project) => ({
      id: project._id.toString(),
      orgId: project.orgId.toString(),
      name: project.name,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
    }));
  },

  projectTasks: async (_: any, args: any, ctx: any) => {
    const userId = requireAuth(ctx);
    const projectId = args.projectId as string;

    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    // Any member in the org can view tasks in the project
    await requireOrgRole({
      userId,
      orgId: project.orgId.toString(),
      allowed: ["ADMIN", "MANAGER", "MEMBER"],
    });

    const tasks = await Task.find({
      projectId: project._id,
      orgId: project.orgId,
    }).sort({ createdAt: -1 });

    return tasks.map((task) => ({
      id: task._id.toString(),
      orgId: task.orgId.toString(),
      projectId: task.projectId.toString(),
      title: task.title,
      description: task.description,
      status: task.status,
      assigneeId: task.assigneeId ? task.assigneeId.toString() : null,
      createdAt: task.createdAt.toISOString(),
    }));
  },

  orgDashboard: async (_: any, args: any, ctx: any) => {
    const userId = requireAuth(ctx);
    const orgId = args.orgId as string;

    await requireOrgRole({
      userId,
      orgId,
      allowed: ["ADMIN", "MANAGER", "MEMBER"],
    });

    const orgObjectId = new Types.ObjectId(orgId);

    const [totalProjects, totalTasks, todo, inProgress, done] = await Promise.all([
      Project.countDocuments({ orgId: orgObjectId }),
      Task.countDocuments({ orgId: orgObjectId }),
      Task.countDocuments({ orgId: orgObjectId, status: "TODO" }),
      Task.countDocuments({ orgId: orgObjectId, status: "IN_PROGRESS" }),
      Task.countDocuments({ orgId: orgObjectId, status: "DONE" }),
    ]);

    return {
      totalProjects,
      totalTasks,
      tasksByStatus: {
        todo,
        inProgress,
        done,
      },
    };
  },

  
  // Mutations
  
  createProject: async (_: any, args: any, ctx: any) => {
    const userId = requireAuth(ctx);
    const { orgId, name, description } = createProjectSchema.parse(args);

    // Only ADMIN / MANAGER can create projects
    await requireOrgRole({
      userId,
      orgId,
      allowed: ["ADMIN", "MANAGER"],
    });

    const project = await Project.create({
      orgId: new Types.ObjectId(orgId),
      name,
      description: description || "",
      createdBy: new Types.ObjectId(userId),
    });

    return {
      id: project._id.toString(),
      orgId: project.orgId.toString(),
      name: project.name,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
    };
  },

  createTask: async (_: any, args: any, ctx: any) => {
    const userId = requireAuth(ctx);
    const { orgId, projectId, title, description } = createTaskSchema.parse(args);

    // Only ADMIN / MANAGER can create tasks
    await requireOrgRole({
      userId,
      orgId,
      allowed: ["ADMIN", "MANAGER"],
    });

    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    // Important tenant safety check:
    // project must belong to the org passed in args
    if (project.orgId.toString() !== orgId) {
      throw new Error("Project does not belong to this organization");
    }

    const task = await Task.create({
      orgId: new Types.ObjectId(orgId),
      projectId: new Types.ObjectId(projectId),
      title,
      description: description || "",
      status: "TODO",
      assigneeId: null,
      createdBy: new Types.ObjectId(userId),
    });

    return {
      id: task._id.toString(),
      orgId: task.orgId.toString(),
      projectId: task.projectId.toString(),
      title: task.title,
      description: task.description,
      status: task.status,
      assigneeId: null,
      createdAt: task.createdAt.toISOString(),
    };
  },

  updateTaskStatus: async (_: any, args: any, ctx: any) => {
    const userId = requireAuth(ctx);
    const { taskId, status } = updateTaskStatusSchema.parse(args);

    const task = await Task.findById(taskId);
    if (!task) throw new Error("Task not found");

    // First, confirming the user belongs to the org
    const membership = await requireOrgRole({
      userId,
      orgId: task.orgId.toString(),
      allowed: ["ADMIN", "MANAGER", "MEMBER"],
    });

    // If MEMBER then they can only update tasks assigned to them
    if (membership.role === "MEMBER") {
      if (!task.assigneeId || task.assigneeId.toString() !== userId) {
        throw new Error("Members can only update tasks assigned to them");
      }
    }

    task.status = status as TaskStatus;
    await task.save();

    return {
      id: task._id.toString(),
      orgId: task.orgId.toString(),
      projectId: task.projectId.toString(),
      title: task.title,
      description: task.description,
      status: task.status,
      assigneeId: task.assigneeId ? task.assigneeId.toString() : null,
      createdAt: task.createdAt.toISOString(),
    };
  },
};