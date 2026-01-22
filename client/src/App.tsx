import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
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
import ProjectDetailPage from "@/pages/project-detail";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
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
        <Route path="/grants" component={GrantsPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/profile/edit" component={ProfileEditPage} />
        <Route path="/profile/:id" component={ProfilePage} />
        <Route path="/profile" component={() => {
          window.location.href = `/profile/${user.id}`;
          return null;
        }} />
        <Route path="/submit" component={SubmitProjectPage} />
        <Route path="/projects/:id" component={ProjectDetailPage} />
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vibes-theme">
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
