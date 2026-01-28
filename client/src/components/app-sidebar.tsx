import { Link, useLocation } from "wouter";
import {
  Home,
  Rocket,
  BookOpen,
  Trophy,
  Bell,
  User as UserIcon,
  Plus,
  MessageCircle,
  Search,
  Users,
  GraduationCap,
  Settings,
} from "lucide-react";
import { VibesLogo } from "@/components/vibes-logo";
import { UserSearch } from "@/components/user-search";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

const mainNavItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Discover", url: "/discover", icon: Rocket },
  { title: "Learn Vibecoding", url: "/learn-vibecoding", icon: GraduationCap },
  { title: "Resources", url: "/learn", icon: BookOpen },
  { title: "Communities", url: "/communities", icon: Users },
  { title: "Grants", url: "/grants", icon: Trophy },
];

const secondaryNavItems = [
  { title: "Messages", url: "/messages", icon: MessageCircle },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Profile", url: "/profile", icon: UserIcon },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
  });

  const { data: unreadMessages } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user,
  });

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2" onClick={handleNavClick}>
            <VibesLogo className="h-5" />
            <span className="text-xl font-bold">Vibes</span>
          </Link>
          <UserSearch />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.title === "Messages" && unreadMessages && unreadMessages.count > 0 && (
                        <Badge variant="default" className="ml-auto">
                          {unreadMessages.count > 99 ? "99+" : unreadMessages.count}
                        </Badge>
                      )}
                      {item.title === "Notifications" && unreadCount && unreadCount.count > 0 && (
                        <Badge variant="default" className="ml-auto">
                          {unreadCount.count > 99 ? "99+" : unreadCount.count}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Link href="/profile" onClick={handleNavClick} data-testid="link-profile-sidebar">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3 hover-elevate cursor-pointer">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
          </div>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
