import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { insertProjectSchema, insertProfileSchema, insertProjectCommentSchema, insertResourceSchema, insertGrantSchema, insertGrantApplicationSchema, insertCommunitySchema } from "@shared/schema";
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

  // Module lessons mapping for vibecoding curriculum (matches frontend lesson IDs)
  const MODULE_LESSONS: Record<string, string[]> = {
    "module-1": ["1-1", "1-2", "1-3", "1-4"],
    "module-2": ["2-1", "2-2", "2-3", "2-4", "2-5"],
    "module-3": ["3-1", "3-2", "3-3", "3-4", "3-5"],
    "module-4": ["4-1", "4-2", "4-3", "4-4"],
    "module-5": ["5-1", "5-2", "5-3", "5-4", "5-5"],
  };

  const getModuleLessons = (moduleId: string): string[] => {
    return MODULE_LESSONS[moduleId] || [];
  };

  // Quiz questions with correct answers for server-side validation
  // These MUST match the correctIndex values in the frontend MODULE_QUIZZES exactly
  const MODULE_QUIZ_QUESTIONS: Record<string, { id: string; correctIndex: number }[]> = {
    "module-1": [
      { id: "q1-1", correctIndex: 1 }, // Andrej Karpathy
      { id: "q1-2", correctIndex: 1 }, // Using natural language
      { id: "q1-3", correctIndex: 1 }, // Rapid prototyping
      { id: "q1-4", correctIndex: 2 }, // Speed and iteration
      { id: "q1-5", correctIndex: 3 }, // 95%+
    ],
    "module-2": [
      { id: "q2-1", correctIndex: 1 }, // Being specific
      { id: "q2-2", correctIndex: 1 }, // Iteratively refine
      { id: "q2-3", correctIndex: 1 }, // Asking without examples
      { id: "q2-4", correctIndex: 1 }, // Few-shot = providing examples
      { id: "q2-5", correctIndex: 1 }, // Template/example
    ],
    "module-3": [
      { id: "q3-1", correctIndex: 1 }, // Describe overall goal
      { id: "q3-2", correctIndex: 1 }, // Break into smaller steps
      { id: "q3-3", correctIndex: 1 }, // Provide context
      { id: "q3-4", correctIndex: 1 }, // Context management
      { id: "q3-5", correctIndex: 1 }, // After each working milestone
    ],
    "module-4": [
      { id: "q4-1", correctIndex: 0 }, // Something you'd actually use
      { id: "q4-2", correctIndex: 1 }, // MVP - minimum viable product
      { id: "q4-3", correctIndex: 1 }, // Share error with AI
      { id: "q4-4", correctIndex: 1 }, // Critical for validating AI output
      { id: "q4-5", correctIndex: 1 }, // After it works, for maintainability
    ],
    "module-5": [
      { id: "q5-1", correctIndex: 1 }, // Multiple AI tools working together
      { id: "q5-2", correctIndex: 1 }, // Security, performance, edge cases
      { id: "q5-3", correctIndex: 1 }, // Continuously improve and integrate
      { id: "q5-4", correctIndex: 1 }, // AI skills with strong fundamentals
      { id: "q5-5", correctIndex: 1 }, // Vibecoding is a tool, not magic
    ],
  };

  const getModuleQuizQuestions = (moduleId: string): { id: string; correctIndex: number }[] => {
    return MODULE_QUIZ_QUESTIONS[moduleId] || [];
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
      
      if (data.username) {
        const isAvailable = await storage.isUsernameAvailable(data.username, userId);
        if (!isAvailable) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }
      
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

  // Increment project view count
  app.post("/api/projects/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementProjectViewCount(id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error incrementing view count:", error);
      res.status(500).json({ message: "Failed to increment view count" });
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
      const { content, messageType, voiceNoteUrl, imageUrl, fileUrl, fileName } = req.body;
      
      if (!content && !voiceNoteUrl && !imageUrl && !fileUrl) {
        return res.status(400).json({ message: "Message content required" });
      }

      const msg = await storage.sendMessage(id, userId, content, messageType || "text", voiceNoteUrl, imageUrl, fileUrl, fileName);
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

  app.delete("/api/messages/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.deleteMessage(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  app.delete("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.deleteConversation(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
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

  // ===== Posts Routes =====

  // Get all posts
  app.get("/api/posts", async (req, res) => {
    try {
      const currentUserId = getUserId(req);
      const allPosts = await storage.getPosts(currentUserId);
      res.json(allPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Get unified feed (posts + projects from followed users)
  app.get("/api/feed", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const feed = await storage.getFeed(userId);
      res.json(feed);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  // Get post by id
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = getUserId(req);
      const post = await storage.getPostById(id, currentUserId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  // Get posts by user
  app.get("/api/users/:userId/posts", async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = getUserId(req);
      const userPosts = await storage.getPostsByUser(userId, currentUserId);
      res.json(userPosts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  // Get user's enrolled courses
  app.get("/api/users/:userId/courses", async (req, res) => {
    try {
      const { userId } = req.params;
      const courses = await storage.getEnrolledCourses(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching user courses:", error);
      res.status(500).json({ message: "Failed to fetch user courses" });
    }
  });

  // Create a post
  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { content, voiceNoteUrl, media } = req.body;
      
      if (!content && !voiceNoteUrl && (!media || media.length === 0)) {
        return res.status(400).json({ message: "Post must have content, voice note, or media" });
      }

      const post = await storage.createPost(userId, content || null, voiceNoteUrl);
      
      if (media && Array.isArray(media)) {
        for (let i = 0; i < media.length; i++) {
          const m = media[i];
          await storage.addPostMedia(post.id, m.mediaType, m.mediaUrl, m.previewUrl, m.aspectRatio, i);
        }
      }

      const fullPost = await storage.getPostById(post.id, userId);
      res.status(201).json(fullPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Delete a post
  app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.deletePost(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Like a post
  app.post("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.likePost(id, userId);
      
      const post = await storage.getPostById(id);
      if (post && post.userId !== userId) {
        await storage.createNotification(
          post.userId,
          userId,
          "like",
          `liked your post`,
          `/posts/${id}`
        );
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  // Unlike a post
  app.delete("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.unlikePost(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  // Increment post view count
  app.post("/api/posts/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementPostViewCount(id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error incrementing view count:", error);
      res.status(500).json({ message: "Failed to increment view count" });
    }
  });

  // Get post comments
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await storage.getPostComments(id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching post comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create post comment
  app.post("/api/posts/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const { content } = req.body;
      
      if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const comment = await storage.createPostComment(id, userId, content);
      
      const post = await storage.getPostById(id);
      if (post && post.userId !== userId) {
        await storage.createNotification(
          post.userId,
          userId,
          "comment",
          `commented on your post`,
          `/posts/${id}`
        );
      }
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating post comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Delete post comment
  app.delete("/api/posts/:postId/comments/:commentId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { commentId } = req.params;
      await storage.deletePostComment(commentId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // ===== Stories Routes =====

  // Get stories from followed users
  app.get("/api/stories", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const storyGroups = await storage.getStories(userId);
      res.json(storyGroups);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  // Get stories by a specific user
  app.get("/api/users/:userId/stories", async (req, res) => {
    try {
      const { userId } = req.params;
      const userStories = await storage.getStoriesByUser(userId);
      res.json(userStories);
    } catch (error) {
      console.error("Error fetching user stories:", error);
      res.status(500).json({ message: "Failed to fetch user stories" });
    }
  });

  // Create a story
  app.post("/api/stories", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { mediaType, mediaUrl, previewUrl } = req.body;
      
      if (!mediaType || !mediaUrl) {
        return res.status(400).json({ message: "Media type and URL are required" });
      }

      const story = await storage.createStory(userId, mediaType, mediaUrl, previewUrl);
      res.status(201).json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  // Delete a story
  app.delete("/api/stories/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await storage.deleteStory(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting story:", error);
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  // Courses
  app.get("/api/courses", async (req, res) => {
    try {
      const userId = getUserId(req);
      const courses = await storage.getCourses(userId || undefined);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/enrolled", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const courses = await storage.getEnrolledCourses(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      res.status(500).json({ message: "Failed to fetch enrolled courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const course = await storage.getCourseById(req.params.id, userId || undefined);
      if (!course) return res.status(404).json({ message: "Course not found" });
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const course = await storage.createCourse(userId, req.body);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.patch("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const course = await storage.updateCourse(req.params.id, userId, req.body);
      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      await storage.deleteCourse(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  app.post("/api/courses/:id/enroll", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const enrollment = await storage.enrollInCourse(req.params.id, userId);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  app.delete("/api/courses/:id/enroll", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      await storage.unenrollFromCourse(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unenrolling from course:", error);
      res.status(500).json({ message: "Failed to unenroll from course" });
    }
  });

  app.get("/api/courses/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const progress = await storage.getCourseProgress(req.params.id, userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching course progress:", error);
      res.status(500).json({ message: "Failed to fetch course progress" });
    }
  });

  app.post("/api/courses/:id/lessons", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const lesson = await storage.addCourseLesson(req.params.id, userId, req.body);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error adding lesson:", error);
      res.status(500).json({ message: "Failed to add lesson" });
    }
  });

  app.patch("/api/lessons/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const lesson = await storage.updateCourseLesson(req.params.id, userId, req.body);
      res.json(lesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  app.delete("/api/lessons/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      await storage.deleteCourseLesson(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  app.post("/api/lessons/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      await storage.markLessonComplete(req.params.id, userId);
      res.status(200).json({ message: "Lesson marked as complete" });
    } catch (error) {
      console.error("Error marking lesson complete:", error);
      res.status(500).json({ message: "Failed to mark lesson complete" });
    }
  });

  // Lesson Quiz routes
  app.get("/api/lessons/:id/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getLessonQuizzes(req.params.id);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.post("/api/lessons/:id/quizzes", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const quiz = await storage.addLessonQuiz(req.params.id, req.body);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error adding quiz:", error);
      res.status(500).json({ message: "Failed to add quiz" });
    }
  });

  app.post("/api/quizzes/:id/answer", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { selectedOptionIndex } = req.body;
      const result = await storage.submitQuizAnswer(req.params.id, userId, selectedOptionIndex);
      res.json(result);
    } catch (error) {
      console.error("Error submitting quiz answer:", error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  app.get("/api/lessons/:id/quiz-attempts", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const attempts = await storage.getUserQuizAttempts(req.params.id, userId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  // Certificate routes
  app.get("/api/courses/:id/completion", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const completion = await storage.checkCourseCompletion(req.params.id, userId);
      res.json(completion);
    } catch (error) {
      console.error("Error checking course completion:", error);
      res.status(500).json({ message: "Failed to check course completion" });
    }
  });

  app.post("/api/courses/:id/claim-certificate", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // Check if user can earn certificate
      const completion = await storage.checkCourseCompletion(req.params.id, userId);
      if (!completion.canEarnCertificate) {
        return res.status(400).json({ message: "Complete all lessons and pass all quizzes to earn certificate" });
      }

      // Issue certificate
      const certificate = await storage.issueCertificate(req.params.id, userId);

      // Award badge
      const course = await storage.getCourseById(req.params.id, userId);
      await storage.awardBadge(
        userId,
        "course_completion",
        `${course?.title || "Course"} Graduate`,
        `Successfully completed the ${course?.title || "course"} and passed all quizzes`,
        "Award",
        req.params.id
      );

      res.json({ certificate, message: "Congratulations! Certificate and badge earned!" });
    } catch (error) {
      console.error("Error claiming certificate:", error);
      res.status(500).json({ message: "Failed to claim certificate" });
    }
  });

  app.get("/api/certificates/verify/:certNumber", async (req, res) => {
    try {
      const certificate = await storage.getCertificateByNumber(req.params.certNumber);
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      res.json(certificate);
    } catch (error) {
      console.error("Error verifying certificate:", error);
      res.status(500).json({ message: "Failed to verify certificate" });
    }
  });

  app.get("/api/users/:userId/certificates", async (req, res) => {
    try {
      const certificates = await storage.getUserCertificates(req.params.userId);
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching user certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  // Badge routes
  app.get("/api/users/:userId/badges", async (req, res) => {
    try {
      const badges = await storage.getUserBadges(req.params.userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  // Community routes
  app.get("/api/communities", async (req, res) => {
    try {
      const userId = getUserId(req);
      const communities = await storage.getCommunities(userId);
      res.json(communities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.get("/api/communities/joined", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const communities = await storage.getJoinedCommunities(userId);
      res.json(communities);
    } catch (error) {
      console.error("Error fetching joined communities:", error);
      res.status(500).json({ message: "Failed to fetch joined communities" });
    }
  });

  app.get("/api/communities/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const community = await storage.getCommunityById(req.params.id, userId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      res.json(community);
    } catch (error) {
      console.error("Error fetching community:", error);
      res.status(500).json({ message: "Failed to fetch community" });
    }
  });

  app.post("/api/communities", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = insertCommunitySchema.parse(req.body);
      const community = await storage.createCommunity(userId, data);
      res.status(201).json(community);
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(500).json({ message: "Failed to create community" });
    }
  });

  app.post("/api/communities/:id/join", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      await storage.joinCommunity(req.params.id, userId);
      res.status(200).json({ message: "Joined community" });
    } catch (error) {
      console.error("Error joining community:", error);
      res.status(500).json({ message: "Failed to join community" });
    }
  });

  app.post("/api/communities/:id/leave", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      await storage.leaveCommunity(req.params.id, userId);
      res.status(200).json({ message: "Left community" });
    } catch (error) {
      console.error("Error leaving community:", error);
      res.status(500).json({ message: "Failed to leave community" });
    }
  });

  app.get("/api/communities/:id/posts", async (req, res) => {
    try {
      const userId = getUserId(req);
      const posts = await storage.getCommunityPosts(req.params.id, userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      res.status(500).json({ message: "Failed to fetch community posts" });
    }
  });

  // Global feed (all posts and projects from everyone)
  app.get("/api/feed/global", async (req, res) => {
    try {
      const userId = getUserId(req);
      const feed = await storage.getGlobalFeed(userId);
      res.json(feed);
    } catch (error) {
      console.error("Error fetching global feed:", error);
      res.status(500).json({ message: "Failed to fetch global feed" });
    }
  });

  // Vibecoding Progress
  app.get("/api/users/:id/vibecoding-progress", async (req, res) => {
    try {
      const { id } = req.params;
      const completedLessons = await storage.getVibecodingProgress(id);
      const passedQuizzes = await storage.getVibecodingQuizProgress(id);
      const certificate = await storage.getVibecodingCertificate(id);
      const badges = await storage.getUserBadges(id);
      
      res.json({
        completedLessons,
        passedQuizzes,
        hasCertificate: !!certificate,
        certificateNumber: certificate?.certificateNumber,
        badges: badges.filter((b: any) => b.badgeType === "vibecoding"),
      });
    } catch (error) {
      console.error("Error fetching vibecoding progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Start reading a lesson - server-side tracking
  app.post("/api/vibecoding/lessons/:lessonId/start-reading", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { lessonId } = req.params;
      await storage.startLessonRead(userId, lessonId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error starting lesson read:", error);
      res.status(500).json({ message: "Failed to start lesson read" });
    }
  });

  const MINIMUM_READING_TIME_SECONDS = 30;

  app.post("/api/vibecoding/lessons/:lessonId/complete", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { lessonId } = req.params;
      
      // Check if lesson is already completed (skip reading time check)
      const completedLessons = await storage.getVibecodingCompletedLessons(userId);
      if (completedLessons.includes(lessonId)) {
        return res.status(200).json({ success: true, alreadyCompleted: true });
      }
      
      // Server-side enforcement of minimum reading time
      const readStart = await storage.getLessonReadStart(userId, lessonId);
      if (!readStart) {
        return res.status(400).json({ message: "You must open the lesson first" });
      }
      
      const secondsElapsed = (Date.now() - new Date(readStart).getTime()) / 1000;
      if (secondsElapsed < MINIMUM_READING_TIME_SECONDS) {
        const remaining = Math.ceil(MINIMUM_READING_TIME_SECONDS - secondsElapsed);
        return res.status(400).json({ 
          message: `Please read the lesson for at least ${remaining} more seconds before marking it complete` 
        });
      }
      
      await storage.markVibecodingLessonComplete(userId, lessonId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error marking lesson complete:", error);
      res.status(500).json({ message: "Failed to mark lesson complete" });
    }
  });

  // Vibecoding Quiz submission with server-side validation
  app.post("/api/vibecoding/quizzes/:moduleId/submit", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { moduleId } = req.params;
      const { answers } = req.body;
      
      // Verify all lessons for this module are completed
      const completedLessons = await storage.getVibecodingCompletedLessons(userId);
      const moduleLessons = getModuleLessons(moduleId);
      const allLessonsComplete = moduleLessons.every(lessonId => completedLessons.includes(lessonId));
      
      if (!allLessonsComplete) {
        return res.status(400).json({ message: "Complete all lessons in this module first" });
      }
      
      // Calculate score server-side using answer key
      const quizQuestions = getModuleQuizQuestions(moduleId);
      let correctCount = 0;
      quizQuestions.forEach(q => {
        if (answers && answers[q.id] === q.correctIndex) {
          correctCount++;
        }
      });
      
      const totalQuestions = quizQuestions.length;
      const result = await storage.submitVibecodingQuiz(userId, moduleId, correctCount, totalQuestions);
      res.json(result);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  // Vibecoding Certificate
  app.get("/api/vibecoding/certificate", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const certificate = await storage.getVibecodingCertificate(userId);
      res.json(certificate);
    } catch (error) {
      console.error("Error getting certificate:", error);
      res.status(500).json({ message: "Failed to get certificate" });
    }
  });

  app.post("/api/vibecoding/claim-certificate", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // Verify completion server-side from database
      const completedLessons = await storage.getVibecodingCompletedLessons(userId);
      const passedQuizzes = await storage.getVibecodingPassedQuizzes(userId);
      
      const TOTAL_LESSONS = 23;
      const TOTAL_QUIZZES = 5;
      
      if (completedLessons.length < TOTAL_LESSONS || passedQuizzes.length < TOTAL_QUIZZES) {
        return res.status(400).json({ 
          message: `Complete all ${TOTAL_LESSONS} lessons and pass all ${TOTAL_QUIZZES} quizzes to earn your certificate. Current: ${completedLessons.length} lessons, ${passedQuizzes.length} quizzes.`
        });
      }

      const certificate = await storage.issueVibecodingCertificate(userId);
      res.json({ certificate, message: "Congratulations! You've earned your Vibecoder Certificate!" });
    } catch (error) {
      console.error("Error claiming certificate:", error);
      res.status(500).json({ message: "Failed to claim certificate" });
    }
  });

  // Alternative lesson explanation using AI with rate limiting
  const explanationRateLimit: Map<string, number> = new Map();
  const EXPLANATION_RATE_LIMIT_MS = 60000; // 1 explanation per minute per user

  app.post("/api/vibecoding/lessons/:lessonId/explain", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { lessonId } = req.params;
      const { lessonTitle, lessonContent } = req.body;
      
      // Validate input
      if (!lessonTitle || typeof lessonTitle !== "string" || lessonTitle.length > 200) {
        return res.status(400).json({ message: "Invalid lesson title" });
      }
      if (!lessonContent || typeof lessonContent !== "string" || lessonContent.length > 10000) {
        return res.status(400).json({ message: "Invalid lesson content" });
      }
      
      // Rate limiting per user
      const lastRequest = explanationRateLimit.get(userId);
      if (lastRequest && Date.now() - lastRequest < EXPLANATION_RATE_LIMIT_MS) {
        const waitTime = Math.ceil((EXPLANATION_RATE_LIMIT_MS - (Date.now() - lastRequest)) / 1000);
        return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting another explanation` });
      }
      explanationRateLimit.set(userId, Date.now());

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a friendly coding teacher explaining vibecoding concepts. Provide a clear, alternative explanation of the lesson content. Use simple language, practical examples, and analogies. Keep the explanation concise but helpful (2-3 paragraphs)."
          },
          {
            role: "user",
            content: `Please provide an alternative explanation for this lesson:\n\nTitle: ${lessonTitle.slice(0, 200)}\n\nOriginal Content:\n${lessonContent.slice(0, 5000)}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const explanation = response.choices[0]?.message?.content || "Unable to generate explanation.";
      res.json({ explanation });
    } catch (error) {
      console.error("Error generating explanation:", error);
      res.status(500).json({ message: "Failed to generate alternative explanation" });
    }
  });

  return httpServer;
}
