import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Plus, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface StoryUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  username?: string;
}

interface Story {
  id: string;
  userId: string;
  mediaType: string;
  mediaUrl: string;
  previewUrl?: string;
  createdAt: string;
  expiresAt: string;
}

interface StoryGroup {
  user: StoryUser | null;
  stories: Story[];
  storyCount: number;
}

export function StoriesRow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: storyGroups, isLoading } = useQuery<StoryGroup[]>({
    queryKey: ["/api/stories"],
    enabled: !!user,
  });

  const { uploadFile, isUploading } = useUpload({
    onSuccess: async (response) => {
      const isVideo = response.metadata.contentType.startsWith("video/");
      try {
        await apiRequest("POST", "/api/stories", {
          mediaType: isVideo ? "video" : "image",
          mediaUrl: response.objectPath,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
        toast({ title: "Story added!" });
      } catch {
        toast({ title: "Failed to create story", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Failed to upload story", variant: "destructive" });
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      return apiRequest("DELETE", `/api/stories/${storyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setViewingGroup(null);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    e.target.value = "";
  };

  const handleAddStory = () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    fileInputRef.current?.click();
  };

  const openStoryViewer = (group: StoryGroup) => {
    setViewingGroup(group);
    setCurrentStoryIndex(0);
  };

  const nextStory = () => {
    if (!viewingGroup) return;
    if (currentStoryIndex < viewingGroup.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      setViewingGroup(null);
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handleAvatarClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const getInitials = (u: StoryUser | null) => {
    if (u?.firstName && u?.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  const getStoryRingColor = (count: number) => {
    if (count >= 5) return "ring-purple-500";
    if (count >= 3) return "ring-orange-500";
    if (count >= 2) return "ring-blue-500";
    return "ring-primary";
  };

  const currentStory = viewingGroup?.stories[currentStoryIndex];

  if (!user) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto py-2 scrollbar-hide" data-testid="stories-row">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-16 w-16 rounded-full"
            onClick={handleAddStory}
            disabled={isUploading}
            data-testid="button-add-story"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>
          <span className="text-xs text-muted-foreground">Add Story</span>
        </div>

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-12 rounded bg-muted animate-pulse" />
            </div>
          ))
        ) : (
          storyGroups?.map((group) => (
            <div
              key={group.user?.id}
              className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
              onClick={() => openStoryViewer(group)}
              data-testid={`story-group-${group.user?.id}`}
            >
              <div className={`p-0.5 rounded-full ring-2 ${getStoryRingColor(group.storyCount)}`}>
                <Avatar className="h-14 w-14 border-2 border-background">
                  <AvatarImage src={group.user?.profileImageUrl || undefined} />
                  <AvatarFallback>{getInitials(group.user)}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[64px]">
                {group.user?.username || group.user?.firstName || "User"}
              </span>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!viewingGroup} onOpenChange={() => setViewingGroup(null)}>
        <DialogContent className="max-w-lg p-0 bg-black border-0">
          <VisuallyHidden>
            <DialogTitle>Story Viewer</DialogTitle>
          </VisuallyHidden>
          {currentStory && viewingGroup && (
            <div className="relative aspect-[9/16] max-h-[80vh]">
              <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
                {viewingGroup.stories.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i <= currentStoryIndex ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>

              <div className="absolute top-4 left-2 right-2 z-10 flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => handleAvatarClick(viewingGroup.user?.id || "")}
                >
                  <Avatar className="h-8 w-8 border border-white/50">
                    <AvatarImage src={viewingGroup.user?.profileImageUrl || undefined} />
                    <AvatarFallback>{getInitials(viewingGroup.user)}</AvatarFallback>
                  </Avatar>
                  <span className="text-white text-sm font-medium">
                    {viewingGroup.user?.username || viewingGroup.user?.firstName || "User"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {user?.id === viewingGroup.user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => deleteStoryMutation.mutate(currentStory.id)}
                      data-testid="button-delete-story"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setViewingGroup(null)}
                    data-testid="button-close-story"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {currentStory.mediaType === "image" ? (
                <img
                  src={currentStory.mediaUrl}
                  alt=""
                  className="h-full w-full object-contain"
                />
              ) : (
                <video
                  src={currentStory.mediaUrl}
                  controls
                  autoPlay
                  className="h-full w-full object-contain"
                />
              )}

              <button
                className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
                onClick={prevStory}
                aria-label="Previous story"
              />
              <button
                className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
                onClick={nextStory}
                aria-label="Next story"
              />

              {currentStoryIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={prevStory}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}
              {currentStoryIndex < viewingGroup.stories.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={nextStory}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
