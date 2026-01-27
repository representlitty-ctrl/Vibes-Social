import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Re-export chat models
export * from "./models/chat";

// User Profiles - extends the auth user
export const profiles = pgTable("profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  username: varchar("username").unique(),
  bio: text("bio"),
  skills: text("skills").array(),
  tools: text("tools").array(),
  twitterUrl: varchar("twitter_url"),
  githubUrl: varchar("github_url"),
  websiteUrl: varchar("website_url"),
  linkedinUrl: varchar("linkedin_url"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
});

// Import users from auth for relations
import { users } from "./models/auth";

// Projects
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  demoUrl: varchar("demo_url"),
  githubUrl: varchar("github_url"),
  imageUrl: varchar("image_url"),
  voiceNoteUrl: varchar("voice_note_url"),
  tags: text("tags").array(),
  userId: varchar("user_id").notNull().references(() => users.id),
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Upvotes
export const projectUpvotes = pgTable("project_upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Downvotes
export const projectDownvotes = pgTable("project_downvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Bookmarks
export const projectBookmarks = pgTable("project_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Comments
export const projectComments = pgTable("project_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Follows
export const follows = pgTable("follows", {
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followingId] })
]);

// Learning Resources
export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  url: varchar("url").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).default("article"),
  tags: text("tags").array(),
  imageUrl: varchar("image_url"),
  userId: varchar("user_id").references(() => users.id),
  isApproved: boolean("is_approved").default(false),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resource Upvotes
