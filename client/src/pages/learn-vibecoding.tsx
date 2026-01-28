import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GraduationCap,
  BookOpen,
  Play,
  CheckCircle,
  Lock,
  Award,
  Trophy,
  Sparkles,
  ChevronRight,
  User as UserIcon,
  Clock,
  Star,
  X,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: string;
  content: string;
}

const VIBECODING_SYLLABUS = [
  {
    id: "module-1",
    title: "Introduction to Vibecoding",
    description: "Understanding what vibecoding is and why it's revolutionizing software development",
    lessons: [
      { 
        id: "1-1", 
        title: "What is Vibecoding?", 
        duration: "5 min read", 
        type: "article",
        content: `Vibecoding is a term coined by AI researcher Andrej Karpathy (OpenAI co-founder, former Tesla AI director) in February 2025. It describes a radical new approach to software development where you describe what you want in natural language, and AI tools generate, refine, and debug the code for you.

**Key Characteristics:**
• Natural language prompts replace manual line-by-line coding
• You focus on describing WHAT you want, not HOW to implement it
• AI handles the syntax, boilerplate, and technical details
• Iterative refinement through conversation with AI

As Karpathy describes it: "Fully give in to the vibes, embrace exponentials, and forget that the code even exists."

**Important distinction:** Vibecoding is best suited for rapid prototyping, personal tools, and experimental projects. Production systems still require careful review and engineering discipline.`
      },
      { 
        id: "1-2", 
        title: "The History and Rise of AI-Assisted Development", 
        duration: "8 min read", 
        type: "article",
        content: `The journey to vibecoding began with simple code completion tools and evolved into sophisticated AI assistants:

**2021-2022: GitHub Copilot Era**
GitHub Copilot launched, offering AI-powered code suggestions. Developers could accept line-by-line completions, but still wrote most code manually.

**2023: ChatGPT Changes Everything**
Large Language Models became publicly accessible. Developers started copying code between ChatGPT and their editors.

**2024: Integrated AI IDEs**
Tools like Cursor and Windsurf emerged, integrating AI directly into the development environment with multi-file context awareness.

**2025: The Vibecoding Revolution**
By 2025, 25% of Y Combinator startups have codebases that are 95% AI-generated. Tools like Replit Agent, Claude, and others enable building complete applications through conversation.

**Key Insight:** The hottest programming language is now English (or any natural language). Your ability to clearly describe what you want matters more than memorizing syntax.`
      },
      { 
        id: "1-3", 
        title: "Vibecoding vs Traditional Coding", 
        duration: "6 min read", 
        type: "article",
        content: `Understanding when to use each approach is crucial for becoming an effective developer.

**Traditional Coding:**
• You write every line of code manually
• Deep understanding of syntax and language features required
• Full control over implementation details
• Better for: mission-critical systems, security-sensitive code, performance-optimized applications

**Vibecoding:**
• You describe intent; AI generates code
• Focus on problem-solving and requirements
• Faster iteration and prototyping
• Better for: MVPs, personal projects, learning new frameworks, rapid experimentation

**The 40/20/40 Rule for Vibecoding:**
• 40% of time: Planning and writing detailed prompts
• 20% of time: Waiting for AI to generate code
• 40% of time: Reviewing, testing, and refining output

**Critical Mindset Shift:** You become an architect and reviewer rather than a typist. Your value is in understanding requirements, spotting issues, and guiding the AI toward the right solution.`
      },
      { 
        id: "1-4", 
        title: "Setting Up Your Vibecoding Environment", 
        duration: "10 min read", 
        type: "hands-on",
        content: `Let's set up a productive vibecoding environment. You'll need:

**Essential Tools:**

1. **Replit** (Beginner-Friendly)
   - Browser-based, no installation needed
   - Built-in AI assistant (Replit Agent)
   - Instant deployment

2. **Cursor** (Power Users)
   - AI-native IDE built on VS Code
   - Multi-file context awareness
   - Composer mode for complex changes

3. **Claude or ChatGPT** (Conversational)
   - Great for planning and problem-solving
   - Copy-paste workflow to your editor

**Best Practices for Setup:**
• Keep your project structure clean and organized
• Use descriptive file and variable names (helps AI understand context)
• Write a README.md explaining your project (AI can reference this)
• Use version control (Git) to track AI-generated changes

**Your First Exercise:**
Open Replit and ask the AI to "Create a simple to-do list app with the ability to add, complete, and delete tasks." Watch how it generates the complete application.`
      },
    ],
    quizCount: 5,
  },
  {
    id: "module-2",
    title: "Prompt Engineering for Developers",
    description: "Master the art of communicating effectively with AI coding assistants",
    lessons: [
      { 
        id: "2-1", 
        title: "The Anatomy of a Good Prompt", 
        duration: "7 min read", 
        type: "article",
        content: `Great prompts lead to great code. Here's how to write them:

**Structure of an Effective Prompt:**

1. **Context** - What's the project about?
   "I'm building a Node.js REST API for a bookstore..."

2. **Tech Stack** - What technologies are you using?
   "...using Express, TypeScript, and PostgreSQL..."

3. **Requirements** - What specifically do you need?
   "...I need an endpoint that searches books by author name..."

4. **Constraints** - Any specific rules to follow?
   "...use parameterized queries to prevent SQL injection..."

5. **Examples** - Show what you expect
   "...GET /books?author=King should return all Stephen King books"

**Bad Prompt:**
"Make a book search"

**Good Prompt:**
"Create a GET /api/books/search endpoint in Express with TypeScript that accepts a 'query' parameter, searches the books table for matches in title or author fields, and returns results sorted by relevance. Include error handling for empty queries."

**Pro Tip:** Be verbose. More context = better results. AI can ignore irrelevant details but can't guess missing requirements.`
      },
      { 
        id: "2-2", 
        title: "Working with Claude, GPT, and Replit AI", 
        duration: "10 min read", 
        type: "article",
        content: `Different AI models have different strengths. Learn when to use each:

**Claude (Anthropic)**
• Strengths: Complex reasoning, long context, following instructions precisely
• Best for: Architecture decisions, code review, detailed explanations
• Tip: Claude excels at understanding nuanced requirements

**GPT-4 (OpenAI)**
• Strengths: Broad knowledge, creative solutions, conversational flow
• Best for: Brainstorming, exploring options, general coding
• Tip: Good at suggesting alternatives you hadn't considered

**Replit AI / Agent**
• Strengths: Integrated with your workspace, knows your project structure
• Best for: Direct implementation, file management, deployment
• Tip: Can make changes across multiple files automatically

**Model Selection Strategy:**
1. Use Replit Agent for implementation when working in Replit
2. Use Claude for complex planning and architecture
3. Use GPT for brainstorming and exploring options
4. Try the same prompt on multiple models for important decisions

**Important:** AI models update frequently. Stay flexible and test different models as they evolve.`
      },
      { 
        id: "2-3", 
        title: "Iterative Prompting Techniques", 
        duration: "12 min read", 
        type: "article",
        content: `Vibecoding is never "one prompt and done." Master the art of iteration:

**The Iteration Loop:**
1. Write initial prompt
2. Review generated code
3. Identify what's wrong or missing
4. Refine with specific feedback
5. Repeat until satisfied

**Feedback Techniques:**

**Addition:** "This works. Now also add email validation to the signup form."

**Correction:** "The function is checking for null but should also check for empty strings."

**Refinement:** "Make the error messages more user-friendly and specific."

**Simplification:** "This is too complex. Can you simplify it using a map instead of nested loops?"

**Chain-of-Thought Prompting:**
Ask AI to think through problems step by step:
"First analyze what this function should do, then identify potential edge cases, then implement the solution."

**Few-Shot Examples:**
Show the AI your preferred style:
"Here's how I write components:
\`\`\`jsx
function Button({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>;
}
\`\`\`
Now create a Card component in the same style."`
      },
      { 
        id: "2-4", 
        title: "Debugging with AI Assistance", 
        duration: "8 min read", 
        type: "hands-on",
        content: `When things go wrong (and they will), here's how to debug with AI:

**The Copy-Paste Debug Method:**
1. Copy the full error message
2. Paste it to the AI with context
3. Ask: "I'm getting this error. Here's my code: [paste code]. What's wrong?"

**Effective Bug Reports to AI:**
• Include the exact error message
• Show the relevant code
• Explain what you expected vs. what happened
• Mention what you've already tried

**Example Debug Prompt:**
"I'm getting 'Cannot read property map of undefined' at line 15. Here's my component:
[paste code]
The data should come from an API call. What's causing this and how do I fix it?"

**When AI Can't Fix It:**
Sometimes the AI gets stuck in a loop. Try:
1. Ask for a completely different approach
2. Simplify the problem and rebuild
3. Ask the AI to explain the code first before fixing
4. Break the problem into smaller parts

**Practice Exercise:**
Intentionally introduce a bug in your code (like a typo in a variable name), then practice describing it to AI and getting a fix.`
      },
      { 
        id: "2-5", 
        title: "Code Generation Best Practices", 
        duration: "10 min read", 
        type: "hands-on",
        content: `Generate better code by following these proven practices:

**Before Generating:**
• Write a clear specification (even a few bullet points)
• Decide on naming conventions upfront
• Know your tech stack and tell the AI

**During Generation:**
• Start with core functionality, add features incrementally
• Ask for one thing at a time for complex features
• Request comments or documentation if the code is complex

**After Generation - The Review Checklist:**
□ Does the code do what I asked?
□ Are there obvious bugs or edge cases missed?
□ Is error handling present?
□ Are there security concerns (exposed keys, SQL injection)?
□ Is the code readable and maintainable?
□ Does it follow the project's existing patterns?

**Security Review Points:**
• Never accept code that exposes API keys or secrets
• Check for input validation on user data
• Look for proper authentication/authorization checks
• Ensure database queries are parameterized

**The Golden Rule:** You are responsible for code you ship, even if AI wrote it. Always review before using in production.`
      },
    ],
    quizCount: 5,
  },
  {
    id: "module-3",
    title: "The Vibecoding Workflow",
    description: "Learn the complete workflow from idea to deployed application",
    lessons: [
      { 
        id: "3-1", 
        title: "Planning Projects with AI", 
        duration: "8 min read", 
        type: "article",
        content: `Before writing any code, use AI to plan your project:

**Creating a Project Requirements Document (PRD):**
Ask AI: "Help me create a PRD for [your idea]. Include: core features, user stories, technical requirements, and success metrics."

**Example Prompt:**
"I want to build a habit tracking app. Help me plan:
1. What are the essential features for an MVP?
2. What data do I need to store?
3. What screens/pages do I need?
4. What API endpoints will I need?"

**Breaking Down Features:**
Never ask for "an e-commerce site." Instead, break it down:
• User authentication
• Product catalog
• Shopping cart
• Checkout flow
• Order history
• Admin dashboard

**Technical Decision Making:**
Ask AI to help with decisions:
"For a habit tracker with 1000 users, should I use SQL or NoSQL? What are the trade-offs?"

**Creating Your Project Roadmap:**
1. MVP (Week 1): Core functionality only
2. Version 1.1: Nice-to-have features
3. Future: Advanced features and scaling

**Pro Tip:** Keep your PRD in a markdown file in your project. AI assistants can reference it for context.`
      },
      { 
        id: "3-2", 
        title: "Rapid Prototyping Techniques", 
        duration: "12 min read", 
        type: "hands-on",
        content: `Build working prototypes in hours, not weeks:

**The Speed Prototyping Method:**

**Step 1: One-Shot MVP (30 minutes)**
Start with a comprehensive prompt that describes your entire app. Let AI generate the initial structure.

Example: "Create a simple expense tracker with React that lets users add expenses with category, amount, and date. Show a list of expenses and total spending. Store data in local storage."

**Step 2: Iterate on Core Features (1-2 hours)**
Focus on the most important user journey. Ignore edge cases initially.

**Step 3: Add Polish (1 hour)**
• Error handling
• Loading states
• Better UI/UX
• Basic validation

**Prototyping Rules:**
• Perfection is the enemy of progress
• Use placeholder data initially
• Skip authentication for prototypes
• Focus on the core value proposition

**Tools for Speed:**
• Replit for instant deployment
• Tailwind CSS for fast styling
• shadcn/ui for pre-built components

**Exercise:**
Set a timer for 1 hour. Build a working prototype of a simple app (recipe saver, note-taking app, or countdown timer). Focus on getting something working, not perfect.`
      },
      { 
        id: "3-3", 
        title: "Version Control for AI-Generated Code", 
        duration: "7 min read", 
        type: "article",
        content: `Track your changes and maintain sanity with proper version control:

**Why Version Control Matters More with AI:**
• AI generates lots of code quickly - easy to lose track
• You can roll back if AI breaks something
• Commit history documents what changed and why

**Git Workflow for Vibecoders:**

1. **Commit Before AI Changes**
   Before asking AI for big changes, commit your current state.
   \`git add . && git commit -m "Working state before refactor"\`

2. **Commit After Each Feature**
   \`git commit -m "Add user authentication via AI"\`

3. **Meaningful Commit Messages**
   Include what AI was asked to do:
   \`git commit -m "Implement search feature - AI-generated with manual review"\`

**When Things Go Wrong:**
• \`git diff\` - See what AI changed
• \`git checkout .\` - Discard AI changes and try again
• \`git reset HEAD~1\` - Undo last commit

**Branch Strategy:**
• \`main\` - Stable, working code
• \`feature/xyz\` - AI experiments and new features
• Merge to main only after testing

**Pro Tip:** Replit automatically creates checkpoints. Use them to roll back if needed.`
      },
      { 
        id: "3-4", 
        title: "Testing AI-Generated Code", 
        duration: "9 min read", 
        type: "hands-on",
        content: `Trust but verify - testing is essential with AI-generated code:

**Why Testing AI Code is Critical:**
• AI doesn't understand your business logic
• Edge cases are frequently missed
• Security vulnerabilities may be hidden

**Manual Testing Checklist:**
□ Happy path - does the main feature work?
□ Empty states - what happens with no data?
□ Error states - what happens when things fail?
□ Edge cases - unusual inputs, boundary values
□ Mobile/responsive - does layout work on small screens?

**Ask AI to Write Tests:**
"Write Jest tests for this function that cover:
1. Normal input
2. Empty input
3. Invalid input
4. Edge cases"

**What to Test:**
• API endpoints - correct responses and error codes
• User inputs - validation works properly
• Database operations - data saves and retrieves correctly
• Authentication - protected routes are actually protected

**Quick Testing Strategy:**
For prototypes, focus on:
1. Does the main feature work?
2. Does it handle errors gracefully?
3. Does it not crash on unexpected input?

**Exercise:**
Take a function AI generated for you. Try to break it with edge cases. Then ask AI to handle those cases.`
      },
      { 
        id: "3-5", 
        title: "Iterative Development and Refinement", 
        duration: "10 min read", 
        type: "article",
        content: `Master the cycle of continuous improvement:

**The Build-Measure-Learn Loop:**
1. **Build** - Generate code with AI
2. **Measure** - Test and gather feedback
3. **Learn** - Identify what needs improvement
4. Repeat

**Refinement Strategies:**

**Incremental Improvement:**
Instead of: "Make it better"
Try: "The login form works, but add: email format validation, password strength indicator, and a loading spinner during submission."

**Feature Stacking:**
Build on working code:
1. "Create a basic todo list" ✓
2. "Add due dates to tasks" ✓
3. "Add priority levels (high, medium, low)" ✓
4. "Add filtering by priority and due date" ✓

**Refactoring with AI:**
"This code works but is messy. Refactor it to:
- Split into smaller functions
- Add error handling
- Improve variable names
- Add comments"

**When to Stop Iterating:**
• Core features work reliably
• Edge cases are handled
• Code is readable and maintainable
• Users can accomplish their goals

**Remember:** Shipping something that works is better than perfecting something forever.`
      },
    ],
    quizCount: 5,
  },
  {
    id: "module-4",
    title: "Building Real Projects",
    description: "Apply vibecoding to build complete, production-ready applications",
    lessons: [
      { 
        id: "4-1", 
        title: "Project: Build a Personal Portfolio", 
        duration: "25 min", 
        type: "project",
        content: `**Project Goal:** Create a portfolio website to showcase your projects and skills.

**Requirements:**
• Hero section with your name and tagline
• About section with your background
• Projects grid showing your work
• Contact form or contact information
• Responsive design (mobile-friendly)

**Step 1: Initial Prompt**
"Create a modern portfolio website with React and Tailwind CSS. Include: a hero section with my name and title, an about section, a projects grid with cards, and a contact section. Use a clean, professional design."

**Step 2: Customize Content**
Replace placeholder text with your information. Add your actual projects.

**Step 3: Enhance**
• Add animations with Framer Motion
• Make it SEO-friendly with meta tags
• Add a dark mode toggle
• Connect a contact form to email

**Step 4: Deploy**
Use Replit's publish feature to make it live.

**Success Criteria:**
□ Site loads without errors
□ All sections are present and readable
□ Links work correctly
□ Responsive on mobile devices
□ You're proud to share it`
      },
      { 
        id: "4-2", 
        title: "Project: Create a REST API", 
        duration: "30 min", 
        type: "project",
        content: `**Project Goal:** Build a functional REST API for a task management system.

**Requirements:**
• CRUD operations for tasks (Create, Read, Update, Delete)
• Task properties: title, description, status, due date
• Proper HTTP status codes
• Error handling
• Input validation

**Step 1: Setup**
"Create an Express.js REST API with TypeScript for a task manager. Include:
- GET /api/tasks - list all tasks
- GET /api/tasks/:id - get single task
- POST /api/tasks - create task
- PUT /api/tasks/:id - update task
- DELETE /api/tasks/:id - delete task

Use proper error handling and return appropriate status codes."

**Step 2: Add Validation**
"Add Zod validation for the task creation endpoint. Validate that title is required and at least 3 characters."

**Step 3: Connect Database**
"Connect this API to PostgreSQL using Drizzle ORM. Create a tasks table and update the endpoints to use the database."

**Testing Your API:**
Use the browser or tools like curl:
\`curl http://localhost:5000/api/tasks\`

**Success Criteria:**
□ All CRUD endpoints work
□ Proper status codes (200, 201, 404, 500)
□ Validation prevents bad data
□ Data persists in database`
      },
      { 
        id: "4-3", 
        title: "Project: Full-Stack Application", 
        duration: "45 min", 
        type: "project",
        content: `**Project Goal:** Build a complete full-stack application with authentication, database, and deployment.

**We'll Build:** A simple bookmarking app where users can save and organize links.

**Part 1: Database Schema (10 min)**
"Create a Drizzle ORM schema for a bookmarking app with:
- users table (id, email, name, created_at)
- bookmarks table (id, user_id, url, title, description, category, created_at)
- categories table (id, user_id, name, color)"

**Part 2: Backend API (15 min)**
"Create Express routes for:
- User authentication endpoints
- CRUD for bookmarks with user ownership
- List bookmarks with filtering by category"

**Part 3: Frontend (15 min)**
"Create a React frontend with:
- Login/signup forms
- Dashboard showing user's bookmarks as cards
- Form to add new bookmarks
- Category filtering sidebar"

**Part 4: Polish (5 min)**
- Add loading states
- Error handling with toast notifications
- Mobile-responsive layout

**Deployment:**
Click the "Publish" button in Replit to deploy.

**Success Criteria:**
□ Users can sign up and log in
□ Bookmarks save to database
□ Users only see their own bookmarks
□ Filtering works correctly
□ App is deployed and accessible`
      },
      { 
        id: "4-4", 
        title: "Deployment and Going Live", 
        duration: "12 min read", 
        type: "article",
        content: `Take your project from development to production:

**Pre-Deployment Checklist:**
□ Remove console.log statements
□ Ensure environment variables are set
□ Test all critical user flows
□ Check mobile responsiveness
□ Verify error handling works
□ Remove any mock/placeholder data

**Environment Variables:**
Never commit secrets. Use environment variables for:
- API keys
- Database URLs
- Session secrets

In Replit, use the Secrets tab to store sensitive data.

**Deployment with Replit:**
1. Click the "Publish" button
2. Choose your deployment settings
3. Your app is live with a .replit.app domain

**Post-Deployment:**
• Test the live site thoroughly
• Set up a custom domain if desired
• Monitor for errors
• Gather user feedback

**Common Issues:**
• "Works locally but not deployed" - Check environment variables
• "Slow performance" - Optimize images, reduce API calls
• "Errors in production only" - Check logs, add better error tracking

**Congratulations!**
You've vibecoded a complete application from idea to deployment.`
      },
    ],
    quizCount: 5,
  },
  {
    id: "module-5",
    title: "Advanced Vibecoding Techniques",
    description: "Take your skills to the next level with professional strategies",
    lessons: [
      { 
        id: "5-1", 
        title: "The 40/20/40 Rule Deep Dive", 
        duration: "10 min read", 
        type: "article",
        content: `Professional vibecoders follow the 40/20/40 time allocation:

**40% - Preparation & Planning**
This is where most beginners fail. Great output requires great input.

What to prepare:
• Clear project requirements
• Detailed feature specifications
• Technical constraints and preferences
• Examples of what you want (and don't want)
• Context about existing code

**20% - Generation**
The actual AI interaction. This is the smallest portion!

How to maximize:
• Provide all context upfront
• Ask for complete implementations, not fragments
• Use clear, specific language
• Include relevant file contents

**40% - Review & Refinement**
Never skip this. You're responsible for the output.

What to review:
• Does it meet requirements?
• Security vulnerabilities?
• Performance issues?
• Code readability?
• Edge cases handled?

**Time Investment Reality:**
• Beginners: 10/50/40 (too little prep, too much generation)
• Intermediates: 30/30/40
• Experts: 40/20/40

**The Insight:** Investing time upfront saves exponentially more time later. A 15-minute detailed spec saves hours of debugging.`
      },
      { 
        id: "5-2", 
        title: "Multi-File and Complex Projects", 
        duration: "15 min read", 
        type: "hands-on",
        content: `Scale your vibecoding to larger codebases:

**Working with Multiple Files:**
AI assistants can work across files, but need context.

**Strategy 1: Reference Files in Prompts**
"Looking at the User model in shared/schema.ts and the existing API routes in server/routes.ts, add a new endpoint for updating user profiles."

**Strategy 2: Use AI-Native IDEs**
Tools like Cursor and Replit Agent can:
• See your entire project structure
• Make changes across multiple files
• Understand relationships between files

**Strategy 3: Modular Prompts**
Break complex changes into steps:
1. "First, add the new database field"
2. "Now update the API to accept this field"
3. "Finally, add it to the frontend form"

**Managing Context:**
Large projects can exceed AI context limits.
• Keep a README.md with project overview
• Document your architecture decisions
• Use consistent naming conventions
• Organize code logically

**Refactoring Large Codebases:**
"Analyze the structure in the client/src/components folder. Suggest how to reorganize it for better maintainability, then implement the changes."

**Warning:** Always commit before large refactors. AI can make unexpected changes across many files.`
      },
      { 
        id: "5-3", 
        title: "Security and Best Practices", 
        duration: "12 min read", 
        type: "article",
        content: `AI doesn't prioritize security. You must.

**Critical Security Checks:**

**1. Never Expose Secrets**
AI might accidentally include API keys in code.
Always check:
• No hardcoded keys or passwords
• .env files not committed to git
• Sensitive data not logged to console

**2. Input Validation**
AI often skips validation.
Always verify:
• User input is sanitized
• SQL queries are parameterized
• File uploads are restricted

**3. Authentication & Authorization**
Common AI mistakes:
• Missing authentication on protected routes
• No authorization checks (user A accessing user B's data)
• Weak session handling

**Security Checklist Before Deploy:**
□ No secrets in code or logs
□ All inputs validated and sanitized
□ Authentication on protected routes
□ Authorization for user-owned resources
□ HTTPS enabled
□ Error messages don't leak sensitive info

**Automated Security Scanning:**
Ask AI: "Review this code for security vulnerabilities, focusing on SQL injection, XSS, and authentication bypass."

**The Rule:** AI generates code for the happy path. You must think about the adversarial path.`
      },
      { 
        id: "5-4", 
        title: "Maintaining Your Skills", 
        duration: "8 min read", 
        type: "article",
        content: `Don't let AI erode your fundamental skills:

**The Skill Atrophy Risk:**
Over-reliance on AI can lead to:
• Forgetting basic syntax
• Inability to debug without AI
• Losing problem-solving intuition
• Difficulty in technical interviews

**Balanced Practice:**

**Weekly Code-Only Sessions**
Spend 1-2 hours per week coding without AI assistance.
• Solve algorithm challenges
• Build small projects from scratch
• Debug issues manually first

**Understand Before Accepting**
When AI generates code, ask yourself:
• Can I explain what every line does?
• Could I modify this without AI help?
• Do I understand the libraries being used?

**Learn the "Why"**
Ask AI to explain its choices:
"Why did you use useCallback here instead of useMemo?"
"What's the advantage of this database index?"

**Red Flags You're Over-Reliant:**
• Can't write a for loop without checking syntax
• Don't understand code you're deploying
• Panic when AI is unavailable
• Can't explain your own codebase

**The Goal:** AI amplifies your skills, not replaces them. Stay sharp.`
      },
      { 
        id: "5-5", 
        title: "The Future of Vibecoding", 
        duration: "8 min read", 
        type: "article",
        content: `Where is AI-assisted development heading?

**Current State (2025):**
• 25% of YC startups have 95%+ AI-generated code
• AI can build complete applications from prompts
• Voice-to-code becoming practical
• Multi-agent workflows emerging

**Near-Term Trends:**
• Better code understanding and context
• More autonomous debugging
• Tighter IDE integration
• Specialized models for different languages/frameworks

**What Won't Change:**
• Need for human judgment
• Importance of security awareness
• Requirement to understand systems
• Soft skills: communication, problem definition

**Your Competitive Advantage:**
As AI gets better at coding, these skills become MORE valuable:
• Understanding user needs
• System design and architecture
• Security and reliability thinking
• Asking the right questions

**Career Advice:**
Don't fear AI replacing developers. Embrace AI to become 10x more productive. The developers who thrive will be those who:
• Master AI collaboration
• Focus on problems worth solving
• Maintain strong fundamentals
• Continuously adapt

**Final Thought:**
Vibecoding is a tool, not magic. The best vibecoders combine AI's speed with human wisdom. Your creativity, judgment, and understanding of users will always matter.

Congratulations on completing the Vibecoding curriculum!`
      },
    ],
    quizCount: 5,
  },
];

