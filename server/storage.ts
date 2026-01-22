import { db } from "./db";
import { eq, desc, and, sql, count, or, ilike } from "drizzle-orm";
import {
  users,
  profiles,
  projects,
  projectUpvotes,
  projectComments,
  follows,
  resources,
  resourceUpvotes,
  resourceBookmarks,
  resourceComments,
  grants,
  grantSubmissions,
  notifications,
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
  type Notification,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  
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
  upvoteResource(resourceId: string, userId: string): Promise<void>;
  removeResourceUpvote(resourceId: string, userId: string): Promise<void>;
  bookmarkResource(resourceId: string, userId: string): Promise<void>;
  removeResourceBookmark(resourceId: string, userId: string): Promise<void>;
  
  // Grants
  getGrants(currentUserId?: string): Promise<any[]>;
  submitToGrant(grantId: string, projectId: string, userId: string): Promise<GrantSubmission>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(notificationId: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  createNotification(userId: string, type: string, title: string, message?: string, referenceId?: string, referenceType?: string): Promise<void>;
  
  // Stats
  getStats(): Promise<{ projectCount: number; userCount: number; grantCount: number }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  // Profiles
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile || undefined;
  }

  async getProfileWithUser(userId: string, currentUserId?: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;

    let [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    if (!profile) {
      [profile] = await db.insert(profiles).values({ userId }).returning();
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

    const [commentResult] = await db
      .select({ count: count() })
      .from(projectComments)
      .where(eq(projectComments.projectId, project.id));

    let hasUpvoted = false;
    if (currentUserId) {
      const [upvote] = await db
        .select()
        .from(projectUpvotes)
        .where(and(eq(projectUpvotes.projectId, project.id), eq(projectUpvotes.userId, currentUserId)));
      hasUpvoted = !!upvote;
    }

    return {
      ...project,
      user: { ...user, profile },
      upvoteCount: upvoteResult?.count || 0,
      commentCount: commentResult?.count || 0,
      hasUpvoted,
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
    await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
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

    let hasUpvoted = false;
    let hasBookmarked = false;

    if (currentUserId) {
      const [upvote] = await db
        .select()
        .from(resourceUpvotes)
        .where(and(eq(resourceUpvotes.resourceId, resource.id), eq(resourceUpvotes.userId, currentUserId)));
      hasUpvoted = !!upvote;

      const [bookmark] = await db
        .select()
        .from(resourceBookmarks)
        .where(and(eq(resourceBookmarks.resourceId, resource.id), eq(resourceBookmarks.userId, currentUserId)));
      hasBookmarked = !!bookmark;
    }

    return {
      ...resource,
      upvoteCount: upvoteResult?.count || 0,
      hasUpvoted,
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

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
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
    referenceType?: string
  ): Promise<void> {
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      referenceId,
      referenceType,
    });
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
}

export const storage = new DatabaseStorage();
