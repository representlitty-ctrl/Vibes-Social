import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertProjectSchema, insertProfileSchema, insertProjectCommentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Helper to get user ID from request
  const getUserId = (req: any): string | undefined => {
    return req.user?.claims?.sub;
  };

  // Profile routes
  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const profile = await storage.getProfile(userId);
      res.json(profile || {});
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = insertProfileSchema.parse(req.body);
      const profile = await storage.upsertProfile(userId, data);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = getUserId(req);
      const profile = await storage.getProfileWithUser(userId, currentUserId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const currentUserId = getUserId(req);
      const projects = await storage.getProjects(currentUserId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/featured", async (req, res) => {
    try {
      const currentUserId = getUserId(req);
      const projects = await storage.getFeaturedProjects(currentUserId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching featured projects:", error);
      res.status(500).json({ message: "Failed to fetch featured projects" });
    }
  });

  app.get("/api/projects/mine", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const projects = await storage.getProjectsMine(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching user projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = getUserId(req);
      const project = await storage.getProjectById(id, currentUserId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(userId, data);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const data = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, userId, data);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.deleteProject(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Project upvote routes
  app.post("/api/projects/:id/upvote", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.upvoteProject(id, userId);
      res.status(201).json({ message: "Upvoted" });
    } catch (error) {
      console.error("Error upvoting project:", error);
      res.status(500).json({ message: "Failed to upvote project" });
    }
  });

  app.delete("/api/projects/:id/upvote", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.removeProjectUpvote(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing upvote:", error);
      res.status(500).json({ message: "Failed to remove upvote" });
    }
  });

  // Project comment routes
  app.get("/api/projects/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await storage.getProjectComments(id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/projects/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Content is required" });
      }

      const comment = await storage.createProjectComment(id, userId, content.trim());
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/projects/:projectId/comments/:commentId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { commentId } = req.params;
      await storage.deleteProjectComment(commentId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // User projects route
  app.get("/api/users/:userId/projects", async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = getUserId(req);
      const projects = await storage.getProjectsByUser(userId, currentUserId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching user projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Follow routes
  app.post("/api/users/:userId/follow", isAuthenticated, async (req, res) => {
    try {
      const followerId = getUserId(req);
      if (!followerId) return res.status(401).json({ message: "Unauthorized" });

      const { userId } = req.params;
      await storage.followUser(followerId, userId);
      res.status(201).json({ message: "Following" });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:userId/follow", isAuthenticated, async (req, res) => {
    try {
      const followerId = getUserId(req);
      if (!followerId) return res.status(401).json({ message: "Unauthorized" });

      const { userId } = req.params;
      await storage.unfollowUser(followerId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  // Resource routes
  app.get("/api/resources", async (req, res) => {
    try {
      const currentUserId = getUserId(req);
      const resources = await storage.getResources(currentUserId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/bookmarked", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const resources = await storage.getBookmarkedResources(userId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching bookmarked resources:", error);
      res.status(500).json({ message: "Failed to fetch bookmarked resources" });
    }
  });

  app.post("/api/resources/:id/upvote", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.upvoteResource(id, userId);
      res.status(201).json({ message: "Upvoted" });
    } catch (error) {
      console.error("Error upvoting resource:", error);
      res.status(500).json({ message: "Failed to upvote resource" });
    }
  });

  app.delete("/api/resources/:id/upvote", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.removeResourceUpvote(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing resource upvote:", error);
      res.status(500).json({ message: "Failed to remove upvote" });
    }
  });

  app.post("/api/resources/:id/bookmark", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.bookmarkResource(id, userId);
      res.status(201).json({ message: "Bookmarked" });
    } catch (error) {
      console.error("Error bookmarking resource:", error);
      res.status(500).json({ message: "Failed to bookmark resource" });
    }
  });

  app.delete("/api/resources/:id/bookmark", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.removeResourceBookmark(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  // Grant routes
  app.get("/api/grants", async (req, res) => {
    try {
      const currentUserId = getUserId(req);
      const grants = await storage.getGrants(currentUserId);
      res.json(grants);
    } catch (error) {
      console.error("Error fetching grants:", error);
      res.status(500).json({ message: "Failed to fetch grants" });
    }
  });

  app.post("/api/grants/:id/submit", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const { projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      const submission = await storage.submitToGrant(id, projectId, userId);
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error submitting to grant:", error);
      res.status(500).json({ message: "Failed to submit to grant" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.markNotificationRead(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark notification read" });
    }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      await storage.markAllNotificationsRead(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notifications read:", error);
      res.status(500).json({ message: "Failed to mark notifications read" });
    }
  });

  return httpServer;
}
