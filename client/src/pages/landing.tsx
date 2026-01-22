import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Rocket, Users, Trophy, ArrowRight, Github, Code2, MessageCircle, TrendingUp, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { VibesLogo } from "@/components/vibes-logo";

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
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <VibesLogo className="h-8" />
            <span className="text-xl font-bold">Vibes</span>
          </div>

          <div className="hidden md:flex md:items-center md:gap-6">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-features">
              Features
            </a>
            <a href="#community" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-community">
              Community
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
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-8 flex justify-center">
                <VibesLogo className="h-20 sm:h-24" />
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Where{" "}
                <span className="rainbow-gradient-text">creative developers</span>
                {" "}ship and thrive
              </h1>
              
              <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Discover projects, connect with builders, learn skills, and get funded. 
                Vibes is the community platform for vibecoders.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href="/api/login">
                  <Button size="lg" className="w-full gap-2 sm:w-auto" data-testid="button-hero-cta">
                    Get Started
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

              {stats && (stats.projectCount > 0 || stats.userCount > 0 || stats.grantCount > 0) && (
                <div className="mt-12 flex items-center justify-center gap-8 text-center">
                  {stats.projectCount > 0 && (
                    <div>
                      <div className="text-2xl font-bold sm:text-3xl">{stats.projectCount}</div>
                      <div className="text-sm text-muted-foreground">Projects</div>
                    </div>
                  )}
                  {stats.userCount > 0 && (
                    <div>
                      <div className="text-2xl font-bold sm:text-3xl">{stats.userCount}</div>
                      <div className="text-sm text-muted-foreground">Builders</div>
                    </div>
                  )}
                  {stats.grantCount > 0 && (
                    <div>
                      <div className="text-2xl font-bold sm:text-3xl">{stats.grantCount}</div>
                      <div className="text-sm text-muted-foreground">Active Grants</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="features" className="border-t py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Everything you need to <span className="rainbow-gradient-text">level up</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                From showcasing your work to getting funded, Vibes has all the tools.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
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

        <section id="community" className="border-t bg-muted/30 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Join a community of <span className="rainbow-gradient-text">vibecoders</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Connect with developers who share your passion for creative coding.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    { icon: TrendingUp, text: "Discover trending projects" },
                    { icon: Users, text: "Follow your favorite builders" },
                    { icon: BookOpen, text: "Learn from curated resources" },
                    { icon: Trophy, text: "Compete for grants and prizes" },
                  ].map((item) => (
                    <li key={item.text} className="flex items-center gap-3 text-sm">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
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
              <div className="relative hidden lg:block">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 p-6">
                  <div className="grid h-full grid-cols-2 gap-4">
                    {[MessageCircle, Code2, Users, Trophy].map((Icon, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center rounded-xl bg-card shadow-sm"
                      >
                        <Icon className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
                Get funded to build your <span className="rainbow-gradient-text">dream project</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Submit your projects to grant programs and compete for funding.
              </p>
              <div className="mt-6">
                <a href="/api/login">
                  <Button className="gap-2" data-testid="button-explore-grants">
                    Explore Grants
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-foreground py-12 text-background dark:bg-card dark:text-foreground">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-xl font-bold sm:text-2xl">
              Ready to start your vibecoding journey?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm opacity-80">
              Join creative developers building, learning, and growing together.
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
              <VibesLogo className="h-6" />
              <span className="font-semibold">Vibes</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Built with love for vibecoders
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              data-testid="link-github"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
