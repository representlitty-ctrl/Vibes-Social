import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Rocket, 
  Users, 
  Trophy, 
  ArrowRight, 
  Code2, 
  MessageCircle, 
  BookOpen,
  Sparkles,
  Camera,
  Heart,
  Bell,
  Shield,
  Zap,
  GraduationCap,
  Mic,
  Image,
  FileText,
  CheckCircle2,
  Globe
} from "lucide-react";
import { Link } from "wouter";
import { VibesLogo } from "@/components/vibes-logo";

const mainFeatures = [
  {
    icon: Camera,
    title: "Posts & Stories",
    description: "Share your journey with text posts, images, videos, and voice notes. Post 24-hour stories that appear in a beautiful circular feed.",
  },
  {
    icon: Rocket,
    title: "Project Showcases",
    description: "Launch your vibecoded projects to the community. Get upvotes, comments, emoji reactions, and valuable feedback from fellow builders.",
  },
  {
    icon: Users,
    title: "Follow & Connect",
    description: "Build your network by following talented vibecoders. See posts and projects from people you follow in your personalized feed.",
  },
  {
    icon: MessageCircle,
    title: "Direct Messaging",
    description: "Chat privately with other vibecoders. Send voice notes, images, and file attachments in real-time conversations.",
  },
  {
    icon: GraduationCap,
    title: "Learn Vibecoding",
    description: "Master AI-assisted coding with our comprehensive 5-module curriculum. Complete lessons, pass quizzes, and earn your certificate.",
  },
  {
    icon: Trophy,
    title: "Grant Programs",
    description: "Submit your projects to active grant programs and compete for funding to take your ideas to the next level.",
  },
];

const additionalFeatures = [
  {
    icon: Heart,
    title: "Reactions & Engagement",
    description: "Like posts, react with emojis, comment on projects, and bookmark your favorites.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Stay updated with real-time notifications for likes, comments, follows, and messages.",
  },
  {
    icon: Shield,
    title: "Verification Badges",
    description: "Earn your verification badge by completing your profile with a picture, custom username, and email.",
  },
  {
    icon: Globe,
    title: "Communities",
    description: "Join communities based on your interests and discover content from like-minded vibecoders.",
  },
  {
    icon: BookOpen,
    title: "Learning Resources",
    description: "Access curated tutorials, courses, and resources to level up your vibecoding skills.",
  },
  {
    icon: Sparkles,
    title: "Personalized Feed",
    description: "Your unified feed combines posts and projects from people you follow into one stream.",
  },
];

const learningHighlights = [
  { icon: CheckCircle2, text: "5 comprehensive modules covering fundamentals to advanced techniques" },
  { icon: CheckCircle2, text: "23 in-depth lessons with real educational content" },
  { icon: CheckCircle2, text: "Quizzes after each module to test your knowledge" },
  { icon: CheckCircle2, text: "Certificate and badge upon completion" },
];