// Quiz questions for each module
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const MODULE_QUIZZES: Record<string, QuizQuestion[]> = {
  "module-1": [
    {
      id: "q1-1",
      question: "Who coined the term 'vibecoding'?",
      options: ["Elon Musk", "Andrej Karpathy", "Sam Altman", "Dario Amodei"],
      correctIndex: 1,
      explanation: "Andrej Karpathy, former OpenAI co-founder and Tesla AI director, coined 'vibecoding' in February 2025."
    },
    {
      id: "q1-2", 
      question: "What is the main characteristic of vibecoding?",
      options: [
        "Writing code manually line by line",
        "Using natural language to describe what you want",
        "Only using Python programming language",
        "Avoiding AI tools completely"
      ],
      correctIndex: 1,
      explanation: "Vibecoding focuses on describing WHAT you want in natural language, letting AI handle the HOW."
    },
    {
      id: "q1-3",
      question: "What type of projects is vibecoding best suited for?",
      options: [
        "Only enterprise applications",
        "Rapid prototyping and personal tools",
        "Operating system kernels",
        "Financial trading systems"
      ],
      correctIndex: 1,
      explanation: "Vibecoding excels at rapid prototyping, personal tools, and experimental projects."
    },
    {
      id: "q1-4",
      question: "Which mindset is essential for vibecoding?",
      options: [
        "Perfectionism from the start",
        "Avoiding AI assistance",
        "Speed and iteration",
        "Manual code optimization"
      ],
      correctIndex: 2,
      explanation: "Vibecoding embraces speed, iteration, and 'good enough' over perfect first attempts."
    },
    {
      id: "q1-5",
      question: "What percentage of code can AI write in vibecoding according to Karpathy?",
      options: ["10%", "50%", "75%", "95%+"],
      correctIndex: 3,
      explanation: "Karpathy describes scenarios where AI writes 95%+ of the code in vibecoding workflows."
    }
  ],
  "module-2": [
    {
      id: "q2-1",
      question: "What is the most important element of a good AI prompt?",
      options: [
        "Using technical jargon",
        "Being specific about what you want",
        "Making it as short as possible",
        "Including emojis"
      ],
      correctIndex: 1,
      explanation: "Specificity is key - the more detail you provide about desired outcomes, the better the results."
    },
    {
      id: "q2-2",
      question: "What should you do when AI gives incorrect output?",
      options: [
        "Give up and write code manually",
        "Iteratively refine your prompt with more context",
        "Use a different programming language",
        "Restart from scratch every time"
      ],
      correctIndex: 1,
      explanation: "Iterative refinement through conversation is core to vibecoding - treat errors as feedback to improve prompts."
    },
    {
      id: "q2-3",
      question: "What does 'zero-shot' prompting mean?",
      options: [
        "Giving no instructions at all",
        "Asking without providing examples",
        "Using camera-based AI",
        "Only one attempt allowed"
      ],
      correctIndex: 1,
      explanation: "Zero-shot prompting means asking AI to complete a task without providing examples of the desired output."
    },
    {
      id: "q2-4",
      question: "What is 'few-shot' prompting?",
      options: [
        "Taking multiple screenshots",
        "Providing examples in your prompt",
        "Using minimal words",
        "Quick coding sessions"
      ],
      correctIndex: 1,
      explanation: "Few-shot prompting involves giving the AI examples of the desired input-output pattern."
    },
    {
      id: "q2-5",
      question: "Which technique helps AI understand the format you want?",
      options: [
        "Writing in all caps",
        "Providing a template or example",
        "Using complex vocabulary",
        "Repeating the same question"
      ],
      correctIndex: 1,
      explanation: "Providing templates or examples helps AI understand exactly the format and style you expect."
    }
  ],
  "module-3": [
    {
      id: "q3-1",
      question: "What is the recommended first step in a vibecoding workflow?",
      options: [
        "Start coding immediately",
        "Describe the overall goal and architecture",
        "Set up the database",
        "Deploy to production"
      ],
      correctIndex: 1,
      explanation: "Starting with a clear description of your goal helps AI understand context for all subsequent requests."
    },
    {
      id: "q3-2",
      question: "How should you handle complex features in vibecoding?",
      options: [
        "Build everything in one prompt",
        "Break into smaller, incremental steps",
        "Avoid complex features entirely",
        "Write them manually"
      ],
      correctIndex: 1,
      explanation: "Breaking complex features into smaller steps allows for better AI understanding and easier debugging."
    },
    {
      id: "q3-3",
      question: "What should you do before asking AI to modify existing code?",
      options: [
        "Delete the existing code",
        "Provide context about the current codebase",
        "Ignore the existing code",
        "Start a new project"
      ],
      correctIndex: 1,
      explanation: "Giving AI context about existing code structure helps it make compatible modifications."
    },
    {
      id: "q3-4",
      question: "What is 'context management' in vibecoding?",
      options: [
        "Managing file permissions",
        "Keeping AI aware of relevant project information",
        "Organizing your desktop",
        "Scheduling work time"
      ],
      correctIndex: 1,
      explanation: "Context management means ensuring AI has all the relevant information about your project structure and goals."
    },
    {
      id: "q3-5",
      question: "When should you commit code in a vibecoding workflow?",
      options: [
        "Only at the end of the project",
        "After each working milestone",
        "Never - version control is obsolete",
        "Only when deploying"
      ],
      correctIndex: 1,
      explanation: "Frequent commits after working milestones let you easily rollback if AI introduces issues."
    }
  ],
  "module-4": [
    {
      id: "q4-1",
      question: "What makes a good project for vibecoding practice?",
      options: [
        "Something you'd actually use",
        "Only enterprise apps",
        "Theoretical exercises",
        "Copying existing apps exactly"
      ],
      correctIndex: 0,
      explanation: "Building something you'll actually use keeps you motivated and helps you understand real requirements."
    },
    {
      id: "q4-2",
      question: "What should you focus on when starting a project?",
      options: [
        "Perfect code from the start",
        "MVP - minimum viable product",
        "All possible features",
        "Documentation first"
      ],
      correctIndex: 1,
      explanation: "Starting with an MVP lets you get something working quickly, then iterate and improve."
    },
    {
      id: "q4-3",
      question: "How should you handle errors from AI-generated code?",
      options: [
        "Ignore them",
        "Share the error with AI and ask for fixes",
        "Always rewrite manually",
        "Delete the project"
      ],
      correctIndex: 1,
      explanation: "Sharing errors with AI is part of the iterative process - AI can often fix its own mistakes with error context."
    },
    {
      id: "q4-4",
      question: "What role does testing play in vibecoded projects?",
      options: [
        "Testing is unnecessary with AI",
        "Critical for validating AI output",
        "Only manual testing matters",
        "AI handles all testing"
      ],
      correctIndex: 1,
      explanation: "Testing remains essential to validate that AI-generated code actually works as intended."
    },
    {
      id: "q4-5",
      question: "When should you refactor vibecoded code?",
      options: [
        "Never - AI code is perfect",
        "After it works, for maintainability",
        "Before testing",
        "Only with production issues"
      ],
      correctIndex: 1,
      explanation: "Refactoring after achieving working functionality improves maintainability while preserving behavior."
    }
  ],
  "module-5": [
    {
      id: "q5-1",
      question: "What is a multi-agent workflow?",
      options: [
        "Using multiple keyboards",
        "Multiple AI tools working together",
        "Hiring multiple developers",
        "Running code on multiple servers"
      ],
      correctIndex: 1,
      explanation: "Multi-agent workflows involve using different AI tools that complement each other for complex tasks."
    },
    {
      id: "q5-2",
      question: "What should you always review in AI-generated code?",
      options: [
        "Only the comments",
        "Security, performance, and edge cases",
        "Just the formatting",
        "Nothing - trust AI completely"
      ],
      correctIndex: 1,
      explanation: "Human review for security, performance, and edge cases is essential - AI can make subtle mistakes."
    },
    {
      id: "q5-3",
      question: "How will AI tools evolve according to the curriculum?",
      options: [
        "They will remain the same",
        "They will continuously improve and integrate deeper",
        "They will disappear",
        "They will only work offline"
      ],
      correctIndex: 1,
      explanation: "AI tools are rapidly improving and integrating more deeply into development workflows."
    },
    {
      id: "q5-4",
      question: "What makes a 'future-proof' vibecoder?",
      options: [
        "Only learning one tool",
        "Combining AI skills with strong fundamentals",
        "Avoiding new technologies",
        "Focusing only on syntax"
      ],
      correctIndex: 1,
      explanation: "The best vibecoders combine AI collaboration skills with strong programming fundamentals."
    },
    {
      id: "q5-5",
      question: "What is the 'final thought' about vibecoding?",
      options: [
        "AI will replace all developers",
        "Vibecoding is a tool, not magic",
        "Only experts can vibecode",
        "Vibecoding is a temporary fad"
      ],
      correctIndex: 1,
      explanation: "Vibecoding is a powerful tool, but human creativity, judgment, and user understanding always matter."
    }
  ]
};

