import { db } from "./db";
import { posts, users, profiles } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";

// NewsVibe - Compiled summaries from top crypto and finance sources
const NEWS_SOURCES = [
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss", category: "crypto" },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "crypto" },
  { name: "CryptoSlate", url: "https://cryptoslate.com/feed/", category: "crypto" },
  { name: "Reuters Business", url: "https://news.google.com/rss/search?q=reuters+cryptocurrency+OR+bitcoin+OR+blockchain&hl=en-US&gl=US&ceid=US:en", category: "politics" },
  { name: "Bloomberg Crypto", url: "https://news.google.com/rss/search?q=bloomberg+crypto+OR+bitcoin&hl=en-US&gl=US&ceid=US:en", category: "finance" },
] as const;

type NewsCategory = "crypto" | "finance" | "politics" | "analysis";

let NEWS_BOT_USER_ID: string | null = null;

interface RSSNewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: NewsCategory;
  description?: string;
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

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchRSSFeed(source: { name: string; url: string; category: string }): Promise<RSSNewsItem[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsVibeBot/1.0)",
      },
    });
    
    if (!response.ok) {
      console.error(`[NewsVibe] RSS fetch failed for ${source.name}:`, response.status);
      return [];
    }
    
    const xmlText = await response.text();
    const items: RSSNewsItem[] = [];
    
    // Parse RSS items
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];
    
    for (const itemXml of itemMatches.slice(0, 10)) {
      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
      
      if (titleMatch && linkMatch) {
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
        
        // Only include articles from last 24 hours
        if (isWithin24Hours(pubDate)) {
          items.push({
            title: decodeHTMLEntities(titleMatch[1].trim()),
            link: linkMatch[1].trim(),
            pubDate,
            source: source.name,
            category: source.category as NewsCategory,
            description: descMatch ? decodeHTMLEntities(descMatch[1].trim()).slice(0, 200) : undefined,
          });
        }
      }
    }
    
    console.log(`[NewsVibe] Fetched ${items.length} items from ${source.name}`);
    return items;
  } catch (error) {
    console.error(`[NewsVibe] Error fetching ${source.name}:`, error);
    return [];
  }
}