export const resourceUpvotes = pgTable("resource_upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resource Downvotes
export const resourceDownvotes = pgTable("resource_downvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resource Bookmarks
export const resourceBookmarks = pgTable("resource_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resource Comments
export const resourceComments = pgTable("resource_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grants
export const grants = pgTable("grants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  amount: varchar("amount"),
  deadline: timestamp("deadline"),
  requirements: text("requirements"),
  imageUrl: varchar("image_url"),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 50 }).default("open"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grant Applications (users apply to grants)
export const grantApplications = pgTable("grant_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grantId: varchar("grant_id").notNull().references(() => grants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  pitch: text("pitch").notNull(),
  projectUrl: varchar("project_url"),
  status: varchar("status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grant Submissions
export const grantSubmissions = pgTable("grant_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grantId: varchar("grant_id").notNull().references(() => grants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 50 }).default("pending"),
  isWinner: boolean("is_winner").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  referenceId: varchar("reference_id"),
  referenceType: varchar("reference_type", { length: 50 }),
  fromUserId: varchar("from_user_id").references(() => users.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Direct Messages - Conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content"),
  messageType: varchar("message_type", { length: 20 }).default("text"),
  voiceNoteUrl: varchar("voice_note_url"),
  imageUrl: varchar("image_url"),
  fileUrl: varchar("file_url"),
  fileName: varchar("file_name"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Emoji Reactions (for projects and comments)
export const reactions = pgTable("reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull(),
  targetId: varchar("target_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social Posts
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content"),
  voiceNoteUrl: varchar("voice_note_url"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post Media (images/videos)
export const postMedia = pgTable("post_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  mediaType: varchar("media_type", { length: 20 }).notNull(),
  mediaUrl: varchar("media_url").notNull(),
  previewUrl: varchar("preview_url"),
  aspectRatio: varchar("aspect_ratio"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post Likes
export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post Comments
export const postComments = pgTable("post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stories
export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  mediaType: varchar("media_type", { length: 20 }).notNull(),
  mediaUrl: varchar("media_url").notNull(),
  previewUrl: varchar("preview_url"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Learning Courses
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url"),
  category: varchar("category", { length: 100 }).notNull(),
  difficulty: varchar("difficulty", { length: 50 }).default("beginner"),
  duration: varchar("duration"),
  instructorId: varchar("instructor_id").notNull().references(() => users.id),
  isPublished: boolean("is_published").default(false),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course Lessons
export const courseLessons = pgTable("course_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  videoUrl: varchar("video_url"),
  orderIndex: integer("order_index").default(0),
  duration: varchar("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course Enrollments
export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course Progress (track completed lessons)
export const courseProgress = pgTable("course_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id").notNull().references(() => courseEnrollments.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").notNull().references(() => courseLessons.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Communities
export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  imageUrl: varchar("image_url"),
  coverImageUrl: varchar("cover_image_url"),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Community Members
export const communityMembers = pgTable("community_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 20 }).default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Community Posts (posts can optionally belong to a community)
export const communityPosts = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lesson Quizzes (Q&A for each lesson)
export const lessonQuizzes = pgTable("lesson_quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => courseLessons.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  correctOptionIndex: integer("correct_option_index").notNull(),
  explanation: text("explanation"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz Attempts (track user answers)
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => lessonQuizzes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  selectedOptionIndex: integer("selected_option_index").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

// Course Certificates (issued upon completing all lessons and passing quizzes)
export const courseCertificates = pgTable("course_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  certificateNumber: varchar("certificate_number", { length: 50 }).notNull().unique(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// User Badges (achievements and course completion badges)
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeType: varchar("badge_type", { length: 50 }).notNull(),
  badgeName: varchar("badge_name", { length: 100 }).notNull(),
  badgeDescription: text("badge_description"),
  badgeIcon: varchar("badge_icon", { length: 50 }),
  referenceId: varchar("reference_id"),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  projects: many(projects),
  projectUpvotes: many(projectUpvotes),
  projectComments: many(projectComments),
  notifications: many(notifications),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  upvotes: many(projectUpvotes),
  downvotes: many(projectDownvotes),
  comments: many(projectComments),
  bookmarks: many(projectBookmarks),
}));

export const projectDownvotesRelations = relations(projectDownvotes, ({ one }) => ({
  project: one(projects, { fields: [projectDownvotes.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectDownvotes.userId], references: [users.id] }),
}));

export const projectBookmarksRelations = relations(projectBookmarks, ({ one }) => ({
  project: one(projects, { fields: [projectBookmarks.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectBookmarks.userId], references: [users.id] }),
}));

export const projectUpvotesRelations = relations(projectUpvotes, ({ one }) => ({
  project: one(projects, { fields: [projectUpvotes.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectUpvotes.userId], references: [users.id] }),
}));

export const projectCommentsRelations = relations(projectComments, ({ one }) => ({
  project: one(projects, { fields: [projectComments.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectComments.userId], references: [users.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "follower" }),
  following: one(users, { fields: [follows.followingId], references: [users.id], relationName: "following" }),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  user: one(users, { fields: [resources.userId], references: [users.id] }),
  upvotes: many(resourceUpvotes),
  downvotes: many(resourceDownvotes),
  bookmarks: many(resourceBookmarks),
  comments: many(resourceComments),
}));

export const resourceDownvotesRelations = relations(resourceDownvotes, ({ one }) => ({
  resource: one(resources, { fields: [resourceDownvotes.resourceId], references: [resources.id] }),
  user: one(users, { fields: [resourceDownvotes.userId], references: [users.id] }),
}));

export const resourceUpvotesRelations = relations(resourceUpvotes, ({ one }) => ({
  resource: one(resources, { fields: [resourceUpvotes.resourceId], references: [resources.id] }),
  user: one(users, { fields: [resourceUpvotes.userId], references: [users.id] }),
}));

export const resourceBookmarksRelations = relations(resourceBookmarks, ({ one }) => ({
  resource: one(resources, { fields: [resourceBookmarks.resourceId], references: [resources.id] }),
  user: one(users, { fields: [resourceBookmarks.userId], references: [users.id] }),
}));

export const resourceCommentsRelations = relations(resourceComments, ({ one }) => ({
  resource: one(resources, { fields: [resourceComments.resourceId], references: [resources.id] }),
  user: one(users, { fields: [resourceComments.userId], references: [users.id] }),
}));

export const grantsRelations = relations(grants, ({ one, many }) => ({
  user: one(users, { fields: [grants.userId], references: [users.id] }),
  submissions: many(grantSubmissions),
  applications: many(grantApplications),
}));

export const grantApplicationsRelations = relations(grantApplications, ({ one }) => ({
  grant: one(grants, { fields: [grantApplications.grantId], references: [grants.id] }),
  user: one(users, { fields: [grantApplications.userId], references: [users.id] }),
}));

export const grantSubmissionsRelations = relations(grantSubmissions, ({ one }) => ({
  grant: one(grants, { fields: [grantSubmissions.grantId], references: [grants.id] }),
  project: one(projects, { fields: [grantSubmissions.projectId], references: [projects.id] }),
  user: one(users, { fields: [grantSubmissions.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  fromUser: one(users, { fields: [notifications.fromUserId], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user1: one(users, { fields: [conversations.user1Id], references: [users.id], relationName: "conversationUser1" }),
  user2: one(users, { fields: [conversations.user2Id], references: [users.id], relationName: "conversationUser2" }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  user: one(users, { fields: [reactions.userId], references: [users.id] }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  media: many(postMedia),
  likes: many(postLikes),
  comments: many(postComments),
}));

export const postMediaRelations = relations(postMedia, ({ one }) => ({
  post: one(posts, { fields: [postMedia.postId], references: [posts.id] }),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] }),
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(posts, { fields: [postComments.postId], references: [posts.id] }),
  user: one(users, { fields: [postComments.userId], references: [users.id] }),
}));

export const storiesRelations = relations(stories, ({ one }) => ({
  user: one(users, { fields: [stories.userId], references: [users.id] }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, { fields: [courses.instructorId], references: [users.id] }),
  lessons: many(courseLessons),
  enrollments: many(courseEnrollments),
}));

export const courseLessonsRelations = relations(courseLessons, ({ one }) => ({
  course: one(courses, { fields: [courseLessons.courseId], references: [courses.id] }),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one, many }) => ({
  course: one(courses, { fields: [courseEnrollments.courseId], references: [courses.id] }),
  user: one(users, { fields: [courseEnrollments.userId], references: [users.id] }),
  progress: many(courseProgress),
}));

export const courseProgressRelations = relations(courseProgress, ({ one }) => ({
  enrollment: one(courseEnrollments, { fields: [courseProgress.enrollmentId], references: [courseEnrollments.id] }),
  lesson: one(courseLessons, { fields: [courseProgress.lessonId], references: [courseLessons.id] }),
}));

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  creator: one(users, { fields: [communities.creatorId], references: [users.id] }),
  members: many(communityMembers),
  posts: many(communityPosts),
}));

export const communityMembersRelations = relations(communityMembers, ({ one }) => ({
  community: one(communities, { fields: [communityMembers.communityId], references: [communities.id] }),
  user: one(users, { fields: [communityMembers.userId], references: [users.id] }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one }) => ({
  community: one(communities, { fields: [communityPosts.communityId], references: [communities.id] }),
  post: one(posts, { fields: [communityPosts.postId], references: [posts.id] }),
}));

export const lessonQuizzesRelations = relations(lessonQuizzes, ({ one, many }) => ({
  lesson: one(courseLessons, { fields: [lessonQuizzes.lessonId], references: [courseLessons.id] }),
  attempts: many(quizAttempts),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(lessonQuizzes, { fields: [quizAttempts.quizId], references: [lessonQuizzes.id] }),
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
}));

export const courseCertificatesRelations = relations(courseCertificates, ({ one }) => ({
  course: one(courses, { fields: [courseCertificates.courseId], references: [courses.id] }),
  user: one(users, { fields: [courseCertificates.userId], references: [users.id] }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
}));

// Insert Schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ userId: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, userId: true, createdAt: true, updatedAt: true, isFeatured: true });
export const insertProjectCommentSchema = createInsertSchema(projectComments).omit({ id: true, userId: true, createdAt: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, userId: true, createdAt: true, isFeatured: true, isApproved: true });
export const insertResourceCommentSchema = createInsertSchema(resourceComments).omit({ id: true, userId: true, createdAt: true });
export const insertGrantSchema = createInsertSchema(grants).omit({ id: true, userId: true, createdAt: true, status: true });
export const insertGrantApplicationSchema = createInsertSchema(grantApplications).omit({ id: true, userId: true, createdAt: true, status: true });
export const insertGrantSubmissionSchema = createInsertSchema(grantSubmissions).omit({ id: true, userId: true, createdAt: true, status: true, isWinner: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, senderId: true, createdAt: true, isRead: true });
export const insertReactionSchema = createInsertSchema(reactions).omit({ id: true, userId: true, createdAt: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, userId: true, createdAt: true, updatedAt: true });
export const insertPostMediaSchema = createInsertSchema(postMedia).omit({ id: true, createdAt: true });
export const insertPostCommentSchema = createInsertSchema(postComments).omit({ id: true, userId: true, createdAt: true });
export const insertStorySchema = createInsertSchema(stories).omit({ id: true, userId: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, instructorId: true, createdAt: true, updatedAt: true, isFeatured: true });
export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({ id: true, createdAt: true });
export const insertCommunitySchema = createInsertSchema(communities).omit({ id: true, creatorId: true, createdAt: true });
export const insertLessonQuizSchema = createInsertSchema(lessonQuizzes).omit({ id: true, createdAt: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, userId: true, attemptedAt: true });

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectUpvote = typeof projectUpvotes.$inferSelect;
export type ProjectComment = typeof projectComments.$inferSelect;
export type InsertProjectComment = z.infer<typeof insertProjectCommentSchema>;

export type Follow = typeof follows.$inferSelect;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type ResourceUpvote = typeof resourceUpvotes.$inferSelect;
export type ResourceBookmark = typeof resourceBookmarks.$inferSelect;
export type ResourceComment = typeof resourceComments.$inferSelect;
export type InsertResourceComment = z.infer<typeof insertResourceCommentSchema>;

export type Grant = typeof grants.$inferSelect;
export type InsertGrant = z.infer<typeof insertGrantSchema>;

export type GrantSubmission = typeof grantSubmissions.$inferSelect;
export type InsertGrantSubmission = z.infer<typeof insertGrantSubmissionSchema>;

export type GrantApplication = typeof grantApplications.$inferSelect;
export type InsertGrantApplication = z.infer<typeof insertGrantApplicationSchema>;

export type ProjectDownvote = typeof projectDownvotes.$inferSelect;
export type ProjectBookmark = typeof projectBookmarks.$inferSelect;
export type ResourceDownvote = typeof resourceDownvotes.$inferSelect;

export type Notification = typeof notifications.$inferSelect;

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type PostMedia = typeof postMedia.$inferSelect;
export type InsertPostMedia = z.infer<typeof insertPostMediaSchema>;

export type PostLike = typeof postLikes.$inferSelect;

export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;

export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type CourseProgress = typeof courseProgress.$inferSelect;

export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;

export type CommunityMember = typeof communityMembers.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;

export type LessonQuiz = typeof lessonQuizzes.$inferSelect;
export type InsertLessonQuiz = z.infer<typeof insertLessonQuizSchema>;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

export type CourseCertificate = typeof courseCertificates.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;

// Vibecoding Lesson Progress - tracks progress through the vibecoding curriculum
export const vibecodingProgress = pgTable("vibecoding_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  lessonId: varchar("lesson_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Vibecoding Quiz Progress - tracks quiz completion for vibecoding modules
export const vibecodingQuizProgress = pgTable("vibecoding_quiz_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  moduleId: varchar("module_id").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  passed: boolean("passed").notNull().default(false),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Vibecoding Certificate - issued upon completing all lessons and quizzes
export const vibecodingCertificates = pgTable("vibecoding_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  certificateNumber: varchar("certificate_number", { length: 50 }).notNull().unique(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const insertVibecodingProgressSchema = createInsertSchema(vibecodingProgress).omit({ id: true, completedAt: true });
export type VibecodingProgress = typeof vibecodingProgress.$inferSelect;
export type InsertVibecodingProgress = z.infer<typeof insertVibecodingProgressSchema>;
export type VibecodingQuizProgress = typeof vibecodingQuizProgress.$inferSelect;
export type VibecodingCertificate = typeof vibecodingCertificates.$inferSelect;

// Vibecoding Lesson Read Tracking - server-side enforcement of minimum reading time
export const vibecodingLessonReads = pgTable("vibecoding_lesson_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  lessonId: varchar("lesson_id").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
});

export const insertVibecodingLessonReadSchema = createInsertSchema(vibecodingLessonReads).omit({ id: true, startedAt: true });
export type VibecodingLessonRead = typeof vibecodingLessonReads.$inferSelect;
export type InsertVibecodingLessonRead = z.infer<typeof insertVibecodingLessonReadSchema>;
