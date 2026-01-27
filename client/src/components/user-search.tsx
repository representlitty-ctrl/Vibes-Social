import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSidebar } from "@/components/ui/sidebar";
import type { User, Profile } from "@shared/schema";

type UserWithProfile = User & { profile: Profile | null };

function getInitials(user: User): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) return user.firstName[0].toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return "?";
}

function getDisplayName(user: UserWithProfile): string {
  if (user.profile?.username) return user.profile.username;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return user.email?.split("@")[0] || "User";
}

function getProfileImage(user: UserWithProfile): string | undefined {
  return user.profile?.profileImageUrl || user.profileImageUrl || undefined;
}

export function UserSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { setOpenMobile, isMobile } = useSidebar();

  const { data: users, isLoading } = useQuery<UserWithProfile[]>({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const handleUserClick = () => {
    setOpen(false);
    setSearchQuery("");
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-search-users">
          <Search className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by username, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              data-testid="input-search-users"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {isLoading && searchQuery.length >= 2 && (
              <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
            )}
            
            {!isLoading && searchQuery.length >= 2 && users?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            )}

            {users?.map((user) => (
              <Link key={user.id} href={`/profile/${user.id}`} onClick={handleUserClick}>
                <div
                  className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer"
                  data-testid={`user-result-${user.id}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getProfileImage(user)} />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{getDisplayName(user)}</p>
                    {user.profile?.username && (
                      <p className="text-sm text-muted-foreground truncate">@{user.profile.username}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
