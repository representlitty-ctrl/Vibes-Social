import { db } from "./db";
import { eq, desc, and, sql, count, or, ilike, ne, gt, inArray } from "drizzle-orm";
import {
  users,
  profiles,
  projects,
  projectUpvotes,
  projectDownvotes,
  projectBookmarks,
  projectComments,
  follows,
  resources,
  resourceUpvotes,
  resourceDownvotes,
  resourceBookmarks,
  resourceComments,
  grants,
  grantSubmissions,
  grantApplications,
  notifications,
  conversations,
  messages,
  reactions,
  posts,
  postMedia,
  postLikes,
  postComments,
  stories,
  type User,
  type Profile,
  type InsertProfile,
  type Project,
  type InsertProject,
  type ProjectComment,
  type InsertProjectComment,
  type Resource,
  type InsertResource,
  type ResourceComment,
  type Grant,
  type InsertGrant,
  type GrantSubmission,
  type InsertGrantSubmission,
  type GrantApplication,
  type InsertGrantApplication,
  type Notification,
  type Message,
  type Conversation,
  type Reaction,
  type Post,
  type PostMedia,
  type PostLike,
  type PostComment,
  type Story,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  searchUsers(query: string): Promise<any[]>;
  
  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  getProfileWithUser(userId: string, currentUserId?: string): Promise<any>;
  upsertProfile(userId: string, data: InsertProfile): Promise<Profile>;
  
  // Projects
  getProjects(currentUserId?: string): Promise<any[]>;
  getFeaturedProjects(currentUserId?: string): Promise<any[]>;
  getProjectById(id: string, currentUserId?: string): Promise<any>;
  getProjectsByUser(userId: string, currentUserId?: string): Promise<any[]>;
  getProjectsMine(userId: string): Promise<any[]>;
  createProject(userId: string, data: InsertProject): Promise<Project>;
  updateProject(id: string, userId: string, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string, userId: string): Promise<void>;
  
  // Project Upvotes
  upvoteProject(projectId: string, userId: string): Promise<void>;
  removeProjectUpvote(projectId: string, userId: string): Promise<void>;
  
  // Project Downvotes
  downvoteProject(projectId: string, userId: string): Promise<void>;
  removeProjectDownvote(projectId: string, userId: string): Promise<void>;
  
  // Project Bookmarks
  bookmarkProject(projectId: string, userId: string): Promise<void>;
  removeProjectBookmark(projectId: string, userId: string): Promise<void>;
  getBookmarkedProjects(userId: string): Promise<any[]>;
  
  // Project Comments
  getProjectComments(projectId: string): Promise<any[]>;
  createProjectComment(projectId: string, userId: string, content: string): Promise<ProjectComment>;
  deleteProjectComment(commentId: string, userId: string): Promise<void>;
  
  // Follows
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  
  // Resources
  getResources(currentUserId?: string): Promise<any[]>;
  getBookmarkedResources(userId: string): Promise<any[]>;
  getResourcesByUser(userId: string): Promise<any[]>;
  createResource(userId: string, data: InsertResource): Promise<Resource>;
  upvoteResource(resourceId: string, userId: string): Promise<void>;
  removeResourceUpvote(resourceId: string, userId: string): Promise<void>;
  downvoteResource(resourceId: string, userId: string): Promise<void>;
  removeResourceDownvote(resourceId: string, userId: string): Promise<void>;
  bookmarkResource(resourceId: string, userId: string): Promise<void>;
  removeResourceBookmark(resourceId: string, userId: string): Promise<void>;
  
  // Grants
  getGrants(currentUserId?: string): Promise<any[]>;
  getGrantById(id: string, currentUserId?: string): Promise<any>;
  getGrantsByUser(userId: string): Promise<any[]>;
  createGrant(userId: string, data: InsertGrant): Promise<Grant>;
  updateGrant(id: string, userId: string, data: Partial<InsertGrant>): Promise<Grant>;
  deleteGrant(id: string, userId: string): Promise<void>;
  submitToGrant(grantId: string, projectId: string, userId: string): Promise<GrantSubmission>;
  
  // Grant Applications
  applyToGrant(grantId: string, userId: string, data: InsertGrantApplication): Promise<GrantApplication>;
  getGrantApplications(grantId: string, userId: string): Promise<any[]>;
  getUserApplications(userId: string): Promise<any[]>;
  updateApplicationStatus(applicationId: string, userId: string, status: string): Promise<GrantApplication>;
  
  // Notifications
  getNotifications(userId: string): Promise<any[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(notificationId: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  createNotification(userId: string, type: string, title: string, message?: string, referenceId?: string, referenceType?: string, fromUserId?: string): Promise<void>;
  
  // Conversations & Messages
  getConversations(userId: string): Promise<any[]>;
  getOrCreateConversation(user1Id: string, user2Id: string): Promise<any>;
  getMessages(conversationId: string, userId: string): Promise<any[]>;
  sendMessage(conversationId: string, senderId: string, content: string, messageType?: string, voiceNoteUrl?: string, imageUrl?: string, fileUrl?: string, fileName?: string): Promise<any>;
  markMessagesRead(conversationId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
  
  // Reactions
  getReactions(targetType: string, targetId: string): Promise<any[]>;
  addReaction(userId: string, emoji: string, targetType: string, targetId: string): Promise<void>;
  removeReaction(userId: string, emoji: string, targetType: string, targetId: string): Promise<void>;
  
  // Posts
  createPost(userId: string, content: string | null, voiceNoteUrl?: string): Promise<any>;
  addPostMedia(postId: string, mediaType: string, mediaUrl: string, previewUrl?: string, aspectRatio?: string, orderIndex?: number): Promise<any>;
  getPosts(currentUserId?: string): Promise<any[]>;
  getFeed(userId: string): Promise<any[]>;
  getPostById(id: string, currentUserId?: string): Promise<any>;
  getPostsByUser(userId: string, currentUserId?: string): Promise<any[]>;
  deletePost(id: string, userId: string): Promise<void>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  getPostComments(postId: string): Promise<any[]>;
  createPostComment(postId: string, userId: string, content: string): Promise<any>;
  deletePostComment(commentId: string, userId: string): Promise<void>;
  
  // Stories
  createStory(userId: string, mediaType: string, mediaUrl: string, previewUrl?: string): Promise<any>;
  getStories(userId: string): Promise<any[]>;
  getStoriesByUser(userId: string): Promise<any[]>;
  deleteStory(id: string, userId: string): Promise<void>;
  
  // Stats
  getStats(): Promise<{ projectCount: number; userCount: number; grantCount: number }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async searchUsers(query: string): Promise<any[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    const results = await db
      .select({
        user: users,
        profile: profiles,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(
        or(
          ilike(profiles.username, searchTerm),
          ilike(users.email, searchTerm),
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm)
        )
      )
      .limit(20);

    return results.map((r) => ({
      ...r.user,
      profile: r.profile,
    }));
  }

  // Profiles
  async generateUniqueUsername(user: User): Promise<string> {
    let base = "";
    if (user.firstName && user.lastName) {
      base = `${user.firstName}${user.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, "");
    } else if (user.firstName) {
      base = user.firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
    } else if (user.email) {
      base = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    } else {
      base = "user";
    }
    
    base = base.substring(0, 20) || "user";
    
    let username = base;
    let counter = 1;
    while (true) {
      const [existing] = await db.select().from(profiles).where(eq(profiles.username, username));
      if (!existing) break;
      username = `${base}${counter}`;
      counter++;
    }
    return username;
  }

  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const query = excludeUserId
      ? db.select().from(profiles).where(and(eq(profiles.username, username), ne(profiles.userId, excludeUserId)))
      : db.select().from(profiles).where(eq(profiles.username, username));
    const [existing] = await query;
    return !existing;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile || undefined;
  }

  async getProfileWithUser(userId: string, currentUserId?: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;

    let [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    if (!profile) {
      const baseUsername = await this.generateUniqueUsername(user);
      [profile] = await db.insert(profiles).values({ userId, username: baseUsername }).returning();
    }

    const [followerResult] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));

    const [followingResult] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));

    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      const [followRecord] = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, currentUserId), eq(follows.followingId, userId)));
      isFollowing = !!followRecord;
    }

    return {
      ...profile,
      user,
      followerCount: followerResult?.count || 0,
      followingCount: followingResult?.count || 0,
      isFollowing,
    };
  }

  async upsertProfile(userId: string, data: InsertProfile): Promise<Profile> {
    const existing = await this.getProfile(userId);
    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set(data)
        .where(eq(profiles.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(profiles)
      .values({ userId, ...data })
      .returning();
    return created;
  }

  // Projects
  async getProjects(currentUserId?: string): Promise<any[]> {
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

    return Promise.all(allProjects.map((p) => this.enrichProject(p, currentUserId)));
  }

  async getFeaturedProjects(currentUserId?: string): Promise<any[]> {
    const featured = await db
      .select()
      .from(projects)
      .where(eq(projects.isFeatured, true))
      .orderBy(desc(projects.createdAt))
      .limit(6);

    return Promise.all(featured.map((p) => this.enrichProject(p, currentUserId)));
  }

  async getProjectById(id: string, currentUserId?: string): Promise<any> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return undefined;
    return this.enrichProject(project, currentUserId);
  }

  async getProjectsByUser(userId: string, currentUserId?: string): Promise<any[]> {
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));

    return Promise.all(userProjects.map((p) => this.enrichProject(p, currentUserId)));
  }

  async getProjectsMine(userId: string): Promise<any[]> {
    return db
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  private async enrichProject(project: Project, currentUserId?: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, project.userId));
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, project.userId));

    const [upvoteResult] = await db
      .select({ count: count() })
      .from(projectUpvotes)
      .where(eq(projectUpvotes.projectId, project.id));

    const [downvoteResult] = await db
      .select({ count: count() })
      .from(projectDownvotes)
      .where(eq(projectDownvotes.projectId, project.id));

    const [commentResult] = await db
      .select({ count: count() })
      .from(projectComments)
      .where(eq(projectComments.projectId, project.id));

    let hasUpvoted = false;
    let hasDownvoted = false;
    let hasBookmarked = false;

    if (currentUserId) {
      const [upvote] = await db
        .select()
        .from(projectUpvotes)
        .where(and(eq(projectUpvotes.projectId, project.id), eq(projectUpvotes.userId, currentUserId)));
      hasUpvoted = !!upvote;

      const [downvote] = await db
        .select()
        .from(projectDownvotes)
        .where(and(eq(projectDownvotes.projectId, project.id), eq(projectDownvotes.userId, currentUserId)));
      hasDownvoted = !!downvote;

      const [bookmark] = await db
        .select()
        .from(projectBookmarks)
        .where(and(eq(projectBookmarks.projectId, project.id), eq(projectBookmarks.userId, currentUserId)));
      hasBookmarked = !!bookmark;
    }

    return {
      ...project,
      user: { ...user, profile },
      upvoteCount: upvoteResult?.count || 0,
      downvoteCount: downvoteResult?.count || 0,
      commentCount: commentResult?.count || 0,
      hasUpvoted,
      hasDownvoted,
      hasBookmarked,
    };
  }

  async createProject(userId: string, data: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({ ...data, userId })
      .returning();
    return project;
  }

  async updateProject(id: string, userId: string, data: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return project;
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    const [project] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    if (!project) return;
    
    await db.delete(projectUpvotes).where(eq(projectUpvotes.projectId, id));
    await db.delete(projectDownvotes).where(eq(projectDownvotes.projectId, id));
    await db.delete(projectBookmarks).where(eq(projectBookmarks.projectId, id));
    await db.delete(projectComments).where(eq(projectComments.projectId, id));
    await db.delete(reactions).where(and(eq(reactions.targetType, "project"), eq(reactions.targetId, id)));
    await db.delete(notifications).where(and(eq(notifications.referenceType, "project"), eq(notifications.referenceId, id)));
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project Upvotes
  async upvoteProject(projectId: string, userId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(projectUpvotes)
      .where(and(eq(projectUpvotes.projectId, projectId), eq(projectUpvotes.userId, userId)));

    if (!existing) {
      await db.insert(projectUpvotes).values({ projectId, userId });

      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (project && project.userId !== userId) {
        await this.createNotification(
          project.userId,
          "upvote",
          "New upvote on your project",
          `Someone upvoted "${project.title}"`,
          projectId,
          "project"
        );
      }
    }
  }

  async removeProjectUpvote(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectUpvotes)
      .where(and(eq(projectUpvotes.projectId, projectId), eq(projectUpvotes.userId, userId)));
  }

  // Project Downvotes
  async downvoteProject(projectId: string, userId: string): Promise<void> {
    await db.delete(projectUpvotes).where(and(eq(projectUpvotes.projectId, projectId), eq(projectUpvotes.userId, userId)));
    
    const [existing] = await db
      .select()
      .from(projectDownvotes)
      .where(and(eq(projectDownvotes.projectId, projectId), eq(projectDownvotes.userId, userId)));

    if (!existing) {
      await db.insert(projectDownvotes).values({ projectId, userId });
    }
  }

  async removeProjectDownvote(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectDownvotes)
      .where(and(eq(projectDownvotes.projectId, projectId), eq(projectDownvotes.userId, userId)));
  }

  // Project Bookmarks
  async bookmarkProject(projectId: string, userId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(projectBookmarks)
      .where(and(eq(projectBookmarks.projectId, projectId), eq(projectBookmarks.userId, userId)));

    if (!existing) {
      await db.insert(projectBookmarks).values({ projectId, userId });
    }
  }

  async removeProjectBookmark(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectBookmarks)
      .where(and(eq(projectBookmarks.projectId, projectId), eq(projectBookmarks.userId, userId)));
  }

  async getBookmarkedProjects(userId: string): Promise<any[]> {
    const bookmarks = await db
      .select()
      .from(projectBookmarks)
      .where(eq(projectBookmarks.userId, userId));

    const bookmarkedProjects = await Promise.all(
      bookmarks.map(async (b) => {
        const [project] = await db.select().from(projects).where(eq(projects.id, b.projectId));
        if (project) {
          return this.enrichProject(project, userId);
        }
        return null;
      })
    );

    return bookmarkedProjects.filter(Boolean);
  }

  // Project Comments
  async getProjectComments(projectId: string): Promise<any[]> {
    const allComments = await db
      .select()
      .from(projectComments)
      .where(eq(projectComments.projectId, projectId))
      .orderBy(desc(projectComments.createdAt));

    return Promise.all(
      allComments.map(async (comment) => {
        const [user] = await db.select().from(users).where(eq(users.id, comment.userId));
        const [profile] = await db.select().from(profiles).where(eq(profiles.userId, comment.userId));
        return { ...comment, user: { ...user, profile } };
      })
    );
  }

  async createProjectComment(projectId: string, userId: string, content: string): Promise<ProjectComment> {
    const [comment] = await db
      .insert(projectComments)
      .values({ projectId, userId, content })
      .returning();

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (project && project.userId !== userId) {
      await this.createNotification(
        project.userId,
        "comment",
        "New comment on your project",
        content.slice(0, 100),
        projectId,
        "project"
      );
    }

    return comment;
  }

  async deleteProjectComment(commentId: string, userId: string): Promise<void> {
    await db
      .delete(projectComments)
      .where(and(eq(projectComments.id, commentId), eq(projectComments.userId, userId)));
  }

  // Follows
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) return;

    const [existing] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));

    if (!existing) {
      await db.insert(follows).values({ followerId, followingId });

      const [follower] = await db.select().from(users).where(eq(users.id, followerId));
      await this.createNotification(
        followingId,
        "follow",
        "New follower",
        `${follower?.firstName || "Someone"} started following you`,
        followerId,
        "user"
      );
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  // Resources
  async getResources(currentUserId?: string): Promise<any[]> {
    const allResources = await db
      .select()
      .from(resources)
      .orderBy(desc(resources.createdAt));

    return Promise.all(allResources.map((r) => this.enrichResource(r, currentUserId)));
  }

  async getBookmarkedResources(userId: string): Promise<any[]> {
    const bookmarks = await db
      .select()
      .from(resourceBookmarks)
      .where(eq(resourceBookmarks.userId, userId));

    const bookmarkedResources = await Promise.all(
      bookmarks.map(async (b) => {
        const [resource] = await db.select().from(resources).where(eq(resources.id, b.resourceId));
        if (resource) {
          return this.enrichResource(resource, userId);
        }
        return null;
      })
    );

    return bookmarkedResources.filter(Boolean);
  }

  private async enrichResource(resource: Resource, currentUserId?: string): Promise<any> {
    const [upvoteResult] = await db
      .select({ count: count() })
      .from(resourceUpvotes)
      .where(eq(resourceUpvotes.resourceId, resource.id));

    const [downvoteResult] = await db
      .select({ count: count() })
      .from(resourceDownvotes)
      .where(eq(resourceDownvotes.resourceId, resource.id));

    let hasUpvoted = false;
    let hasDownvoted = false;
    let hasBookmarked = false;

    if (currentUserId) {
      const [upvote] = await db
        .select()
        .from(resourceUpvotes)
        .where(and(eq(resourceUpvotes.resourceId, resource.id), eq(resourceUpvotes.userId, currentUserId)));
      hasUpvoted = !!upvote;

      const [downvote] = await db
        .select()
        .from(resourceDownvotes)
        .where(and(eq(resourceDownvotes.resourceId, resource.id), eq(resourceDownvotes.userId, currentUserId)));
      hasDownvoted = !!downvote;

      const [bookmark] = await db
        .select()
        .from(resourceBookmarks)
        .where(and(eq(resourceBookmarks.resourceId, resource.id), eq(resourceBookmarks.userId, currentUserId)));
      hasBookmarked = !!bookmark;
    }

    const [user] = resource.userId 
      ? await db.select().from(users).where(eq(users.id, resource.userId))
      : [null];
    const [profile] = resource.userId
      ? await db.select().from(profiles).where(eq(profiles.userId, resource.userId))
      : [null];

    return {
      ...resource,
      user: user ? { ...user, profile } : null,
      upvoteCount: upvoteResult?.count || 0,
      downvoteCount: downvoteResult?.count || 0,
      hasUpvoted,
      hasDownvoted,
      hasBookmarked,
    };
  }

  async upvoteResource(resourceId: string, userId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(resourceUpvotes)
      .where(and(eq(resourceUpvotes.resourceId, resourceId), eq(resourceUpvotes.userId, userId)));

    if (!existing) {
      await db.insert(resourceUpvotes).values({ resourceId, userId });
    }
  }

  async removeResourceUpvote(resourceId: string, userId: string): Promise<void> {
    await db
      .delete(resourceUpvotes)
      .where(and(eq(resourceUpvotes.resourceId, resourceId), eq(resourceUpvotes.userId, userId)));
  }

  // Resource Downvotes
  async downvoteResource(resourceId: string, userId: string): Promise<void> {
    await db.delete(resourceUpvotes).where(and(eq(resourceUpvotes.resourceId, resourceId), eq(resourceUpvotes.userId, userId)));
    
    const [existing] = await db
      .select()
      .from(resourceDownvotes)
      .where(and(eq(resourceDownvotes.resourceId, resourceId), eq(resourceDownvotes.userId, userId)));

    if (!existing) {
      await db.insert(resourceDownvotes).values({ resourceId, userId });
    }
  }

  async removeResourceDownvote(resourceId: string, userId: string): Promise<void> {
    await db
      .delete(resourceDownvotes)
      .where(and(eq(resourceDownvotes.resourceId, resourceId), eq(resourceDownvotes.userId, userId)));
  }

  // User-submitted Resources
  async createResource(userId: string, data: InsertResource): Promise<Resource> {
    const [resource] = await db
      .insert(resources)
      .values({ ...data, userId })
      .returning();
    return resource;
  }

  async getResourcesByUser(userId: string): Promise<any[]> {
    const userResources = await db
      .select()
      .from(resources)
      .where(eq(resources.userId, userId))
      .orderBy(desc(resources.createdAt));

    return Promise.all(userResources.map((r) => this.enrichResource(r, userId)));
  }

  async bookmarkResource(resourceId: string, userId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(resourceBookmarks)
      .where(and(eq(resourceBookmarks.resourceId, resourceId), eq(resourceBookmarks.userId, userId)));

    if (!existing) {
      await db.insert(resourceBookmarks).values({ resourceId, userId });
    }
  }

  async removeResourceBookmark(resourceId: string, userId: string): Promise<void> {
    await db
      .delete(resourceBookmarks)
      .where(and(eq(resourceBookmarks.resourceId, resourceId), eq(resourceBookmarks.userId, userId)));
  }

  // Grants
  async getGrants(currentUserId?: string): Promise<any[]> {
    const allGrants = await db.select().from(grants).orderBy(desc(grants.createdAt));

    return Promise.all(
      allGrants.map(async (grant) => {
        const [submissionResult] = await db
          .select({ count: count() })
          .from(grantSubmissions)
          .where(eq(grantSubmissions.grantId, grant.id));

        let hasSubmitted = false;
        let userSubmission = undefined;

        if (currentUserId) {
          const [submission] = await db
            .select()
            .from(grantSubmissions)
            .where(and(eq(grantSubmissions.grantId, grant.id), eq(grantSubmissions.userId, currentUserId)));
          hasSubmitted = !!submission;
          userSubmission = submission;
        }

        return {
          ...grant,
          submissionCount: submissionResult?.count || 0,
          hasSubmitted,
          userSubmission,
        };
      })
    );
  }

  async submitToGrant(grantId: string, projectId: string, userId: string): Promise<GrantSubmission> {
    const [submission] = await db
      .insert(grantSubmissions)
      .values({ grantId, projectId, userId })
      .returning();
    return submission;
  }

  // User-created Grants
  async createGrant(userId: string, data: InsertGrant): Promise<Grant> {
    const [grant] = await db
      .insert(grants)
      .values({ ...data, userId })
      .returning();
    return grant;
  }

  async getGrantById(id: string, currentUserId?: string): Promise<any> {
    const [grant] = await db.select().from(grants).where(eq(grants.id, id));
    if (!grant) return undefined;
    return this.enrichGrant(grant, currentUserId);
  }

  async getGrantsByUser(userId: string): Promise<any[]> {
    const userGrants = await db
      .select()
      .from(grants)
      .where(eq(grants.userId, userId))
      .orderBy(desc(grants.createdAt));

    return Promise.all(userGrants.map((g) => this.enrichGrant(g, userId)));
  }

  async updateGrant(id: string, userId: string, data: Partial<InsertGrant>): Promise<Grant> {
    const [grant] = await db
      .update(grants)
      .set(data)
      .where(and(eq(grants.id, id), eq(grants.userId, userId)))
      .returning();
    return grant;
  }

  async deleteGrant(id: string, userId: string): Promise<void> {
    await db.delete(grants).where(and(eq(grants.id, id), eq(grants.userId, userId)));
  }

  private async enrichGrant(grant: Grant, currentUserId?: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, grant.userId));
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, grant.userId));
    
    const [submissionResult] = await db
      .select({ count: count() })
      .from(grantSubmissions)
      .where(eq(grantSubmissions.grantId, grant.id));

    const [applicationResult] = await db
      .select({ count: count() })
      .from(grantApplications)
      .where(eq(grantApplications.grantId, grant.id));

    let hasSubmitted = false;
    let hasApplied = false;
    let userSubmission = undefined;
    let userApplication = undefined;

    if (currentUserId) {
      const [submission] = await db
        .select()
        .from(grantSubmissions)
        .where(and(eq(grantSubmissions.grantId, grant.id), eq(grantSubmissions.userId, currentUserId)));
      hasSubmitted = !!submission;
      userSubmission = submission;

      const [application] = await db
        .select()
        .from(grantApplications)
        .where(and(eq(grantApplications.grantId, grant.id), eq(grantApplications.userId, currentUserId)));
      hasApplied = !!application;
      userApplication = application;
    }

    return {
      ...grant,
      user: { ...user, profile },
      submissionCount: submissionResult?.count || 0,
      applicationCount: applicationResult?.count || 0,
      hasSubmitted,
      hasApplied,
      userSubmission,
      userApplication,
    };
  }

  // Grant Applications
  async applyToGrant(grantId: string, userId: string, data: InsertGrantApplication): Promise<GrantApplication> {
    const [application] = await db
      .insert(grantApplications)
      .values({ ...data, grantId, userId })
      .returning();

    const [grant] = await db.select().from(grants).where(eq(grants.id, grantId));
    if (grant && grant.userId !== userId) {
      const [applicant] = await db.select().from(users).where(eq(users.id, userId));
      await this.createNotification(
        grant.userId,
        "application",
        "New grant application",
        `${applicant?.firstName || "Someone"} applied to "${grant.title}"`,
        grantId,
        "grant"
      );
    }

    return application;
  }

  async getGrantApplications(grantId: string, userId: string): Promise<any[]> {
    const [grant] = await db.select().from(grants).where(eq(grants.id, grantId));
    if (!grant || grant.userId !== userId) return [];

    const allApplications = await db
      .select()
      .from(grantApplications)
      .where(eq(grantApplications.grantId, grantId))
      .orderBy(desc(grantApplications.createdAt));

    return Promise.all(
      allApplications.map(async (app) => {
        const [user] = await db.select().from(users).where(eq(users.id, app.userId));
        const [profile] = await db.select().from(profiles).where(eq(profiles.userId, app.userId));
        return { ...app, user: { ...user, profile } };
      })
    );
  }

  async getUserApplications(userId: string): Promise<any[]> {
    const userApps = await db
      .select()
      .from(grantApplications)
      .where(eq(grantApplications.userId, userId))
      .orderBy(desc(grantApplications.createdAt));

    return Promise.all(
      userApps.map(async (app) => {
        const [grant] = await db.select().from(grants).where(eq(grants.id, app.grantId));
        return { ...app, grant };
      })
    );
  }

  async updateApplicationStatus(applicationId: string, userId: string, status: string): Promise<GrantApplication> {
    const [application] = await db.select().from(grantApplications).where(eq(grantApplications.id, applicationId));
    if (!application) throw new Error("Application not found");

    const [grant] = await db.select().from(grants).where(eq(grants.id, application.grantId));
    if (!grant || grant.userId !== userId) throw new Error("Unauthorized");

    const [updated] = await db
      .update(grantApplications)
      .set({ status })
      .where(eq(grantApplications.id, applicationId))
      .returning();

    await this.createNotification(
      application.userId,
      "application_update",
      `Your application was ${status}`,
      `Your application to "${grant.title}" has been ${status}`,
      grant.id,
      "grant"
    );

    return updated;
  }

  // Notifications
  async getNotifications(userId: string): Promise<any[]> {
    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    
    const result = [];
    for (const notif of notifs) {
      let fromUser = null;
      if (notif.fromUserId) {
        const [user] = await db.select().from(users).where(eq(users.id, notif.fromUserId));
        const [profile] = await db.select().from(profiles).where(eq(profiles.userId, notif.fromUserId));
        if (user) {
          fromUser = { ...user, profileImageUrl: profile?.profileImageUrl };
        }
      }
      result.push({ ...notif, fromUser });
    }
    return result;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count || 0;
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message?: string,
    referenceId?: string,
    referenceType?: string,
    fromUserId?: string
  ): Promise<void> {
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      referenceId,
      referenceType,
      fromUserId,
    });
  }

  // Conversations & Messages
  async getConversations(userId: string): Promise<any[]> {
    const convos = await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)))
      .orderBy(desc(conversations.lastMessageAt));
    
    const result = [];
    for (const convo of convos) {
      const otherUserId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, otherUserId));
      
      const [unreadCount] = await db
        .select({ count: count() })
        .from(messages)
        .where(and(
          eq(messages.conversationId, convo.id),
          ne(messages.senderId, userId),
          eq(messages.isRead, false)
        ));
      
      const [lastMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convo.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      result.push({
        ...convo,
        otherUser: otherUser ? {
          ...otherUser,
          profileImageUrl: profile?.profileImageUrl,
          username: profile?.username
        } : null,
        unreadCount: unreadCount?.count || 0,
        lastMessage
      });
    }
    return result;
  }

  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<any> {
    const [sortedId1, sortedId2] = [user1Id, user2Id].sort();
    
    const [existing] = await db
      .select()
      .from(conversations)
      .where(or(
        and(eq(conversations.user1Id, sortedId1), eq(conversations.user2Id, sortedId2)),
        and(eq(conversations.user1Id, sortedId2), eq(conversations.user2Id, sortedId1))
      ));
    
    if (existing) {
      const otherUserId = existing.user1Id === user1Id ? existing.user2Id : existing.user1Id;
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, otherUserId));
      return {
        ...existing,
        otherUser: otherUser ? { ...otherUser, profileImageUrl: profile?.profileImageUrl, username: profile?.username } : null
      };
    }
    
    const [newConvo] = await db.insert(conversations).values({
      user1Id: sortedId1,
      user2Id: sortedId2,
    }).returning();
    
    const otherUserId = newConvo.user1Id === user1Id ? newConvo.user2Id : newConvo.user1Id;
    const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, otherUserId));
    
    return {
      ...newConvo,
      otherUser: otherUser ? { ...otherUser, profileImageUrl: profile?.profileImageUrl, username: profile?.username } : null
    };
  }

  async getMessages(conversationId: string, userId: string): Promise<any[]> {
    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    
    if (!convo || (convo.user1Id !== userId && convo.user2Id !== userId)) {
      return [];
    }
    
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
    
    const result = [];
    for (const msg of msgs) {
      const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, msg.senderId));
      result.push({
        ...msg,
        sender: sender ? { ...sender, profileImageUrl: profile?.profileImageUrl, username: profile?.username } : null
      });
    }
    return result;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: string = "text",
    voiceNoteUrl?: string,
    imageUrl?: string,
    fileUrl?: string,
    fileName?: string
  ): Promise<any> {
    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    
    if (!convo || (convo.user1Id !== senderId && convo.user2Id !== senderId)) {
      throw new Error("Not authorized");
    }
    
    const [msg] = await db.insert(messages).values({
      conversationId,
      senderId,
      content,
      messageType,
      voiceNoteUrl,
      imageUrl,
      fileUrl,
      fileName,
    }).returning();
    
    await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
    
    const [sender] = await db.select().from(users).where(eq(users.id, senderId));
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, senderId));
    return {
      ...msg,
      sender: sender ? { ...sender, profileImageUrl: profile?.profileImageUrl, username: profile?.username } : null
    };
  }

  async markMessagesRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderId, userId)
      ));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const convos = await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)));
    
    let uniqueUsers = 0;
    for (const convo of convos) {
      const [result] = await db
        .select({ count: count() })
        .from(messages)
        .where(and(
          eq(messages.conversationId, convo.id),
          ne(messages.senderId, userId),
          eq(messages.isRead, false)
        ));
      if ((result?.count || 0) > 0) {
        uniqueUsers++;
      }
    }
    return uniqueUsers;
  }

  // Reactions
  async getReactions(targetType: string, targetId: string): Promise<any[]> {
    const rxns = await db
      .select()
      .from(reactions)
      .where(and(eq(reactions.targetType, targetType), eq(reactions.targetId, targetId)));
    
    const result = [];
    for (const rxn of rxns) {
      const [user] = await db.select().from(users).where(eq(users.id, rxn.userId));
      result.push({ ...rxn, user });
    }
    return result;
  }

  async addReaction(userId: string, emoji: string, targetType: string, targetId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(reactions)
      .where(and(
        eq(reactions.userId, userId),
        eq(reactions.emoji, emoji),
        eq(reactions.targetType, targetType),
        eq(reactions.targetId, targetId)
      ));
    
    if (!existing) {
      await db.insert(reactions).values({ userId, emoji, targetType, targetId });
    }
  }

  async removeReaction(userId: string, emoji: string, targetType: string, targetId: string): Promise<void> {
    await db.delete(reactions).where(and(
      eq(reactions.userId, userId),
      eq(reactions.emoji, emoji),
      eq(reactions.targetType, targetType),
      eq(reactions.targetId, targetId)
    ));
  }

  // Stats
  async getStats(): Promise<{ projectCount: number; userCount: number; grantCount: number }> {
    const [projectResult] = await db.select({ count: count() }).from(projects);
    const [userResult] = await db.select({ count: count() }).from(users);
    const [grantResult] = await db.select({ count: count() }).from(grants).where(eq(grants.status, "open"));
    
    return {
      projectCount: projectResult?.count || 0,
      userCount: userResult?.count || 0,
      grantCount: grantResult?.count || 0,
    };
  }

  // Posts
  async createPost(userId: string, content: string | null, voiceNoteUrl?: string): Promise<any> {
    const [post] = await db.insert(posts).values({
      userId,
      content,
      voiceNoteUrl,
    }).returning();
    return post;
  }

  async addPostMedia(postId: string, mediaType: string, mediaUrl: string, previewUrl?: string, aspectRatio?: string, orderIndex: number = 0): Promise<any> {
    const [media] = await db.insert(postMedia).values({
      postId,
      mediaType,
      mediaUrl,
      previewUrl,
      aspectRatio,
      orderIndex,
    }).returning();
    return media;
  }

  async getPosts(currentUserId?: string): Promise<any[]> {
    const allPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(50);

    return Promise.all(allPosts.map(async (post) => {
      const [user] = await db.select().from(users).where(eq(users.id, post.userId));
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, post.userId));
      const media = await db.select().from(postMedia).where(eq(postMedia.postId, post.id)).orderBy(postMedia.orderIndex);
      const [likeCount] = await db.select({ count: count() }).from(postLikes).where(eq(postLikes.postId, post.id));
      const [commentCount] = await db.select({ count: count() }).from(postComments).where(eq(postComments.postId, post.id));
      
      let isLiked = false;
      if (currentUserId) {
        const [like] = await db.select().from(postLikes).where(and(
          eq(postLikes.postId, post.id),
          eq(postLikes.userId, currentUserId)
        ));
        isLiked = !!like;
      }

      return {
        ...post,
        type: "post",
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: profile?.profileImageUrl || user.profileImageUrl,
          username: profile?.username,
        } : null,
        media,
        likeCount: likeCount?.count || 0,
        commentCount: commentCount?.count || 0,
        isLiked,
      };
    }));
  }

  async getFeed(userId: string): Promise<any[]> {
    const followingIds = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    const followingUserIds = followingIds.map(f => f.followingId);
    followingUserIds.push(userId);

    const feedPosts = await db
      .select()
      .from(posts)
      .where(inArray(posts.userId, followingUserIds))
      .orderBy(desc(posts.createdAt))
      .limit(30);

    const feedProjects = await db
      .select()
      .from(projects)
      .where(inArray(projects.userId, followingUserIds))
      .orderBy(desc(projects.createdAt))
      .limit(30);

    const postsWithData = await Promise.all(feedPosts.map(async (post) => {
      const [user] = await db.select().from(users).where(eq(users.id, post.userId));
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, post.userId));
      const media = await db.select().from(postMedia).where(eq(postMedia.postId, post.id)).orderBy(postMedia.orderIndex);
      const [likeCount] = await db.select({ count: count() }).from(postLikes).where(eq(postLikes.postId, post.id));
      const [commentCount] = await db.select({ count: count() }).from(postComments).where(eq(postComments.postId, post.id));
      
      let isLiked = false;
      const [like] = await db.select().from(postLikes).where(and(
        eq(postLikes.postId, post.id),
        eq(postLikes.userId, userId)
      ));
      isLiked = !!like;

      return {
        ...post,
        type: "post",
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: profile?.profileImageUrl || user.profileImageUrl,
          username: profile?.username,
        } : null,
        media,
        likeCount: likeCount?.count || 0,
        commentCount: commentCount?.count || 0,
        isLiked,
      };
    }));

    const projectsWithData = await Promise.all(feedProjects.map(async (project) => {
      const [user] = await db.select().from(users).where(eq(users.id, project.userId));
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, project.userId));
      const [upvoteCount] = await db.select({ count: count() }).from(projectUpvotes).where(eq(projectUpvotes.projectId, project.id));
      const [commentCount] = await db.select({ count: count() }).from(projectComments).where(eq(projectComments.projectId, project.id));
      
      let isUpvoted = false;
      const [upvote] = await db.select().from(projectUpvotes).where(and(
        eq(projectUpvotes.projectId, project.id),
        eq(projectUpvotes.userId, userId)
      ));
      isUpvoted = !!upvote;

      return {
        ...project,
        type: "project",
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: profile?.profileImageUrl || user.profileImageUrl,
          username: profile?.username,
        } : null,
        upvoteCount: upvoteCount?.count || 0,
        commentCount: commentCount?.count || 0,
        isUpvoted,
      };
    }));

    const combined = [...postsWithData, ...projectsWithData];
    combined.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return combined.slice(0, 50);
  }

  async getPostById(id: string, currentUserId?: string): Promise<any> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post) return null;

    const [user] = await db.select().from(users).where(eq(users.id, post.userId));
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, post.userId));
    const media = await db.select().from(postMedia).where(eq(postMedia.postId, post.id)).orderBy(postMedia.orderIndex);
    const [likeCount] = await db.select({ count: count() }).from(postLikes).where(eq(postLikes.postId, post.id));
    const [commentCount] = await db.select({ count: count() }).from(postComments).where(eq(postComments.postId, post.id));
    
    let isLiked = false;
    if (currentUserId) {
      const [like] = await db.select().from(postLikes).where(and(
        eq(postLikes.postId, post.id),
        eq(postLikes.userId, currentUserId)
      ));
      isLiked = !!like;
    }

    return {
      ...post,
      type: "post",
      user: user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImageUrl: profile?.profileImageUrl || user.profileImageUrl,
        username: profile?.username,
      } : null,
      media,
      likeCount: likeCount?.count || 0,
      commentCount: commentCount?.count || 0,
      isLiked,
    };
  }

  async getPostsByUser(userId: string, currentUserId?: string): Promise<any[]> {
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));

    return Promise.all(userPosts.map(async (post) => {
      const [user] = await db.select().from(users).where(eq(users.id, post.userId));
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, post.userId));
      const media = await db.select().from(postMedia).where(eq(postMedia.postId, post.id)).orderBy(postMedia.orderIndex);
      const [likeCount] = await db.select({ count: count() }).from(postLikes).where(eq(postLikes.postId, post.id));
      const [commentCount] = await db.select({ count: count() }).from(postComments).where(eq(postComments.postId, post.id));
      
      let isLiked = false;
      if (currentUserId) {
        const [like] = await db.select().from(postLikes).where(and(
          eq(postLikes.postId, post.id),
          eq(postLikes.userId, currentUserId)
        ));
        isLiked = !!like;
      }

      return {
        ...post,
        type: "post",
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: profile?.profileImageUrl || user.profileImageUrl,
          username: profile?.username,
        } : null,
        media,
        likeCount: likeCount?.count || 0,
        commentCount: commentCount?.count || 0,
        isLiked,
      };
    }));
  }

  async deletePost(id: string, userId: string): Promise<void> {
    await db.delete(posts).where(and(eq(posts.id, id), eq(posts.userId, userId)));
  }

  async likePost(postId: string, userId: string): Promise<void> {
    const existing = await db.select().from(postLikes).where(and(
      eq(postLikes.postId, postId),
      eq(postLikes.userId, userId)
    ));
    if (existing.length === 0) {
      await db.insert(postLikes).values({ postId, userId });
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    await db.delete(postLikes).where(and(
      eq(postLikes.postId, postId),
      eq(postLikes.userId, userId)
    ));
  }

  async getPostComments(postId: string): Promise<any[]> {
    const comments = await db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(desc(postComments.createdAt));

    return Promise.all(comments.map(async (comment) => {
      const [user] = await db.select().from(users).where(eq(users.id, comment.userId));
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, comment.userId));
      return {
        ...comment,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: profile?.profileImageUrl || user.profileImageUrl,
          username: profile?.username,
        } : null,
      };
    }));
  }

  async createPostComment(postId: string, userId: string, content: string): Promise<any> {
    const [comment] = await db.insert(postComments).values({
      postId,
      userId,
      content,
    }).returning();
    return comment;
  }

  async deletePostComment(commentId: string, userId: string): Promise<void> {
    await db.delete(postComments).where(and(
      eq(postComments.id, commentId),
      eq(postComments.userId, userId)
    ));
  }

  // Stories
  async createStory(userId: string, mediaType: string, mediaUrl: string, previewUrl?: string): Promise<any> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const [story] = await db.insert(stories).values({
      userId,
      mediaType,
      mediaUrl,
      previewUrl,
      expiresAt,
    }).returning();
    return story;
  }

  async getStories(userId: string): Promise<any[]> {
    const followingIds = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    const followingUserIds = followingIds.map(f => f.followingId);
    followingUserIds.push(userId);

    const now = new Date();
    const activeStories = await db
      .select()
      .from(stories)
      .where(and(
        inArray(stories.userId, followingUserIds),
        gt(stories.expiresAt, now)
      ))
      .orderBy(desc(stories.createdAt));

    const groupedByUser = activeStories.reduce((acc, story) => {
      if (!acc[story.userId]) {
        acc[story.userId] = [];
      }
      acc[story.userId].push(story);
      return acc;
    }, {} as Record<string, typeof activeStories>);

    const result = await Promise.all(Object.entries(groupedByUser).map(async ([storyUserId, userStories]) => {
      const [user] = await db.select().from(users).where(eq(users.id, storyUserId));
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, storyUserId));
      return {
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: profile?.profileImageUrl || user.profileImageUrl,
          username: profile?.username,
        } : null,
        stories: userStories,
        storyCount: userStories.length,
      };
    }));

    return result;
  }

  async getStoriesByUser(userId: string): Promise<any[]> {
    const now = new Date();
    return db
      .select()
      .from(stories)
      .where(and(
        eq(stories.userId, userId),
        gt(stories.expiresAt, now)
      ))
      .orderBy(desc(stories.createdAt));
  }

  async deleteStory(id: string, userId: string): Promise<void> {
    await db.delete(stories).where(and(eq(stories.id, id), eq(stories.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
