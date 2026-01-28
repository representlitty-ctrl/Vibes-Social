import OpenAI from "openai";
import { db } from "./db";
import { newsArticles, posts, users, profiles } from "@shared/schema";
import { eq, isNull, desc } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const NEWS_CATEGORIES = ["crypto", "tech", "politics", "finance", "ai"] as const;
type NewsCategory = typeof NEWS_CATEGORIES[number];

const NEWS_BOT_EMAIL = "newsbot@vibes.app";
let newsBotUserId: string | null = null;

async function ensureNewsBotUser(): Promise<string> {
  if (newsBotUserId) return newsBotUserId;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, NEWS_BOT_EMAIL));

  if (existingUser) {
    newsBotUserId = existingUser.id;
    return existingUser.id;
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email: NEWS_BOT_EMAIL,
      firstName: "Vibes",
      lastName: "News",
      profileImageUrl: null,
    })
    .returning();

  await db
    .insert(profiles)
    .values({
      userId: newUser.id,
      username: "vibesnews",
      bio: "Official Vibes news bot bringing you the latest updates in crypto, tech, politics, finance, and AI.",
      isStaff: true,
      isNewsBot: true,
    })
    .onConflictDoNothing();

  newsBotUserId = newUser.id;
  return newUser.id;
}

async function fetchNewsWithAI(): Promise<Array<{ title: string; summary: string; category: NewsCategory }>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a news aggregator. Generate 10 current, realistic news headlines and brief summaries for a social platform. 
Include a mix of: crypto/blockchain, technology, politics, finance, and AI news.
Each item should be engaging and informative.
Return JSON array with objects containing: title, summary (2-3 sentences), category (one of: crypto, tech, politics, finance, ai).`
        },
        {
          role: "user",
          content: `Generate 10 diverse, current news items for today (${new Date().toLocaleDateString()}). Make them realistic and engaging for a tech-savvy audience.`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const items = parsed.news || parsed.articles || parsed.items || [];
    
    return items.filter((item: any) => 
      item.title && 
      item.summary && 
      NEWS_CATEGORIES.includes(item.category)
    ).slice(0, 10);
  } catch (error) {
    console.error("Error fetching news with AI:", error);
    return [];
  }
}

async function createNewsPost(
  userId: string,
  title: string,
  summary: string,
  category: NewsCategory
): Promise<string | null> {
  try {
    const categoryLabels: Record<NewsCategory, string> = {
      crypto: "CRYPTO",
      tech: "TECH",
      politics: "POLITICS",
      finance: "FINANCE",
      ai: "AI",
    };

    const content = `**${categoryLabels[category]} NEWS**

${title}

${summary}`;

    const [post] = await db
      .insert(posts)
      .values({
        userId,
        content,
      })
      .returning();

    return post.id;
  } catch (error) {
    console.error("Error creating news post:", error);
    return null;
  }
}

export async function fetchAndStoreNews(): Promise<number> {
  console.log("[NewsService] Fetching news...");
  
  const userId = await ensureNewsBotUser();
  const newsItems = await fetchNewsWithAI();
  
  let storedCount = 0;
  
  for (const item of newsItems) {
    try {
      const [existing] = await db
        .select()
        .from(newsArticles)
        .where(eq(newsArticles.title, item.title));
      
      if (existing) continue;

      await db.insert(newsArticles).values({
        title: item.title,
        summary: item.summary,
        category: item.category,
      });
      
      storedCount++;
    } catch (error) {
      console.error("Error storing news article:", error);
    }
  }
  
  console.log(`[NewsService] Stored ${storedCount} new articles`);
  return storedCount;
}

export async function postPendingNews(): Promise<number> {
  const userId = await ensureNewsBotUser();
  
  const pendingArticles = await db
    .select()
    .from(newsArticles)
    .where(isNull(newsArticles.postedAt))
    .orderBy(desc(newsArticles.fetchedAt))
    .limit(5);
  
  let postedCount = 0;
  
  for (const article of pendingArticles) {
    const postId = await createNewsPost(
      userId,
      article.title,
      article.summary,
      article.category as NewsCategory
    );
    
    if (postId) {
      await db
        .update(newsArticles)
        .set({ postId, postedAt: new Date() })
        .where(eq(newsArticles.id, article.id));
      
      postedCount++;
    }
  }
  
  console.log(`[NewsService] Posted ${postedCount} news articles`);
  return postedCount;
}

let newsInterval: NodeJS.Timeout | null = null;
let postInterval: NodeJS.Timeout | null = null;

export function startNewsService() {
  console.log("[NewsService] Starting news service...");
  
  fetchAndStoreNews().then(() => {
    postPendingNews();
  });
  
  newsInterval = setInterval(() => {
    fetchAndStoreNews();
  }, 6 * 60 * 60 * 1000);
  
  postInterval = setInterval(() => {
    postPendingNews();
  }, 60 * 60 * 1000);
  
  console.log("[NewsService] News service started - fetching every 6 hours, posting hourly");
}

export function stopNewsService() {
  if (newsInterval) {
    clearInterval(newsInterval);
    newsInterval = null;
  }
  if (postInterval) {
    clearInterval(postInterval);
    postInterval = null;
  }
  console.log("[NewsService] News service stopped");
}
