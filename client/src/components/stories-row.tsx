import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, Trash2, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
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
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const { data: storyGroups, isLoading } = useQuery<StoryGroup[]>({
    queryKey: ["/api/stories"],
    enabled: !!user,
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

  const getStoryRingColor = (count: number) => {
    if (count >= 5) return "ring-sky-400";
    if (count >= 3) return "ring-orange-500";
    if (count >= 2) return "ring-blue-500";
    return "ring-primary";
  };

  const currentStory = viewingGroup?.stories[currentStoryIndex];

  if (!user) return null;

  // Sort story groups to put current user's stories first, then followed users
  const sortedGroups = storyGroups?.slice().sort((a, b) => {
    if (a.user?.id === user.id) return -1;
    if (b.user?.id === user.id) return 1;
    return 0;
  });

  // Hide stories section entirely if no stories exist (only show when loading or has content)
  if (!isLoading && (!sortedGroups || sortedGroups.length === 0)) {
    return null;
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto py-2 scrollbar-hide" data-testid="stories-row">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-12 rounded bg-muted animate-pulse" />
            </div>
          ))
        ) : (
          sortedGroups?.map((group) => (
            <div
              key={group.user?.id}
              className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
              onClick={() => openStoryViewer(group)}
              data-testid={`story-group-${group.user?.id}`}
            >
              <div className={`p-0.5 rounded-full ring-2 ${getStoryRingColor(group.storyCount)}`}>
                <Avatar className="h-14 w-14 border-2 border-background">
                  <AvatarImage src={group.user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-6 w-6" />
                  </AvatarFallback>
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
        <DialogContent 
          className="flex flex-col items-center justify-center max-w-[min(400px,90vw)] w-full h-[85vh] max-h-[85vh] p-0 bg-black border-0 rounded-lg overflow-hidden" 
          hideCloseButton
        >
          <VisuallyHidden>
            <DialogTitle>Story Viewer</DialogTitle>
          </VisuallyHidden>
          {currentStory && viewingGroup && (
            <div className="relative w-full h-full flex flex-col" style={{ aspectRatio: '9/16', maxHeight: '100%' }}>
              {/* Progress indicators */}
              <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-3">
                {viewingGroup.stories.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= currentStoryIndex ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>

              {/* Header with user info and close button */}
              <div className="absolute top-6 left-3 right-3 z-20 flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => handleAvatarClick(viewingGroup.user?.id || "")}
                >
                  <Avatar className="h-10 w-10 border-2 border-white/50">
                    <AvatarImage src={viewingGroup.user?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-sm font-medium drop-shadow-lg">
                    {viewingGroup.user?.username || viewingGroup.user?.firstName || "User"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {user?.id === viewingGroup.user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-10 w-10"
                      onClick={() => deleteStoryMutation.mutate(currentStory.id)}
                      data-testid="button-delete-story"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-10 w-10"
                    onClick={() => setViewingGroup(null)}
                    data-testid="button-close-story"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Story content - centered */}
              <div className="flex-1 flex items-center justify-center bg-black w-full overflow-auto">
                {currentStory.mediaType === "image" ? (
                  <img
                    src={currentStory.mediaUrl}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <video
                    src={currentStory.mediaUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* Touch areas for navigation */}
              <button
                className="absolute left-0 top-20 bottom-0 w-1/3 z-10"
                onClick={prevStory}
                aria-label="Previous story"
              />
              <button
                className="absolute right-0 top-20 bottom-0 w-1/3 z-10"
                onClick={nextStory}
                aria-label="Next story"
              />

              {/* Navigation arrows */}
              {currentStoryIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10 z-30"
                  onClick={prevStory}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {currentStoryIndex < viewingGroup.stories.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10 z-30"
                  onClick={nextStory}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
