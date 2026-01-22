import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Rocket, Users, Trophy, ArrowRight, Github, Zap, Code2 } from "lucide-react";
import { Link } from "wouter";

const features = [
  {
    icon: Rocket,
    title: "Ship Your Projects",
    description: "Showcase your vibecoded creations to a community that gets it. Get feedback, upvotes, and recognition.",
  },
  {
    icon: Users,
    title: "Connect with Builders",
    description: "Follow talented vibecoders, collaborate on projects, and grow your network of creative developers.",
  },
  {
    icon: Trophy,
    title: "Win Grants",
    description: "Submit your projects to grant programs and get funding to take your ideas to the next level.",
  },
];

type Stats = {
  projectCount: number;
  userCount: number;
  grantCount: number;
};

export default function LandingPage() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Vibes</span>
          </div>

          <div className="hidden md:flex md:items-center md:gap-8">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#community" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Community
            </a>
            <a href="#grants" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Grants
            </a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a href="/api/login">
              <Button variant="ghost" data-testid="button-login">
                Log in
              </Button>
            </a>
            <a href="/api/login">
              <Button data-testid="button-get-started">
                Get Started
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
          <div className="absolute inset-0 gradient-bg" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-2 text-sm backdrop-blur-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">The home for vibecoders</span>
              </div>
              
              <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Where{" "}
                <span className="gradient-text">creative developers</span>
                {" "}ship and thrive
              </h1>
              
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Discover amazing projects, connect with fellow builders, learn new skills, 
                and get funded. Vibes is the community platform built for the vibecoding movement.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a href="/api/login">
                  <Button size="lg" className="gap-2 text-base" data-testid="button-hero-cta">
                    Start Building
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#features">
                  <Button size="lg" variant="outline" className="gap-2 text-base">
                    <Code2 className="h-4 w-4" />
                    Explore Projects
                  </Button>
                </a>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>Free forever</span>
                <span className="text-border">|</span>
                <span>No credit card required</span>
              </div>
            </div>

            {stats && (stats.projectCount > 0 || stats.userCount > 0 || stats.grantCount > 0) && (
              <div className="mt-20 grid grid-cols-3 gap-8 border-t pt-10">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary sm:text-4xl">{stats.projectCount}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary sm:text-4xl">{stats.userCount}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Builders</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary sm:text-4xl">{stats.grantCount}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Active Grants</div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="features" className="py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to{" "}
                <span className="gradient-text">level up</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From showcasing your work to getting funded, Vibes has all the tools you need.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden p-6 transition-all hover-elevate"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="community" className="border-t bg-muted/30 py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                  Join a thriving community of{" "}
                  <span className="gradient-text">vibecoders</span>
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Connect with developers who share your passion for creative coding. 
                  Get inspired, give feedback, and build together.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "Discover trending projects daily",
                    "Follow your favorite builders",
                    "Learn from curated resources",
                    "Compete for grants and prizes",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <a href="/api/login">
                    <Button size="lg" className="gap-2">
                      Join the Community
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/20 p-8">
                  <div className="grid h-full grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-card p-4 shadow-lg"
                      >
                        <div className="mb-3 h-3 w-3/4 rounded bg-muted" />
                        <div className="space-y-2">
                          <div className="h-2 w-full rounded bg-muted" />
                          <div className="h-2 w-2/3 rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="grants" className="py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
                <Trophy className="h-4 w-4" />
                <span>Funding Opportunities</span>
              </div>
              <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                Get funded to build your{" "}
                <span className="gradient-text">dream project</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Submit your projects to active grant programs and compete for funding 
                to take your ideas from concept to reality.
              </p>
              <div className="mt-8">
                <a href="/api/login">
                  <Button size="lg" className="gap-2">
                    Explore Grants
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-primary py-16 text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to start your vibecoding journey?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
              Join creative developers who are building, learning, 
              and growing together on Vibes.
            </p>
            <div className="mt-8">
              <a href="/api/login">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 text-base"
                  data-testid="button-footer-cta"
                >
                  Get Started for Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-semibold">Vibes</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Vibes. Built with love for vibecoders.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