const TOTAL_LESSONS = VIBECODING_SYLLABUS.reduce((acc, m) => acc + m.lessons.length, 0);
const TOTAL_QUIZZES = VIBECODING_SYLLABUS.length; // One quiz per module

interface UserProgress {
  completedLessons: string[];
  passedQuizzes: string[];
  hasCertificate: boolean;
  certificateNumber?: string;
  badges: Array<{
    id: string;
    badgeName: string;
    badgeIcon: string;
    earnedAt: string;
  }>;
}

export default function LearnVibecodingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeModule, setActiveModule] = useState<string | null>("module-1");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedQuizModule, setSelectedQuizModule] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);
  
  // Reading timer state (30 second minimum)
  const READING_TIME_REQUIRED = 30;
  const [readingTimeRemaining, setReadingTimeRemaining] = useState(READING_TIME_REQUIRED);
  const [hasMetReadingTime, setHasMetReadingTime] = useState(false);
  
  // Fetch progress FIRST before using it in other functions
  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress>({
    queryKey: ["/api/users", user?.id, "vibecoding-progress"],
    enabled: !!user,
  });
  
  // Fetch stored explanation for selected lesson
  const { data: explanationData, isLoading: explanationLoading } = useQuery<{ explanation: string | null; exists: boolean }>({
    queryKey: ["/api/vibecoding/lessons", selectedLesson?.id, "explanation"],
    enabled: !!user && !!selectedLesson,
  });
  
  const lessonExplanation = explanationData?.explanation || null;

  const allLessons = VIBECODING_SYLLABUS.flatMap(m => m.lessons);
  const currentLessonIndex = selectedLesson ? allLessons.findIndex(l => l.id === selectedLesson.id) : -1;
  
  // Check if next lesson can be accessed (current must be completed or user is completing it)
  const canAccessNextLesson = (nextIndex: number) => {
    if (nextIndex >= allLessons.length || nextIndex < 0) return false;
    // Can access if all lessons before it are completed
    for (let i = 0; i < nextIndex; i++) {
      const lessonCompleted = progress?.completedLessons?.includes(allLessons[i].id) || false;
      if (!lessonCompleted) return false;
    }
    return true;
  };
  
  const hasNextLesson = currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1;
  const hasPrevLesson = currentLessonIndex > 0;
  const canGoNext = hasNextLesson && canAccessNextLesson(currentLessonIndex + 1);

  const goToNextLesson = () => {
    if (hasNextLesson && canGoNext) {
      setSelectedLesson(allLessons[currentLessonIndex + 1]);
    }
  };

  const goToPrevLesson = () => {
    if (hasPrevLesson) {
      setSelectedLesson(allLessons[currentLessonIndex - 1]);
    }
  };

  // Mutation to mark lesson as complete
  const completeLesson = useMutation({
    mutationFn: async (lessonId: string) => {
      return apiRequest("POST", `/api/vibecoding/lessons/${lessonId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "vibecoding-progress"] });
      toast({
        title: "Lesson completed!",
        description: "Great job! Keep learning.",
      });
    },
  });

  // Mutation to submit quiz (sends answers for server-side scoring)
  const submitQuiz = useMutation({
    mutationFn: async ({ moduleId, answers }: { moduleId: string; answers: Record<string, number> }) => {
      return apiRequest("POST", `/api/vibecoding/quizzes/${moduleId}/submit`, { answers });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "vibecoding-progress"] });
      if (data.passed) {
        toast({
          title: "Quiz Passed!",
          description: "Congratulations! You've passed this module quiz.",
        });
      }
    },
  });

  // Mutation to claim certificate (backend verifies completion server-side)
  const claimCertificate = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/vibecoding/claim-certificate", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "vibecoding-progress"] });
      toast({
        title: "Congratulations!",
        description: "You've earned your Vibecoder Certificate and Badge!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot claim certificate",
        description: error.message || "Complete all lessons and quizzes first",
        variant: "destructive",
      });
    },
  });

  // Mutation to generate alternative explanation (one per lesson, stored permanently)
  const getExplanation = useMutation({
    mutationFn: async ({ lessonId, lessonTitle, lessonContent }: { lessonId: string; lessonTitle: string; lessonContent: string }) => {
      return apiRequest("POST", `/api/vibecoding/lessons/${lessonId}/explain`, { lessonTitle, lessonContent });
    },
    onSuccess: (_data: any, variables) => {
      // Invalidate the explanation query to refetch the stored explanation
      queryClient.invalidateQueries({ queryKey: ["/api/vibecoding/lessons", variables.lessonId, "explanation"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not generate alternative explanation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reading timer effect - countdown when lesson is open
  useEffect(() => {
    if (!selectedLesson) {
      // Reset timer when lesson closes (keep explanations)
      setReadingTimeRemaining(READING_TIME_REQUIRED);
      setHasMetReadingTime(false);
      return;
    }

    // If lesson is already completed, don't require timer
    if (progress?.completedLessons?.includes(selectedLesson.id)) {
      setHasMetReadingTime(true);
      return;
    }

    // Notify server that user started reading this lesson (for server-side enforcement)
    if (user) {
      apiRequest("POST", `/api/vibecoding/lessons/${selectedLesson.id}/start-reading`).catch(() => {
        // Ignore errors - server tracking is secondary to client timer
      });
    }

    // Start countdown
    const interval = setInterval(() => {
      setReadingTimeRemaining(prev => {
        if (prev <= 1) {
          setHasMetReadingTime(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedLesson, progress?.completedLessons, user]);

  // Quiz functions
  const startQuiz = (moduleId: string) => {
    setSelectedQuizModule(moduleId);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const selectAnswer = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!selectedQuizModule) return;
    const questions = MODULE_QUIZZES[selectedQuizModule] || [];
    let correct = 0;
    questions.forEach(q => {
      if (quizAnswers[q.id] === q.correctIndex) correct++;
    });
    setQuizScore({ correct, total: questions.length });
    setQuizSubmitted(true);
    
    // Submit answers to backend for server-side scoring
    if (user) {
      submitQuiz.mutate({ moduleId: selectedQuizModule, answers: quizAnswers });
    }
  };

  const closeQuiz = () => {
    setSelectedQuizModule(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const isQuizPassed = (moduleId: string) => {
    return progress?.passedQuizzes?.includes(moduleId) || false;
  };

  const canTakeQuiz = (moduleId: string) => {
    // Can take quiz if all lessons in the module are completed
    const module = VIBECODING_SYLLABUS.find(m => m.id === moduleId);
    if (!module) return false;
    return module.lessons.every(l => progress?.completedLessons?.includes(l.id));
  };

  const allCompleted = (progress?.completedLessons?.length || 0) >= TOTAL_LESSONS && 
                       (progress?.passedQuizzes?.length || 0) >= TOTAL_QUIZZES;

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} className="font-bold text-lg mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
      }
      if (line.startsWith('**')) {
        const parts = line.split('**');
        return (
          <p key={i} className="mb-2">
            {parts.map((part, j) => 
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        );
      }
      if (line.startsWith('•')) {
        return <li key={i} className="ml-4 mb-1">{line.substring(1).trim()}</li>;
      }
      if (line.startsWith('□')) {
        return <li key={i} className="ml-4 mb-1 list-none flex items-start gap-2">
          <span className="inline-block w-4 h-4 border border-muted-foreground rounded-sm mt-1 flex-shrink-0" />
          {line.substring(1).trim()}
        </li>;
      }
      if (line.match(/^\d+\./)) {
        return <li key={i} className="ml-4 mb-1">{line}</li>;
      }
      if (line.startsWith('`') && line.endsWith('`') && !line.includes('```')) {
        return <code key={i} className="block bg-muted px-3 py-2 rounded-md text-sm font-mono my-2">{line.replace(/`/g, '')}</code>;
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} className="mb-2">{line}</p>;
    });
  };

  const { data: certificates } = useQuery<any[]>({
    queryKey: ["/api/users", user?.id, "certificates"],
    enabled: !!user,
  });

  const { data: badges } = useQuery<any[]>({
    queryKey: ["/api/users", user?.id, "badges"],
    enabled: !!user,
  });

  const completedLessonsCount = progress?.completedLessons?.length || 0;
  const progressPercentage = Math.round((completedLessonsCount / TOTAL_LESSONS) * 100);

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="h-4 w-4" />;
      case "article":
        return <BookOpen className="h-4 w-4" />;
      case "hands-on":
        return <Sparkles className="h-4 w-4" />;
      case "project":
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getLessonBadge = (type: string) => {
    switch (type) {
      case "video":
        return <Badge variant="secondary">Video</Badge>;
      case "article":
        return <Badge variant="outline">Article</Badge>;
      case "hands-on":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Hands-on</Badge>;
      case "project":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Project</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress?.completedLessons?.includes(lessonId) || false;
  };

  // Get all lessons flattened with their module index
  const allLessonsWithModules = VIBECODING_SYLLABUS.flatMap((module, moduleIdx) => 
    module.lessons.map((lesson, lessonIdx) => ({
      ...lesson,
      moduleIndex: moduleIdx,
      lessonIndex: lessonIdx,
    }))
  );

  // Check if a lesson is unlocked (first lesson OR all previous lessons completed)
  const isLessonUnlocked = (lessonId: string) => {
    const lessonIndex = allLessonsWithModules.findIndex(l => l.id === lessonId);
    if (lessonIndex === 0) return true; // First lesson is always unlocked
    
    // Check if all previous lessons are completed
    for (let i = 0; i < lessonIndex; i++) {
      if (!isLessonCompleted(allLessonsWithModules[i].id)) {
        return false;
      }
    }
    return true;
  };

  // Get the index of the next unlockable lesson (first uncompleted or last+1)
  const getNextUnlockedIndex = () => {
    for (let i = 0; i < allLessonsWithModules.length; i++) {
      if (!isLessonCompleted(allLessonsWithModules[i].id)) {
        return i;
      }
    }
    return allLessonsWithModules.length; // All completed
  };

  const vibecodingCertificates = certificates?.filter(c => 
    c.course?.category === "Vibecoding" || c.course?.title?.toLowerCase().includes("vibecoding")
  ) || [];

  const vibecodingBadges = badges?.filter(b => 
    b.badgeType === "course_completion" || b.badgeType === "vibecoding"
  ) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Learn Vibecoding</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Master the art of AI-assisted development. Complete the curriculum, pass all quizzes, 
            and earn your official Vibecoder Certificate and Badge.
          </p>
        </div>
        {user && (
          <Card className="min-w-[200px]">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Your Progress</span>
              </div>
              <Progress value={progressPercentage} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                {completedLessonsCount} of {TOTAL_LESSONS} lessons completed
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Syllabus
              </CardTitle>
              <CardDescription>
                {VIBECODING_SYLLABUS.length} modules, {TOTAL_LESSONS} lessons, {TOTAL_QUIZZES} quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion 
                type="single" 
                collapsible 
                value={activeModule || undefined}
                onValueChange={(value) => setActiveModule(value)}
              >
                {VIBECODING_SYLLABUS.map((module, moduleIndex) => {
                  const moduleCompleted = module.lessons.every(l => isLessonCompleted(l.id));
                  const lessonsCompleted = module.lessons.filter(l => isLessonCompleted(l.id)).length;
                  
                  return (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                            moduleCompleted 
                              ? "bg-green-500 text-white" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {moduleCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              moduleIndex + 1
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{module.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {module.lessons.length} lessons • {module.quizCount} quizzes
                              {lessonsCompleted > 0 && (
                                <span className="ml-2 text-green-600">
                                  ({lessonsCompleted}/{module.lessons.length} completed)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground mb-4 pl-11">
                          {module.description}
                        </p>
                        <div className="space-y-2 pl-11">
                          {module.lessons.map((lesson, lessonIndex) => {
                            const completed = isLessonCompleted(lesson.id);
                            const unlocked = isLessonUnlocked(lesson.id);
                            const isLocked = !unlocked && !completed;
                            
                            return (
                              <div
                                key={lesson.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border ${
                                  completed 
                                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" 
                                    : isLocked
                                    ? "bg-muted/30 border-muted opacity-60"
                                    : "bg-card hover-elevate"
                                }`}
                                data-testid={`lesson-${lesson.id}`}
                              >
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                                  completed 
                                    ? "bg-green-500 text-white" 
                                    : isLocked
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-primary/20 text-primary"
                                }`}>
                                  {completed ? (
                                    <CheckCircle className="h-3 w-3" />
                                  ) : isLocked ? (
                                    <Lock className="h-3 w-3" />
                                  ) : (
                                    lessonIndex + 1
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className={`text-sm font-medium ${isLocked ? "text-muted-foreground" : ""}`}>
                                    {lesson.title}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {getLessonBadge(lesson.type)}
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {lesson.duration}
                                    </span>
                                    {!completed && (
                                      <Badge variant="outline" className="text-[10px] py-0 h-4">
                                        30s min read
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {isLocked ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    disabled
                                    data-testid={`start-lesson-${lesson.id}`}
                                  >
                                    <Lock className="h-3 w-3" />
                                    Locked
                                  </Button>
                                ) : (
                                  <Button
                                    variant={completed ? "outline" : "default"}
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => setSelectedLesson(lesson)}
                                    data-testid={`start-lesson-${lesson.id}`}
                                  >
                                    {completed ? "Review" : "Start"}
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                          
                          <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                            isQuizPassed(module.id) 
                              ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                              : canTakeQuiz(module.id)
                              ? "border-dashed bg-primary/5 border-primary/30"
                              : "border-dashed bg-muted/50"
                          }`}>
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                              isQuizPassed(module.id) 
                                ? "bg-green-500 text-white" 
                                : canTakeQuiz(module.id)
                                ? "bg-primary text-white"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {isQuizPassed(module.id) ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : canTakeQuiz(module.id) ? (
                                <Star className="h-3 w-3" />
                              ) : (
                                <Lock className="h-3 w-3" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">Module Quiz</div>
                              <div className="text-xs text-muted-foreground">
                                {isQuizPassed(module.id) 
                                  ? "Passed!" 
                                  : canTakeQuiz(module.id)
                                  ? `${module.quizCount} questions - Ready to take!`
                                  : `Complete all ${module.lessons.length} lessons first`}
                              </div>
                            </div>
                            {isQuizPassed(module.id) ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Passed
                              </Badge>
                            ) : canTakeQuiz(module.id) ? (
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => startQuiz(module.id)}
                                data-testid={`button-take-quiz-${module.id}`}
                              >
                                Take Quiz
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" className="gap-1" disabled>
                                <Lock className="h-3 w-3" />
                                Locked
                              </Button>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-5 w-5 text-amber-500" />
                Certificate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progress?.hasCertificate ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                    <Award className="h-8 w-8 text-amber-500" />
                    <div>
                      <div className="font-medium text-sm">Vibecoder Certified</div>
                      <div className="text-xs text-muted-foreground">
                        Certificate #{progress.certificateNumber}
                      </div>
                    </div>
                  </div>
                </div>
              ) : allCompleted ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="font-medium text-sm">All Complete!</div>
                      <div className="text-xs text-muted-foreground">
                        You're ready to claim your certificate
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => claimCertificate.mutate()}
                    disabled={claimCertificate.isPending}
                    data-testid="button-claim-certificate"
                  >
                    {claimCertificate.isPending ? "Claiming..." : "Claim Certificate & Badge"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Complete all {TOTAL_LESSONS} lessons and pass all {TOTAL_QUIZZES} quizzes to earn your Vibecoder Certificate
                  </p>
                  <div className="flex justify-center gap-4 text-xs">
                    <div>
                      <span className="font-medium">{progress?.completedLessons?.length || 0}</span>
                      <span className="text-muted-foreground">/{TOTAL_LESSONS} lessons</span>
                    </div>
                    <div>
                      <span className="font-medium">{progress?.passedQuizzes?.length || 0}</span>
                      <span className="text-muted-foreground">/{TOTAL_QUIZZES} quizzes</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-5 w-5 text-primary" />
                Badges Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vibecodingBadges.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {vibecodingBadges.map((badge) => (
                    <div 
                      key={badge.id} 
                      className="flex flex-col items-center p-2 rounded-lg bg-muted/50 text-center"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mb-1">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs font-medium line-clamp-2">
                        {badge.badgeName}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Complete modules to earn badges
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">What You'll Learn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Use AI assistants effectively for coding</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Master prompt engineering for developers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Build complete projects with AI assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Deploy production-ready applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Advanced multi-agent workflows</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {!user && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <GraduationCap className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Ready to Start?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to track your progress and earn your certificate
                  </p>
                  <Button 
                    onClick={() => window.location.href = "/api/login"}
                    className="w-full"
                    data-testid="button-signin-learn"
                  >
                    Sign In to Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={!!selectedLesson} onOpenChange={(open) => !open && setSelectedLesson(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {selectedLesson && getLessonBadge(selectedLesson.type)}
                <DialogTitle className="text-xl">{selectedLesson?.title}</DialogTitle>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedLesson?.duration}
                </span>
                {user && selectedLesson && !isLessonCompleted(selectedLesson.id) && !hasMetReadingTime && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {readingTimeRemaining}s remaining
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {selectedLesson?.content && formatContent(selectedLesson.content)}
            </div>
            
            {/* Alternative Explanation Section */}
            {user && selectedLesson && (
              <div className="mt-6 pt-4 border-t space-y-4">
                {/* Show stored explanation if it exists */}
                {lessonExplanation && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      <span className="font-medium text-primary">
                        Alternative Explanation
                      </span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {formatContent(lessonExplanation)}
                    </div>
                  </div>
                )}
                
                {/* Button to generate explanation - only show if no explanation exists and not loading */}
                {!lessonExplanation && !explanationLoading && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedLesson) {
                        getExplanation.mutate({
                          lessonId: selectedLesson.id,
                          lessonTitle: selectedLesson.title,
                          lessonContent: selectedLesson.content
                        });
                      }
                    }}
                    disabled={getExplanation.isPending}
                    className="gap-2"
                    data-testid="button-alternative-explanation"
                  >
                    {getExplanation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-4 w-4" />
                        Need a different explanation?
                      </>
                    )}
                  </Button>
                )}
                
                {/* Show loading state */}
                {explanationLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading saved explanation...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={goToPrevLesson}
              disabled={!hasPrevLesson}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-3">
              {user && selectedLesson && !isLessonCompleted(selectedLesson.id) ? (
                <Button
                  variant="default"
                  onClick={() => {
                    if (selectedLesson) {
                      completeLesson.mutate(selectedLesson.id);
                    }
                  }}
                  disabled={completeLesson.isPending || !hasMetReadingTime}
                  className="gap-2"
                  data-testid="button-complete-lesson"
                >
                  <CheckCircle className="h-4 w-4" />
                  {completeLesson.isPending ? "Marking..." : hasMetReadingTime ? "Mark Complete" : `Read for ${readingTimeRemaining}s`}
                </Button>
              ) : selectedLesson && isLessonCompleted(selectedLesson.id) ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : null}
              <span className="text-sm text-muted-foreground">
                {currentLessonIndex + 1} / {allLessons.length}
              </span>
            </div>
            
            <Button
              onClick={goToNextLesson}
              variant="outline"
              disabled={!hasNextLesson || (!canGoNext && !isLessonCompleted(selectedLesson?.id || ""))}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={!!selectedQuizModule} onOpenChange={(open) => !open && closeQuiz()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              {VIBECODING_SYLLABUS.find(m => m.id === selectedQuizModule)?.title} Quiz
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
            {selectedQuizModule && MODULE_QUIZZES[selectedQuizModule]?.map((question, qIndex) => {
              const userAnswer = quizAnswers[question.id];
              const isCorrect = userAnswer === question.correctIndex;
              const showResult = quizSubmitted;
              
              return (
                <div key={question.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium shrink-0 ${
                      showResult 
                        ? (isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white")
                        : userAnswer !== undefined 
                        ? "bg-primary text-white" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {showResult ? (isCorrect ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />) : qIndex + 1}
                    </div>
                    <p className="font-medium pt-0.5">{question.question}</p>
                  </div>
                  
                  <div className="space-y-2 pl-10">
                    {question.options.map((option, optIndex) => {
                      const isSelected = userAnswer === optIndex;
                      const isCorrectOption = question.correctIndex === optIndex;
                      
                      return (
                        <button
                          key={optIndex}
                          onClick={() => selectAnswer(question.id, optIndex)}
                          disabled={quizSubmitted}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            showResult
                              ? isCorrectOption
                                ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800"
                                : isSelected && !isCorrect
                                ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800"
                                : "border-muted"
                              : isSelected
                              ? "bg-primary/10 border-primary"
                              : "border-muted hover:border-primary/50 hover:bg-muted/50"
                          }`}
                          data-testid={`quiz-option-${question.id}-${optIndex}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                              showResult
                                ? isCorrectOption
                                  ? "border-green-500 bg-green-500"
                                  : isSelected
                                  ? "border-red-500 bg-red-500"
                                  : "border-muted-foreground"
                                : isSelected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                            }`}>
                              {(isSelected || (showResult && isCorrectOption)) && (
                                <CheckCircle className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className={showResult && isCorrectOption ? "font-medium" : ""}>{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {showResult && (
                    <div className={`ml-10 p-3 rounded-lg text-sm ${
                      isCorrect 
                        ? "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200"
                        : "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200"
                    }`}>
                      {question.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <Button variant="outline" onClick={closeQuiz}>
              {quizSubmitted ? "Close" : "Cancel"}
            </Button>
            
            <div className="flex items-center gap-3">
              {quizSubmitted && quizScore && (
                <div className={`text-sm font-medium ${
                  quizScore.correct >= Math.ceil(quizScore.total * 0.8)
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  Score: {quizScore.correct}/{quizScore.total} 
                  {quizScore.correct >= Math.ceil(quizScore.total * 0.8) ? " - Passed!" : " - Try again"}
                </div>
              )}
              
              {!quizSubmitted ? (
                <Button 
                  onClick={handleSubmitQuiz}
                  disabled={!selectedQuizModule || Object.keys(quizAnswers).length < (MODULE_QUIZZES[selectedQuizModule || ""]?.length || 0)}
                  data-testid="button-submit-quiz"
                >
                  Submit Quiz
                </Button>
              ) : quizScore && quizScore.correct < Math.ceil(quizScore.total * 0.8) ? (
                <Button onClick={() => {
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                  setQuizScore(null);
                }}>
                  Try Again
                </Button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
