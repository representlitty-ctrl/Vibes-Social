import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { VibesLogo } from "@/components/vibes-logo";
import { useAuth } from "@/hooks/use-auth";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import HomePage from "@/pages/home";
import DiscoverPage from "@/pages/discover";
import LearnPage from "@/pages/learn";
import GrantsPage from "@/pages/grants";
import NotificationsPage from "@/pages/notifications";
import ProfilePage from "@/pages/profile";
import ProfileEditPage from "@/pages/profile-edit";
import SubmitProjectPage from "@/pages/submit-project";
import SubmitResourcePage from "@/pages/submit-resource";
import CreateGrantPage from "@/pages/create-grant";
import ProjectDetailPage from "@/pages/project-detail";
import PostDetailPage from "@/pages/post-detail";
import MessagesPage from "@/pages/messages";
import CourseDetailPage from "@/pages/course-detail";
import CommunitiesPage from "@/pages/communities";
import LearnVibecodingPage from "@/pages/learn-vibecoding";
import SettingsPage from "@/pages/settings";
import { FeedProvider } from "@/contexts/feed-context";
import { FeedTabs } from "@/components/feed-tabs";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  // Track user online status with heartbeat
  useHeartbeat();

  return (
    <FeedProvider>
      <SidebarProvider style={style}>
        <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden">
          <AppSidebar />
          <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
            <header className="sticky top-0 z-40 flex flex-col bg-background/80 backdrop-blur-md">
              <div className="flex h-12 items-center justify-between px-4 border-b">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="flex items-center gap-1" data-testid="text-brand-name">
                  <VibesLogo className="h-5" />
                  <h1 className="text-xl font-bold text-primary -ml-0.5">Vibes</h1>
                </div>
                <div className="w-7" />
              </div>
              <div className="px-4 py-2 border-b overflow-hidden min-w-0">
                <FeedTabs />
              </div>
            </header>
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
              <div className="w-full max-w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </FeedProvider>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/projects/:id" component={() => (
          <AuthenticatedLayout>
            <ProjectDetailPage />
          </AuthenticatedLayout>
        )} />
        <Route path="/profile/:id" component={() => (
          <AuthenticatedLayout>
            <ProfilePage />
          </AuthenticatedLayout>
        )} />
        <Route path="/courses/:id" component={() => (
          <AuthenticatedLayout>
            <CourseDetailPage />
          </AuthenticatedLayout>
        )} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/discover" component={DiscoverPage} />
        <Route path="/learn" component={LearnPage} />
        <Route path="/learn/submit" component={SubmitResourcePage} />
        <Route path="/learn-vibecoding" component={LearnVibecodingPage} />
        <Route path="/communities" component={CommunitiesPage} />
        <Route path="/courses/:id" component={CourseDetailPage} />
        <Route path="/grants" component={GrantsPage} />
        <Route path="/grants/create" component={CreateGrantPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/profile/edit" component={ProfileEditPage} />
        <Route path="/profile/:id" component={ProfilePage} />
        <Route path="/profile" component={() => {
          window.location.href = `/profile/${user.id}`;
          return null;
        }} />
        <Route path="/submit" component={SubmitProjectPage} />
        <Route path="/projects/:id" component={ProjectDetailPage} />
        <Route path="/posts/:id" component={PostDetailPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vibes-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
