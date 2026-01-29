import { db } from "./db";
import { posts, users, profiles } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";

const NEWS_CATEGORIES = ["crypto", "tech", "politics", "finance", "ai"] as const;
type NewsCategory = typeof NEWS_CATEGORIES[number];

const NEWS_BOT_USER_ID = "6df3ace0-03f7-4987-9a43-8078f4d1487f";

interface RSSNewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: NewsCategory;
}

function isWithin24Hours(pubDate: string): boolean {
  try {
    const articleDate = new Date(pubDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  } catch {
    return false;
  }
}

function categorizeBySearchTerm(searchTerm: string): NewsCategory {
  const term = searchTerm.toLowerCase();
  if (term.includes("crypto") || term.includes("bitcoin") || term.includes("blockchain")) return "crypto";
  if (term.includes("ai") || term.includes("artificial intelligence") || term.includes("machine learning")) return "ai";
  if (term.includes("politics") || term.includes("election") || term.includes("government")) return "politics";
  if (term.includes("finance") || term.includes("stock") || term.includes("economy") || term.includes("market")) return "finance";
  return "tech";
}

function parseRSSDate(dateString: string): Date {
  return new Date(dateString);
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<[^>]*>/g, "");
}

async function fetchGoogleNewsRSS(query: string, category: NewsCategory): Promise<RSSNewsItem[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
    
    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VibesNewsBot/1.0)",
      },
    });
    
    if (!response.ok) {
      console.error(`[NewsService] RSS fetch failed for ${query}:`, response.status);
      return [];
    }
    
    const xmlText = await response.text();
    const items: RSSNewsItem[] = [];
    
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];
    
    for (const itemXml of itemMatches.slice(0, 10)) {
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      
      if (titleMatch && linkMatch && pubDateMatch) {
        const pubDate = pubDateMatch[1].trim();
        
        if (isWithin24Hours(pubDate)) {
          items.push({
            title: decodeHTMLEntities(titleMatch[1].trim()),
            link: linkMatch[1].trim(),
            pubDate,
            source: sourceMatch ? decodeHTMLEntities(sourceMatch[1].trim()) : "Unknown",
            category,
          });
        }
      }
    }
    
    return items;
  } catch (error) {
    console.error(`[NewsService] Error fetching RSS for ${query}:`, error);
    return [];
  }
}

async function fetchAllCategoryNews(): Promise<RSSNewsItem[]> {
  const searchQueries: { query: string; category: NewsCategory }[] = [
    { query: "cryptocurrency bitcoin blockchain", category: "crypto" },
    { query: "artificial intelligence AI machine learning", category: "ai" },
    { query: "technology startup innovation", category: "tech" },
    { query: "stock market finance economy", category: "finance" },
    { query: "US politics government election", category: "politics" },
  ];
  
  const allNews: RSSNewsItem[] = [];
  
  for (const { query, category } of searchQueries) {
    const news = await fetchGoogleNewsRSS(query, category);
    allNews.push(...news);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const seen = new Set<string>();
  return allNews.filter(item => {
    const key = item.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function summarizeNewsWithAI(newsItems: RSSNewsItem[]): Promise<string> {
  if (newsItems.length === 0) {
    return "";
  }

  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  const groupedNews: Record<NewsCategory, RSSNewsItem[]> = {
    crypto: [],
    ai: [],
    tech: [],
    finance: [],
    politics: [],
  };

  for (const item of newsItems) {
    groupedNews[item.category].push(item);
  }

  const newsListText = NEWS_CATEGORIES.map(cat => {
    const items = groupedNews[cat].slice(0, 5);
    if (items.length === 0) return "";
    return `\n${cat.toUpperCase()}:\n${items.map(i => `- ${i.title} (${i.source})`).join("\n")}`;
  }).filter(Boolean).join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional news curator for Vibes, a social platform for tech-savvy developers. Write a concise, engaging daily news summary. Format the summary with clear category sections. Use markdown formatting. Keep each category to 2-3 key headlines with brief context. Make it informative but easy to scan. Total length should be 400-600 words.`
        },
        {
          role: "user",
          content: `Create a daily news summary for today (${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}) from these headlines:\n${newsListText}\n\nFormat with clear section headers for each category (use the category name in caps) and bullet points for headlines. End with a brief takeaway or trend observation. Do not use emoji icons.`
        }
      ],
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("[NewsService] AI summarization failed:", error instanceof Error ? error.message : error);
    
    let fallbackSummary = `**Daily News Roundup** - ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
    
    for (const cat of NEWS_CATEGORIES) {
      const items = groupedNews[cat].slice(0, 3);
      if (items.length > 0) {
        const emoji = cat === "crypto" ? "₿" : cat === "ai" ? "🤖" : cat === "tech" ? "💻" : cat === "finance" ? "📈" : "🏛";
        fallbackSummary += `**${emoji} ${cat.toUpperCase()}**\n`;
        for (const item of items) {
          fallbackSummary += `• ${item.title}\n`;
        }
        fallbackSummary += "\n";
      }
    }
    
    return fallbackSummary;
  }
}

async function hasPostedToday(): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const recentPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, NEWS_BOT_USER_ID))
    .orderBy(desc(posts.createdAt))
    .limit(1);
  
  if (recentPosts.length === 0) return false;
  
  const createdAt = recentPosts[0].createdAt;
  if (!createdAt) return false;
  
  const lastPostDate = new Date(createdAt);
  lastPostDate.setHours(0, 0, 0, 0);
  
  return lastPostDate.getTime() === today.getTime();
}

