import { users, type User, type UpsertUser } from "@shared/models/auth";
import { profiles } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Auto-create profile if it doesn't exist using upsert to avoid race conditions
    try {
      // Generate a unique username from email or name
      let baseUsername = "";
      if (userData.firstName && userData.lastName) {
        baseUsername = `${userData.firstName}${userData.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      } else if (userData.firstName) {
        baseUsername = userData.firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
      } else if (userData.email) {
        baseUsername = userData.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      } else {
        baseUsername = "user";
      }
      baseUsername = baseUsername.substring(0, 20) || "user";
      
      // Add timestamp to make username unique for new users
      const uniqueUsername = `${baseUsername}${Date.now().toString(36)}`;
      
      // Use onConflictDoNothing to safely handle race conditions
      await db.insert(profiles).values({
        userId: user.id,
        username: uniqueUsername,
        profileImageUrl: userData.profileImageUrl || null,
        bio: null,
        websiteUrl: null,
        githubUrl: null,
        twitterUrl: null,
        linkedinUrl: null,
        skills: [],
        tools: [],
      }).onConflictDoNothing({ target: profiles.userId });
    } catch (err) {
      // Profile may already exist, which is fine - ignore duplicate key errors
      console.log("Profile creation skipped (may already exist):", user.id);
    }
    
    return user;
  }
}

export const authStorage = new AuthStorage();
