import { db } from "./db";
import { resources, grants } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Seed learning resources
  const sampleResources = [
    {
      title: "Getting Started with Vibecoding",
      description: "A comprehensive guide to understanding the vibecoding philosophy and how to get started building creative projects with AI assistance.",
      url: "https://example.com/vibecoding-guide",
      category: "Tutorial",
      tags: ["beginner", "ai", "vibecoding"],
      isFeatured: true,
    },
    {
      title: "React + TypeScript Best Practices",
      description: "Learn modern React patterns with TypeScript for building robust and maintainable applications.",
      url: "https://example.com/react-typescript",
      category: "Course",
      tags: ["react", "typescript", "web"],
      isFeatured: true,
    },
    {
      title: "Building with AI: Prompt Engineering",
      description: "Master the art of prompt engineering to get the best results from AI coding assistants.",
      url: "https://example.com/prompt-engineering",
      category: "Article",
      tags: ["ai", "prompting", "productivity"],
      isFeatured: false,
    },
    {
      title: "Tailwind CSS from Zero to Hero",
      description: "A complete video course on mastering Tailwind CSS for rapid UI development.",
      url: "https://example.com/tailwind-course",
      category: "Video",
      tags: ["css", "tailwind", "design"],
      isFeatured: false,
    },
    {
      title: "Replit AI Agent Guide",
      description: "Learn how to use Replit's AI agent to build full-stack applications from scratch.",
      url: "https://example.com/replit-agent",
      category: "Tutorial",
      tags: ["replit", "ai", "deployment"],
      isFeatured: true,
    },
    {
      title: "Database Design Patterns",
      description: "Essential database design patterns for web applications, from basic CRUD to complex relationships.",
      url: "https://example.com/db-patterns",
      category: "Article",
      tags: ["database", "postgresql", "backend"],
      isFeatured: false,
    },
  ];

  for (const resource of sampleResources) {
    await db.insert(resources).values(resource).onConflictDoNothing();
  }
  console.log("Resources seeded!");

  // Seed grants
  const sampleGrants = [
    {
      title: "Vibecoder Creator Fund",
      description: "We're looking for innovative projects that push the boundaries of what's possible with vibecoding. Submit your most creative work for a chance to receive funding and mentorship.",
      amount: "500",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "open",
    },
    {
      title: "AI Tools Challenge",
      description: "Build a developer tool powered by AI. We want to fund projects that make developers more productive and creative.",
      amount: "1000",
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      status: "open",
    },
    {
      title: "Community Impact Grant",
      description: "Create something that benefits the vibecoding community. Could be educational content, open source tools, or community platforms.",
      amount: "250",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: "open",
    },
  ];

  for (const grant of sampleGrants) {
    await db.insert(grants).values(grant).onConflictDoNothing();
  }
  console.log("Grants seeded!");

  console.log("Database seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