async function createDailySummaryPost(content: string): Promise<string | null> {
  try {
    const [post] = await db
      .insert(posts)
      .values({
        userId: NEWS_BOT_USER_ID,
        content,
      })
      .returning();

    console.log("[NewsService] Created daily summary post:", post.id);
    return post.id;
  } catch (error) {
    console.error("[NewsService] Error creating daily summary post:", error);
    return null;
  }
}

export async function generateDailyNewsSummary(): Promise<boolean> {
  console.log("[NewsService] Checking if daily summary needed...");
  
  if (await hasPostedToday()) {
    console.log("[NewsService] Already posted today, skipping");
    return false;
  }
  
  console.log("[NewsService] Fetching news from Google News RSS...");
  const newsItems = await fetchAllCategoryNews();
  
  if (newsItems.length === 0) {
    console.log("[NewsService] No news items found");
    return false;
  }
  
  console.log(`[NewsService] Found ${newsItems.length} news items from last 24 hours`);
  
  console.log("[NewsService] Generating AI summary...");
  const summary = await summarizeNewsWithAI(newsItems);
  
  if (!summary) {
    console.log("[NewsService] Failed to generate summary");
    return false;
  }
  
  const postId = await createDailySummaryPost(summary);
  return postId !== null;
}

let dailyCheckInterval: NodeJS.Timeout | null = null;

export function startNewsService() {
  console.log("[NewsService] Starting daily news summary service...");
  
  generateDailyNewsSummary().then(posted => {
    if (posted) {
      console.log("[NewsService] Initial daily summary posted successfully");
    }
  });
  
  dailyCheckInterval = setInterval(() => {
    const now = new Date();
    if (now.getHours() === 8 && now.getMinutes() < 5) {
      generateDailyNewsSummary();
    }
  }, 5 * 60 * 1000);
  
  console.log("[NewsService] Daily news service started - checks at 8 AM");
}

export function stopNewsService() {
  if (dailyCheckInterval) {
    clearInterval(dailyCheckInterval);
    dailyCheckInterval = null;
  }
  console.log("[NewsService] News service stopped");
}

export async function forceGenerateNewsSummary(): Promise<boolean> {
  console.log("[NewsService] Force generating daily summary...");
  
  await db.delete(posts).where(eq(posts.userId, NEWS_BOT_USER_ID));
  
  const newsItems = await fetchAllCategoryNews();
  
  if (newsItems.length === 0) {
    console.log("[NewsService] No news items found");
    return false;
  }
  
  console.log(`[NewsService] Found ${newsItems.length} news items`);
  
  const summary = await summarizeNewsWithAI(newsItems);
  
  if (!summary) {
    return false;
  }
  
  const postId = await createDailySummaryPost(summary);
  return postId !== null;
}