const messagingFeatures = [
  { icon: MessageCircle, text: "Real-time private conversations" },
  { icon: Mic, text: "Voice note recordings" },
  { icon: Image, text: "Image and photo sharing" },
  { icon: FileText, text: "File attachments" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <VibesLogo className="h-5" />
            <span className="text-xl font-bold">Vibes</span>
          </div>

          <div className="hidden md:flex md:items-center md:gap-6">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-features">
              Features
            </a>
            <a href="#learn" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-learn">
              Learn
            </a>
            <a href="#connect" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-connect">
              Connect
            </a>
            <a href="#grants" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-grants">
              Grants
            </a>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/api/login">
              <Button variant="ghost" size="sm" data-testid="button-login">
                Log in
              </Button>
            </a>
            <a href="/api/login">
              <Button size="sm" data-testid="button-get-started">
                Sign up
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-8 flex justify-center">
                <VibesLogo className="h-10 sm:h-14" />
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                The Social Platform for{" "}
                <span className="rainbow-gradient-text">Vibecoders</span>
              </h1>
              
              <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg max-w-2xl mx-auto">
                Share your journey, showcase projects, learn AI-assisted coding, connect with creative developers, 
                and get funded. Vibes is the all-in-one community platform where vibecoders thrive.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href="/api/login">
                  <Button size="lg" className="w-full gap-2 sm:w-auto" data-testid="button-hero-cta">
                    Start Your Journey
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <Link href="/discover">
                  <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto" data-testid="button-explore">
                    <Code2 className="h-4 w-4" />
                    Explore Projects
                  </Button>
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <span>Posts & Stories</span>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-primary" />
                  <span>Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span>Messaging</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>Learning</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>Grants</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                <Zap className="h-3.5 w-3.5" />
                <span>Core Features</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Everything you need to <span className="rainbow-gradient-text">build and grow</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                From sharing your daily progress to launching projects and learning new skills.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mainFeatures.map((feature) => (
                <Card
                  key={feature.title}
                  className="group p-6 hover-elevate"
                  data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="learn" className="border-t bg-muted/30 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Learn Vibecoding</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Master <span className="rainbow-gradient-text">AI-assisted coding</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Our comprehensive curriculum teaches you how to leverage AI tools to build amazing projects faster. 
                  Based on Andrej Karpathy's original vibecoding concept.
                </p>
                <ul className="mt-6 space-y-3">
                  {learningHighlights.map((item) => (
                    <li key={item.text} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <item.icon className="h-3 w-3 text-primary" />
                      </div>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <a href="/api/login">
                    <Button className="gap-2" data-testid="button-start-learning">
                      Start Learning
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Module 1: Introduction</h4>
                        <p className="text-xs text-muted-foreground">What is Vibecoding?</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                        <Code2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Module 2: Prompt Engineering</h4>
                        <p className="text-xs text-muted-foreground">Communicate with AI effectively</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Module 3: Workflow</h4>
                        <p className="text-xs text-muted-foreground">Optimize your development process</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 opacity-60">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold">+ 2 more modules</h4>
                        <p className="text-xs text-muted-foreground">Building Projects & Advanced Techniques</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section id="connect" className="border-t py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="relative hidden lg:block order-1 lg:order-none">
                <Card className="p-6">
                  <h4 className="font-semibold mb-4">Direct Messaging</h4>
                  <div className="space-y-3">
                    {messagingFeatures.map((item) => (
                      <div key={item.text} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  <Users className="h-3.5 w-3.5" />
                  <span>Community</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Connect with <span className="rainbow-gradient-text">fellow vibecoders</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Build meaningful connections with developers who share your passion for creative coding. 
                  Follow builders, join communities, and chat privately.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    { icon: Users, text: "Follow your favorite builders and see their content in your feed" },
                    { icon: Globe, text: "Join communities based on your interests" },
                    { icon: Bell, text: "Get notified when someone interacts with your content" },
                    { icon: Shield, text: "Earn verification badges by completing your profile" },
                  ].map((item) => (
                    <li key={item.text} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <item.icon className="h-3 w-3 text-primary" />
                      </div>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <a href="/api/login">
                    <Button className="gap-2" data-testid="button-join-community">
                      Join the Community
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-xl text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                And so much <span className="rainbow-gradient-text">more</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Discover all the tools and features designed to help you succeed.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {additionalFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 p-4 rounded-lg bg-card border"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="grants" className="border-t py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                <Trophy className="h-3.5 w-3.5" />
                <span>Funding</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Get funded for your <span className="rainbow-gradient-text">dream project</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Submit your projects to active grant programs and compete for funding. 
                Turn your vibecoded creations into something bigger.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/grants">
                  <Button className="gap-2" data-testid="button-explore-grants">
                    View Grant Programs
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/discover">
                  <Button variant="outline" className="gap-2" data-testid="button-see-winners">
                    See Winning Projects
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-foreground py-12 text-background dark:bg-card dark:text-foreground">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-xl font-bold sm:text-2xl">
              Ready to start vibecoding?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm opacity-80">
              Join the community of creative developers who are building, learning, and growing together.
            </p>
            <div className="mt-6">
              <a href="/api/login">
                <Button
                  variant="secondary"
                  className="gap-2"
                  data-testid="button-footer-cta"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <VibesLogo className="h-4" />
              <span className="font-semibold">Vibes</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Built by a vibecoder for vibecoders
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/discover" className="hover:text-foreground transition-colors">
                Discover
              </Link>
              <Link href="/learn" className="hover:text-foreground transition-colors">
                Learn
              </Link>
              <Link href="/grants" className="hover:text-foreground transition-colors">
                Grants
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
