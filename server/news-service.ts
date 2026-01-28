import { db } from "./db";
import { newsArticles, posts, users, profiles } from "@shared/schema";
import { eq, isNull, desc } from "drizzle-orm";

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

interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

function categorizeArticle(title: string, description: string): NewsCategory {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes("bitcoin") || text.includes("crypto") || text.includes("blockchain") || 
      text.includes("ethereum") || text.includes("nft") || text.includes("defi")) {
    return "crypto";
  }
  if (text.includes("artificial intelligence") || text.includes(" ai ") || text.includes("chatgpt") || 
      text.includes("machine learning") || text.includes("openai") || text.includes("claude") ||
      text.includes("llm") || text.includes("neural")) {
    return "ai";
  }
  if (text.includes("stock") || text.includes("market") || text.includes("economy") || 
      text.includes("fed") || text.includes("inflation") || text.includes("bank") ||
      text.includes("invest") || text.includes("earnings")) {
    return "finance";
  }
  if (text.includes("congress") || text.includes("president") || text.includes("election") || 
      text.includes("senate") || text.includes("government") || text.includes("policy") ||
      text.includes("vote") || text.includes("political")) {
    return "politics";
  }
  return "tech";
}

function isWithin24Hours(publishedAt: string): boolean {
  const articleDate = new Date(publishedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff <= 24;
}

async function fetchRealNews(): Promise<Array<{ title: string; summary: string; category: NewsCategory; sourceUrl: string; sourceName: string }>> {
  const apiKey = process.env.NEWS_API_KEY;
  
  if (!apiKey) {
    console.log("[NewsService] NEWS_API_KEY not set, skipping real news fetch");
    return [];
  }

  try {
    // Get yesterday's date for the from parameter (NewsAPI free tier limit)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fromDate = yesterday.toISOString().split('T')[0];
    
    const categories = ["technology", "business", "science"];
    const allArticles: Array<{ title: string; summary: string; category: NewsCategory; sourceUrl: string; sourceName: string }> = [];
    
    for (const category of categories) {
      try {
        const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=5&apiKey=${apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`[NewsService] NewsAPI error for ${category}:`, response.status, response.statusText);
          continue;
        }
        
        const data: NewsAPIResponse = await response.json();
        
        if (data.status !== "ok") {
          console.error(`[NewsService] NewsAPI returned non-ok status for ${category}`);
          continue;
        }
        
        for (const article of data.articles) {
          // Skip articles without proper content
          if (!article.title || !article.description || article.title === "[Removed]") {
            continue;
          }
          
          // Only include articles from the last 24 hours
          if (!isWithin24Hours(article.publishedAt)) {
            continue;
          }
          
          const newsCategory = categorizeArticle(article.title, article.description);
          
          allArticles.push({
            title: article.title,
            summary: article.description,
            category: newsCategory,
            sourceUrl: article.url,
            sourceName: article.source.name,
          });
        }
      } catch (error) {
        console.error(`[NewsService] Error fetching ${category} news:`, error);
      }
    }
    
    // Deduplicate by title
    const seen = new Set<string>();
    const uniqueArticles = allArticles.filter(article => {
      if (seen.has(article.title)) return false;
      seen.add(article.title);
      return true;
    });
    
    console.log(`[NewsService] Fetched ${uniqueArticles.length} real news articles from last 24 hours`);
    return uniqueArticles.slice(0, 10);
  } catch (error) {
    console.error("[NewsService] Error fetching real news:", error);
    return [];
  }
}

async function createNewsPost(
  userId: string,
  title: string,
  summary: string,
  category: NewsCategory,
  sourceUrl?: string,
  sourceName?: string
): Promise<string | null> {
  try {
    const categoryLabels: Record<NewsCategory, string> = {
      crypto: "CRYPTO",
      tech: "TECH",
      politics: "POLITICS",
      finance: "FINANCE",
      ai: "AI",
    };

    let content = `**${categoryLabels[category]} UPDATE**

${title}

${summary}`;

    if (sourceName) {
      content += `

Source: ${sourceName}`;
    }

    const [post] = await db
      .insert(posts)
      .values({
        userId,
        content,
        sourceUrl: sourceUrl || null,
      })
      .returning();

    return post.id;
  } catch (error) {
    console.error("[NewsService] Error creating news post:", error);
    return null;
  }
}

export async function fetchAndStoreNews(): Promise<number> {
  console.log("[NewsService] Fetching real news...");
  
  const userId = await ensureNewsBotUser();
  const newsItems = await fetchRealNews();
  
  if (newsItems.length === 0) {
    console.log("[NewsService] No new articles to store");
    return 0;
  }
  
  let storedCount = 0;
  
  for (const item of newsItems) {
    try {
      // Check if article with same title already exists
      const [existing] = await db
        .select()
        .from(newsArticles)
        .where(eq(newsArticles.title, item.title));
      
      if (existing) continue;

      await db.insert(newsArticles).values({
        title: item.title,
        summary: item.summary,
        category: item.category,
        sourceUrl: item.sourceUrl,
      });
      
      storedCount++;
    } catch (error) {
      console.error("[NewsService] Error storing news article:", error);
    }
  }
  
  console.log(`[NewsService] Stored ${storedCount} new real articles`);
  return storedCount;
}

export async function postPendingNews(): Promise<number> {
  const userId = await ensureNewsBotUser();
  
  const pendingArticles = await db
    .select()
    .from(newsArticles)
    .where(isNull(newsArticles.postedAt))
    .orderBy(desc(newsArticles.fetchedAt))
    .limit(3);
  
  let postedCount = 0;
  
  for (const article of pendingArticles) {
    const postId = await createNewsPost(
      userId,
      article.title,
      article.summary,
      article.category as NewsCategory,
      article.sourceUrl || undefined,
      article.sourceUrl ? new URL(article.sourceUrl).hostname.replace('www.', '') : undefined
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
  
  // Initial fetch and post
  fetchAndStoreNews().then(() => {
    postPendingNews();
  });
  
  // Fetch new articles every 2 hours
  newsInterval = setInterval(() => {
    fetchAndStoreNews();
  }, 2 * 60 * 60 * 1000);
  
  // Post pending articles every 30 minutes
  postInterval = setInterval(() => {
    postPendingNews();
  }, 30 * 60 * 1000);
  
  console.log("[NewsService] News service started - fetching real news every 2 hours, posting every 30 minutes");
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
