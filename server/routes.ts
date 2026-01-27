import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { insertProjectSchema, insertProfileSchema, insertProjectCommentSchema, insertResourceSchema, insertGrantSchema, insertGrantApplicationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Setup object storage routes
  registerObjectStorageRoutes(app);

  // Helper to get user ID from request
  const getUserId = (req: any): string | undefined => {
    return req.user?.claims?.sub;
  };

  // Stats route (public)
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

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

  app.get("/api/projects/bookmarked", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const projects = await storage.getBookmarkedProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching bookmarked projects:", error);
      res.status(500).json({ message: "Failed to fetch bookmarked projects" });
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

  // Project downvote routes
  app.post("/api/projects/:id/downvote", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.downvoteProject(id, userId);
      res.status(201).json({ message: "Downvoted" });
    } catch (error) {
      console.error("Error downvoting project:", error);
      res.status(500).json({ message: "Failed to downvote project" });
    }
  });

  app.delete("/api/projects/:id/downvote", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.removeProjectDownvote(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing downvote:", error);
      res.status(500).json({ message: "Failed to remove downvote" });
    }
  });

  // Project bookmark routes
  app.post("/api/projects/:id/bookmark", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.bookmarkProject(id, userId);
      res.status(201).json({ message: "Bookmarked" });
    } catch (error) {
      console.error("Error bookmarking project:", error);
      res.status(500).json({ message: "Failed to bookmark project" });
    }
  });

  app.delete("/api/projects/:id/bookmark", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.removeProjectBookmark(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
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

  // Search users route
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
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

  // Resource downvote routes
  app.post("/api/resources/:id/downvote", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.downvoteResource(id, userId);
      res.status(201).json({ message: "Downvoted" });
    } catch (error) {
      console.error("Error downvoting resource:", error);
      res.status(500).json({ message: "Failed to downvote resource" });
    }
  });

  app.delete("/api/resources/:id/downvote", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.removeResourceDownvote(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing resource downvote:", error);
      res.status(500).json({ message: "Failed to remove downvote" });
    }
  });

  // User-submitted resources
  app.post("/api/resources", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(userId, data);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create resource" });
    }
  });

  app.get("/api/resources/mine", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const resources = await storage.getResourcesByUser(userId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching user resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
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

  app.get("/api/grants/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = getUserId(req);
      const grant = await storage.getGrantById(id, currentUserId);
      if (!grant) {
        return res.status(404).json({ message: "Grant not found" });
      }
      res.json(grant);
    } catch (error) {
      console.error("Error fetching grant:", error);
      res.status(500).json({ message: "Failed to fetch grant" });
    }
  });

  // User-created grants
  app.post("/api/grants", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = insertGrantSchema.parse(req.body);
      const grant = await storage.createGrant(userId, data);
      res.status(201).json(grant);
    } catch (error) {
      console.error("Error creating grant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create grant" });
    }
  });

  app.get("/api/grants/mine", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const grants = await storage.getGrantsByUser(userId);
      res.json(grants);
    } catch (error) {
      console.error("Error fetching user grants:", error);
      res.status(500).json({ message: "Failed to fetch grants" });
    }
  });

  app.put("/api/grants/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const data = insertGrantSchema.partial().parse(req.body);
      const grant = await storage.updateGrant(id, userId, data);
      res.json(grant);
    } catch (error) {
      console.error("Error updating grant:", error);
      res.status(500).json({ message: "Failed to update grant" });
    }
  });

  app.delete("/api/grants/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.deleteGrant(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting grant:", error);
      res.status(500).json({ message: "Failed to delete grant" });
    }
  });

  // Grant applications
  app.post("/api/grants/:id/apply", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const data = insertGrantApplicationSchema.parse({ ...req.body, grantId: id });
      const application = await storage.applyToGrant(id, userId, data);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error applying to grant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to apply to grant" });
    }
  });

  app.get("/api/grants/:id/applications", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const applications = await storage.getGrantApplications(id, userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching grant applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/mine", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const applications = await storage.getUserApplications(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching user applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.put("/api/applications/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const { status } = req.body;
      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const application = await storage.updateApplicationStatus(id, userId, status);
      res.json(application);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
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

  // ===== Messaging Routes =====
  
  // Get all conversations for current user
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const convos = await storage.getConversations(userId);
      res.json(convos);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get or create a conversation with another user
  app.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { userId: otherUserId } = req.body;
      if (!otherUserId || otherUserId === userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const convo = await storage.getOrCreateConversation(userId, otherUserId);
      res.json(convo);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Get unread message count
  app.get("/api/messages/unread-count", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const msgs = await storage.getMessages(id, userId);
      res.json(msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const { content, messageType, voiceNoteUrl } = req.body;
      
      if (!content && !voiceNoteUrl) {
        return res.status(400).json({ message: "Message content required" });
      }

      const msg = await storage.sendMessage(id, userId, content, messageType || "text", voiceNoteUrl);
      res.json(msg);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Mark messages as read
  app.post("/api/conversations/:id/read", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.markMessagesRead(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking messages read:", error);
      res.status(500).json({ message: "Failed to mark messages read" });
    }
  });

  // ===== Reactions Routes =====

  // Get reactions for a target (project or comment)
  app.get("/api/reactions/:targetType/:targetId", async (req, res) => {
    try {
      const { targetType, targetId } = req.params;
      const rxns = await storage.getReactions(targetType, targetId);
      res.json(rxns);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });

  // Add a reaction
  app.post("/api/reactions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { emoji, targetType, targetId } = req.body;
      if (!emoji || !targetType || !targetId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await storage.addReaction(userId, emoji, targetType, targetId);
      res.status(204).send();
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  // Remove a reaction
  app.delete("/api/reactions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { emoji, targetType, targetId } = req.body;
      if (!emoji || !targetType || !targetId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await storage.removeReaction(userId, emoji, targetType, targetId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });

  return httpServer;
}
