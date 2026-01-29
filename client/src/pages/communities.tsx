import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Users, User as UserIcon, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Community } from "@shared/schema";

type CommunityWithDetails = Community & {
  memberCount: number;
  isMember: boolean;
  creator: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    username: string | null;
  } | null;
};

const CATEGORIES = [
  "Tech",
  "Gaming",
  "Art & Design",
  "Music",
  "AI & ML",
  "Web Development",
  "Mobile",
  "Data Science",
  "Startups",
  "Career",
  "Other",
];

export default function CommunitiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    category: "",
  });

  const { data: communities, isLoading } = useQuery<CommunityWithDetails[]>({
    queryKey: ["/api/communities"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newCommunity) => {
      return apiRequest("POST", "/api/communities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/joined"] });
      setIsCreateOpen(false);
      setNewCommunity({ name: "", description: "", category: "" });
      toast({ title: "Community created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create community", variant: "destructive" });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => {
      return apiRequest("POST", `/api/communities/${communityId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/joined"] });
      toast({ title: "Joined community!" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (communityId: string) => {
      return apiRequest("POST", `/api/communities/${communityId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/joined"] });
      toast({ title: "Left community" });
    },
  });

  const filteredCommunities = communities?.filter((community) => {
    const matchesSearch =
      searchQuery === "" ||
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || community.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedByCategory = CATEGORIES.reduce(
    (acc, category) => {
      const categoryItems = filteredCommunities?.filter(
        (c) => c.category === category
      );
      if (categoryItems && categoryItems.length > 0) {
        acc[category] = categoryItems;
      }
      return acc;
    },
    {} as Record<string, CommunityWithDetails[]>
  );

  const handleCreateCommunity = () => {
    if (!newCommunity.name || !newCommunity.category) return;
    createMutation.mutate(newCommunity);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-2 py-4 md:px-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="text-muted-foreground">
            Join communities of like-minded vibecoders
          </p>
        </div>
        {user && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create-community">
                <Plus className="h-4 w-4" />
                Create Community
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Community</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Community Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Community"
                    value={newCommunity.name}
                    onChange={(e) =>
                      setNewCommunity({ ...newCommunity, name: e.target.value })
                    }
                    data-testid="input-community-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newCommunity.category}
                    onValueChange={(value) =>
                      setNewCommunity({ ...newCommunity, category: value })
                    }
                  >
                    <SelectTrigger data-testid="select-community-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this community about?"
                    value={newCommunity.description}
                    onChange={(e) =>
                      setNewCommunity({
                        ...newCommunity,
                        description: e.target.value,
                      })
                    }
                    data-testid="input-community-description"
                  />
                </div>
                <Button
                  onClick={handleCreateCommunity}
                  disabled={
                    !newCommunity.name ||
                    !newCommunity.category ||
                    createMutation.isPending
                  }
                  className="w-full"
                  data-testid="button-submit-community"
                >
                  Create Community
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-communities"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedCategory === "all" ? (
        Object.entries(groupedByCategory).map(([category, items]) => (
          <section key={category} className="space-y-4">
            <h2 className="text-lg font-semibold">{category}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  user={user}
                  onJoin={() => joinMutation.mutate(community.id)}
                  onLeave={() => leaveMutation.mutate(community.id)}
                  isPending={joinMutation.isPending || leaveMutation.isPending}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCommunities?.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              user={user}
              onJoin={() => joinMutation.mutate(community.id)}
              onLeave={() => leaveMutation.mutate(community.id)}
              isPending={joinMutation.isPending || leaveMutation.isPending}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredCommunities?.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No communities found</h3>
          <p className="text-muted-foreground mt-2">
            {searchQuery
              ? "Try a different search term"
              : "Be the first to create one!"}
          </p>
        </Card>
      )}
    </div>
  );
}

function CommunityCard({
  community,
  user,
  onJoin,
  onLeave,
  isPending,
}: {
  community: CommunityWithDetails;
  user: any;
  onJoin: () => void;
  onLeave: () => void;
  isPending: boolean;
}) {
  return (
    <Card className="hover-elevate" data-testid={`community-card-${community.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{community.name}</CardTitle>
            <Badge variant="secondary" className="mt-1">
              {community.category}
            </Badge>
          </div>
          {community.imageUrl && (
            <Avatar className="h-10 w-10">
              <AvatarImage src={community.imageUrl} />
              <AvatarFallback>
                <Users className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {community.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {community.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{community.memberCount} members</span>
        </div>
        {community.creator && (
          <div className="flex items-center gap-2">
            <Link href={`/profile/${community.creator.id}`}>
              <Avatar className="h-6 w-6 cursor-pointer">
                <AvatarImage src={community.creator.profileImageUrl || undefined} />
                <AvatarFallback>
                  <UserIcon className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
            </Link>
            <span className="text-xs text-muted-foreground">
              Created by{" "}
              {community.creator.username
                ? community.creator.username
                : community.creator.firstName || "User"}
            </span>
          </div>
        )}
        {user && (
          <div className="pt-2">
            {community.isMember ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onLeave}
                disabled={isPending}
                data-testid={`button-leave-${community.id}`}
              >
                Leave
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full"
                onClick={onJoin}
                disabled={isPending}
                data-testid={`button-join-${community.id}`}
              >
                Join
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
