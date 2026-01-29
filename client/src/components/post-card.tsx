import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Heart, MessageCircle, Trash2, Send, Loader2, User, Share2, X, ChevronLeft, ChevronRight, Repeat2, Bot, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { VerifiedBadge, isUserVerified } from "@/components/verified-badge";

interface PostUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
  username?: string;
  isNewsBot?: boolean;
}

// Render text with **bold** support and --- divider support
function renderFormattedText(text: string): React.ReactNode {
  // First split by line breaks to handle dividers
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Check if line is a divider (--- or ---)
    if (line.trim() === '---' || line.trim() === '—') {
      return <hr key={lineIndex} className="my-3 border-t border-border" />;
    }
    
    // Split line by bold markers
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const formattedParts = parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <span key={i} className="font-semibold">{part.slice(2, -2)}</span>;
      }
      return part;
    });
    
    // Add line break after each line (except last)
    if (lineIndex < lines.length - 1) {
      return <span key={lineIndex}>{formattedParts}{'\n'}</span>;
    }
    return <span key={lineIndex}>{formattedParts}</span>;
  });
}

interface PostMedia {
  id: string;
  postId: string;
  mediaType: string;
  mediaUrl: string;
  previewUrl?: string;
  aspectRatio?: string;
}

interface Post {
  id: string;
  userId: string;
  content: string | null;
  voiceNoteUrl: string | null;
  sourceUrl: string | null;
  createdAt: string;
  user: PostUser | null;
  media: PostMedia[];
  likeCount: number;
  commentCount: number;
  repostCount?: number;
  isLiked: boolean;
  isReposted?: boolean;
  type: "post";
}

interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: PostUser | null;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  // Local optimistic state for instant UI updates
  const [optimisticLiked, setOptimisticLiked] = useState(post.isLiked);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(post.likeCount);
  const [optimisticReposted, setOptimisticReposted] = useState(post.isReposted || false);
  const [optimisticRepostCount, setOptimisticRepostCount] = useState(post.repostCount || 0);

  // Sync with server data when post updates
  useEffect(() => {
    setOptimisticLiked(post.isLiked);
    setOptimisticLikeCount(post.likeCount);
    setOptimisticReposted(post.isReposted || false);
    setOptimisticRepostCount(post.repostCount || 0);
  }, [post.isLiked, post.likeCount, post.isReposted, post.repostCount]);

  const likeMutation = useMutation({
    mutationFn: async (newLikedState: boolean) => {
      if (!newLikedState) {
        return apiRequest("DELETE", `/api/posts/${post.id}/like`);
      }
      return apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onMutate: async (newLikedState: boolean) => {
      // Optimistically update UI immediately
      setOptimisticLiked(newLikedState);
      setOptimisticLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: () => {
      // Revert on error
      setOptimisticLiked(post.isLiked);
      setOptimisticLikeCount(post.likeCount);
      toast({ title: "Failed to update like", variant: "destructive" });
    },
  });

  const repostMutation = useMutation({
    mutationFn: async (newRepostedState: boolean) => {
      if (!newRepostedState) {
        return apiRequest("DELETE", `/api/posts/${post.id}/repost`);
      }
      return apiRequest("POST", `/api/posts/${post.id}/repost`);
    },
    onMutate: async (newRepostedState: boolean) => {
      setOptimisticReposted(newRepostedState);
      setOptimisticRepostCount(prev => newRepostedState ? prev + 1 : Math.max(0, prev - 1));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: () => {
      setOptimisticReposted(post.isReposted || false);
      setOptimisticRepostCount(post.repostCount || 0);
      toast({ title: "Failed to update repost", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/posts"] });
      await queryClient.cancelQueries({ queryKey: ["/api/feed"] });

      // Snapshot previous values
      const previousPosts = queryClient.getQueryData(["/api/posts"]);
      const previousFeed = queryClient.getQueryData(["/api/feed"]);

      // Optimistically remove the post from cache
      queryClient.setQueryData(["/api/posts"], (old: Post[] | undefined) => 
        old ? old.filter(p => p.id !== post.id) : []
      );
      queryClient.setQueryData(["/api/feed"], (old: Array<{ id: string }> | undefined) => 
        old ? old.filter(item => item.id !== post.id) : []
      );

      return { previousPosts, previousFeed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({ title: "Post deleted" });
    },
    onError: (_err, _vars, context) => {
      // Restore cache on error
      if (context?.previousPosts) {
        queryClient.setQueryData(["/api/posts"], context.previousPosts);
      }
      if (context?.previousFeed) {
        queryClient.setQueryData(["/api/feed"], context.previousFeed);
      }
      toast({ title: "Failed to delete post", variant: "destructive" });
    },
  });

  const { data: comments } = useQuery<PostComment[]>({
    queryKey: ["/api/posts", post.id, "comments"],
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/posts/${post.id}/comments`, {
        content: commentText,
      });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: () => {
      toast({ title: "Failed to add comment", variant: "destructive" });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    // Pass the new desired state (toggle current)
    likeMutation.mutate(!optimisticLiked);
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    repostMutation.mutate(!optimisticReposted);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate();
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    if (!commentText.trim()) return;
    commentMutation.mutate();
  };

  const handleShowComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  const getInitials = (u: PostUser | null) => {
    if (u?.firstName && u?.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  const displayName = post.user?.username
    ? post.user.username
    : `${post.user?.firstName || ""} ${post.user?.lastName || ""}`.trim() || "Anonymous";

  const handleAvatarClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  const handleCardClick = () => {
    navigate(`/posts/${post.id}`);
  };

  return (
    <Card className="p-4 cursor-pointer hover-elevate" onClick={handleCardClick} data-testid={`card-post-${post.id}`}>
      <div className="flex gap-3">
        <div 
          className="cursor-pointer" 
          onClick={(e) => handleAvatarClick(e, post.userId)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.user?.profileImageUrl || undefined} />
            <AvatarFallback>
              {post.user?.isNewsBot ? (
                <Bot className="h-5 w-5 text-muted-foreground" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span 
                className="font-semibold truncate cursor-pointer hover:underline"
                onClick={(e) => handleAvatarClick(e, post.userId)}
              >
                {displayName}
              </span>
              {post.user?.isNewsBot ? (
                <Badge variant="secondary" className="text-xs">
                  <Bot className="h-3 w-3 mr-1" />
                  Automated
                </Badge>
              ) : (
                isUserVerified(post.user) && <VerifiedBadge size="sm" />
              )}
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>
            {user?.id === post.userId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                data-testid={`button-delete-post-${post.id}`}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>

          {post.content && (
            <div className="mt-2" data-testid={`text-post-content-${post.id}`}>
              {post.user?.isNewsBot ? (
                // News bot posts: show only title + preview
                <div>
                  {(() => {
                    const lines = post.content.split('\n').filter(l => l.trim() && l.trim() !== '---');
                    const title = lines[0] || '';
                    // Get preview lines and strip bold markers for clean display
                    const previewLines = lines.slice(1, 3).join(' ').slice(0, 150);
                    const cleanPreview = previewLines.replace(/\*\*/g, '');
                    return (
                      <>
                        <p className="font-semibold">{renderFormattedText(title)}</p>
                        {cleanPreview && (
                          <p className="text-muted-foreground mt-1 line-clamp-2">
                            {cleanPreview}{previewLines.length >= 150 ? '...' : ''}
                          </p>
                        )}
                        <span className="text-primary text-sm mt-2 inline-block">Read more</span>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{renderFormattedText(post.content)}</div>
              )}
            </div>
          )}

          {post.voiceNoteUrl && (
            <audio
              src={post.voiceNoteUrl}
              controls
              className="mt-2 w-full max-w-md"
              data-testid={`audio-post-${post.id}`}
            />
          )}

          {post.media && post.media.length > 0 && (
            <div className={`mt-3 grid gap-2 ${post.media.length === 1 ? "grid-cols-1" : post.media.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
              {post.media.map((m, index) => (
                <div 
                  key={m.id} 
                  className="overflow-hidden rounded-lg cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMediaIndex(index);
                    setMediaModalOpen(true);
                  }}
                >
                  {m.mediaType === "image" ? (
                    <img
                      src={m.mediaUrl}
                      alt=""
                      className="w-full object-cover max-h-96 hover:opacity-90 transition-opacity"
                      data-testid={`img-post-media-${m.id}`}
                    />
                  ) : (
                    <video
                      src={m.mediaUrl}
                      className="w-full max-h-96"
                      data-testid={`video-post-media-${m.id}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-1 ${optimisticLiked ? "text-red-500" : ""}`}
              data-testid={`button-like-post-${post.id}`}
            >
              <Heart className={`h-4 w-4 ${optimisticLiked ? "fill-current" : ""}`} />
              {optimisticLikeCount > 0 && <span>{optimisticLikeCount}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowComments}
              className="gap-1"
              data-testid={`button-comments-post-${post.id}`}
            >
              <MessageCircle className="h-4 w-4" />
              {post.commentCount > 0 && <span>{post.commentCount}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRepost}
              className={`gap-1 ${optimisticReposted ? "text-green-500" : ""}`}
              data-testid={`button-repost-post-${post.id}`}
            >
              <Repeat2 className={`h-4 w-4 ${optimisticReposted ? "text-green-500" : ""}`} />
              {optimisticRepostCount > 0 && <span>{optimisticRepostCount}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = `${window.location.origin}/posts/${post.id}`;
                // Share only the URL - no pre-message text
                const shareData = { url };
                
                if (navigator.share && navigator.canShare?.(shareData)) {
                  try {
                    await navigator.share(shareData);
                  } catch (err) {
                    // User cancelled or share failed, fall back to copy
                    if ((err as Error).name !== "AbortError") {
                      navigator.clipboard.writeText(url);
                      toast({
                        title: "Link copied",
                        description: "Post link copied to clipboard",
                      });
                    }
                  }
                } else {
                  navigator.clipboard.writeText(url);
                  toast({
                    title: "Link copied",
                    description: "Post link copied to clipboard",
                  });
                }
              }}
              className="gap-1"
              data-testid={`button-share-post-${post.id}`}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {showComments && (
            <div className="mt-4 space-y-3 border-t pt-3" onClick={(e) => e.stopPropagation()}>
              {user && (
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="min-h-[40px] resize-none text-sm"
                      rows={1}
                      data-testid={`input-comment-${post.id}`}
                    />
                    <Button
                      size="icon"
                      onClick={handleComment}
                      disabled={!commentText.trim() || commentMutation.isPending}
                      data-testid={`button-submit-comment-${post.id}`}
                    >
                      {commentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {comments && comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => handleAvatarClick(e, comment.userId)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user?.profileImageUrl || undefined} />
                          <AvatarFallback>
                            <User className="h-4 w-4 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 bg-muted rounded-lg p-2">
                        <span 
                          className="text-sm font-semibold cursor-pointer hover:underline"
                          onClick={(e) => handleAvatarClick(e, comment.userId)}
                        >
                          {comment.user?.username
                            ? comment.user.username
                            : `${comment.user?.firstName || ""} ${comment.user?.lastName || ""}`.trim() || "Anonymous"}
                        </span>
                        <p className="text-sm">{comment.content}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Modal */}
      <Dialog open={mediaModalOpen} onOpenChange={setMediaModalOpen}>
        <DialogContent 
          className="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 max-w-4xl w-full p-0 bg-black/95 border-none"
          onClick={(e) => e.stopPropagation()}
          hideCloseButton
        >
          <div className="relative flex items-center justify-center min-h-[50vh]">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setMediaModalOpen(false)}
              data-testid="button-close-media-modal"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation arrows */}
            {post.media && post.media.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 z-10 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMediaIndex((prev) => 
                      prev === 0 ? post.media.length - 1 : prev - 1
                    );
                  }}
                  data-testid="button-prev-media"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 z-10 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMediaIndex((prev) => 
                      prev === post.media.length - 1 ? 0 : prev + 1
                    );
                  }}
                  data-testid="button-next-media"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Media content */}
            {post.media && post.media[selectedMediaIndex] && (
              <div className="w-full flex flex-col items-center justify-center p-4">
                {post.media[selectedMediaIndex].mediaType === "image" ? (
                  <img
                    src={post.media[selectedMediaIndex].mediaUrl}
                    alt=""
                    className="max-w-full max-h-[70vh] object-contain"
                    data-testid="img-media-modal"
                  />
                ) : (
                  <video
                    src={post.media[selectedMediaIndex].mediaUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-[70vh]"
                    data-testid="video-media-modal"
                  />
                )}
                {/* Save button */}
                <Button
                  variant="secondary"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const mediaUrl = post.media[selectedMediaIndex].mediaUrl;
                    const mediaType = post.media[selectedMediaIndex].mediaType;
                    const extension = mediaType === "image" ? "jpg" : "mp4";
                    const filename = `vibes-media-${post.id}-${selectedMediaIndex + 1}.${extension}`;
                    
                    try {
                      const response = await fetch(mediaUrl);
                      if (!response.ok) throw new Error("Failed to fetch");
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      toast({
                        title: "Downloaded",
                        description: `${mediaType === "image" ? "Image" : "Video"} saved successfully`,
                      });
                    } catch {
                      window.open(mediaUrl, '_blank');
                      toast({
                        title: "Opened in new tab",
                        description: "Right-click and save to download",
                      });
                    }
                  }}
                  data-testid="button-save-media"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Save {post.media[selectedMediaIndex].mediaType === "image" ? "Image" : "Video"}
                </Button>
              </div>
            )}

            {/* Media counter */}
            {post.media && post.media.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                {selectedMediaIndex + 1} / {post.media.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