async function fetchAllNews(): Promise<RSSNewsItem[]> {
  const allNews: RSSNewsItem[] = [];
  
  for (const source of NEWS_SOURCES) {
    const news = await fetchRSSFeed(source);
    allNews.push(...news);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Remove duplicates based on title similarity
  const seen = new Set<string>();
  return allNews.filter(item => {
    const key = item.title.toLowerCase().substring(0, 40);
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

  // Group by source
  const groupedNews: Record<string, RSSNewsItem[]> = {};
  for (const item of newsItems) {
    if (!groupedNews[item.source]) {
      groupedNews[item.source] = [];
    }
    groupedNews[item.source].push(item);
  }

  const newsListText = Object.entries(groupedNews)
    .map(([source, items]) => {
      const topItems = items.slice(0, 4);
      return `\n${source}:\n${topItems.map(i => `- ${i.title}`).join("\n")}`;
    })
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are NewsVibe, a professional crypto and finance news curator. Create a concise, engaging daily summary.

IMPORTANT RULES:
- DO NOT use hashtags (no # symbols)
- DO NOT use markdown headers (no # or ## at start of lines)
- Use **bold text** for section titles and emphasis
- Group news by theme: MARKET MOVES, REGULATORY NEWS, INSTITUTIONAL ADOPTION, ANALYSIS & TRENDS
- Keep each section to 2-3 key stories with brief context
- Include specific numbers, names, and facts when available
- Skip vague or clickbait headlines
- Total length: 400-600 words
- End with a brief market outlook or key takeaway`
        },
        {
          role: "user",
          content: `Create a daily crypto & finance news summary for ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} from these sources:\n${newsListText}\n\nFormat section titles as **SECTION NAME** in bold. Use bullet points. No emojis, no hashtags.`
        }
      ],
      max_tokens: 1200,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("[NewsVibe] AI summarization failed:", error instanceof Error ? error.message : error);
    
    // Fallback: create simple summary without AI
    let fallbackSummary = `**Daily Crypto & Finance Roundup**\n\n`;
    
    for (const [source, items] of Object.entries(groupedNews)) {
      if (items.length > 0) {
        fallbackSummary += `**${source}**\n`;
        for (const item of items.slice(0, 3)) {
          fallbackSummary += `- ${item.title}\n`;
        }
        fallbackSummary += "\n";
      }
    }
    
    return fallbackSummary;
  }
}

async function ensureNewsBotExists(): Promise<string> {
  if (NEWS_BOT_USER_ID) {
    return NEWS_BOT_USER_ID;
  }

  // Check if NewsVibe bot exists
  const [existingBot] = await db
    .select()
    .from(users)
    .where(eq(users.email, "newsvibe@vibes.app"));

  if (existingBot) {
    NEWS_BOT_USER_ID = existingBot.id;
    return existingBot.id;
  }

  // Create NewsVibe bot user
  const [newBot] = await db
    .insert(users)
    .values({
      email: "newsvibe@vibes.app",
      firstName: "News",
      lastName: "Vibe",
    })
    .returning();

  // Create profile for bot
  await db.insert(profiles).values({
    userId: newBot.id,
    username: "newsvibe",
    bio: "Your daily crypto & finance news digest. Compiled from Cointelegraph, CoinDesk, CryptoSlate, Reuters & Bloomberg.",
    isNewsBot: true,
    isStaff: true,
  });

  NEWS_BOT_USER_ID = newBot.id;
  console.log("[NewsVibe] Created NewsVibe bot account:", newBot.id);
  return newBot.id;
}

async function hasPostedToday(botId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const recentPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, botId))
    .orderBy(desc(posts.createdAt))
    .limit(1);
  
  if (recentPosts.length === 0) return false;
  
  const createdAt = recentPosts[0].createdAt;
  if (!createdAt) return false;
  
  const lastPostDate = new Date(createdAt);
  lastPostDate.setHours(0, 0, 0, 0);
  
  return lastPostDate.getTime() === today.getTime();
}

function generateTimeHeader(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  };
  
  return `**NewsVibe Daily Digest**\nCovering **${formatTime(yesterday)}** to **${formatTime(now)}**\nSources: Cointelegraph, CoinDesk, CryptoSlate, Reuters, Bloomberg\n\n---\n\n`;
}

async function createDailySummaryPost(botId: string, content: string): Promise<string | null> {
  try {
    const header = generateTimeHeader();
    const fullContent = header + content;
    
    const [post] = await db
      .insert(posts)
      .values({
        userId: botId,
        content: fullContent,
      })
      .returning();

    console.log("[NewsVibe] Created daily digest:", post.id);
    return post.id;
  } catch (error) {
    console.error("[NewsVibe] Error creating post:", error);
    return null;
  }
}

export async function generateDailyNewsSummary(): Promise<boolean> {
  console.log("[NewsVibe] Checking if daily digest needed...");
  
  const botId = await ensureNewsBotExists();
  
  if (await hasPostedToday(botId)) {
    console.log("[NewsVibe] Already posted today, skipping");
    return false;
  }
  
  console.log("[NewsVibe] Fetching news from sources...");
  const newsItems = await fetchAllNews();
  
  if (newsItems.length === 0) {
    console.log("[NewsVibe] No news items found");
    return false;
  }
  
  console.log(`[NewsVibe] Found ${newsItems.length} news items from last 24 hours`);
  
  console.log("[NewsVibe] Generating AI summary...");
  const summary = await summarizeNewsWithAI(newsItems);
  
  if (!summary) {
    console.log("[NewsVibe] Failed to generate summary");
    return false;
  }
  
  const postId = await createDailySummaryPost(botId, summary);
  return postId !== null;
}

let dailyCheckInterval: NodeJS.Timeout | null = null;

export function startNewsService() {
  console.log("[NewsVibe] Starting daily digest service...");
  
  // Generate on startup if needed
  generateDailyNewsSummary().then(posted => {
    if (posted) {
      console.log("[NewsVibe] Initial daily digest posted");
    }
  });
  
  // Check every 5 minutes, post at 8 AM
  dailyCheckInterval = setInterval(() => {
    const now = new Date();
    if (now.getHours() === 8 && now.getMinutes() < 5) {
      generateDailyNewsSummary();
    }
  }, 5 * 60 * 1000);
  
  console.log("[NewsVibe] Daily digest service started - posts at 8 AM");
}

export function stopNewsService() {
  if (dailyCheckInterval) {
    clearInterval(dailyCheckInterval);
    dailyCheckInterval = null;
  }
  console.log("[NewsVibe] Service stopped");
}

export async function forceGenerateNewsSummary(): Promise<boolean> {
  console.log("[NewsVibe] Force generating daily digest...");
  
  const botId = await ensureNewsBotExists();
  
  // Delete existing posts from bot
  await db.delete(posts).where(eq(posts.userId, botId));
  
  const newsItems = await fetchAllNews();
  
  if (newsItems.length === 0) {
    console.log("[NewsVibe] No news items found");
    return false;
  }
  
  console.log(`[NewsVibe] Found ${newsItems.length} news items`);
  
  const summary = await summarizeNewsWithAI(newsItems);
  
  if (!summary) {
    return false;
  }
  
  const postId = await createDailySummaryPost(botId, summary);
  return postId !== null;
}
