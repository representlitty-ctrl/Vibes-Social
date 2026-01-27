import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Trash2, Send, Loader2, User } from "lucide-react";
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
  createdAt: string;
  user: PostUser | null;
  media: PostMedia[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
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

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post.isLiked) {
        return apiRequest("DELETE", `/api/posts/${post.id}/like`);
      }
      return apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: () => {
      toast({ title: "Failed to update like", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({ title: "Post deleted" });
    },
    onError: () => {
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

  const handleLike = () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    likeMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate();
    }
  };

  const handleComment = () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    if (!commentText.trim()) return;
    commentMutation.mutate();
  };

  const getInitials = (u: PostUser | null) => {
    if (u?.firstName && u?.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  const displayName = post.user?.username
    ? `@${post.user.username}`
    : `${post.user?.firstName || ""} ${post.user?.lastName || ""}`.trim() || "Anonymous";

  const handleAvatarClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  return (
    <Card className="p-4" data-testid={`card-post-${post.id}`}>
      <div className="flex gap-3">
        <div 
          className="cursor-pointer" 
          onClick={(e) => handleAvatarClick(e, post.userId)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.user?.profileImageUrl || undefined} />
            <AvatarFallback><User className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span 
                className="font-semibold truncate cursor-pointer hover:underline"
                onClick={(e) => handleAvatarClick(e, post.userId)}
              >
                {displayName}
              </span>
              {isUserVerified(post.user) && <VerifiedBadge size="sm" />}
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
            <p className="mt-2 whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
              {post.content}
            </p>
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
              {post.media.map((m) => (
                <div key={m.id} className="overflow-hidden rounded-lg">
                  {m.mediaType === "image" ? (
                    <img
                      src={m.mediaUrl}
                      alt=""
                      className="w-full object-cover max-h-96"
                    />
                  ) : (
                    <video
                      src={m.mediaUrl}
                      controls
                      className="w-full max-h-96"
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
              disabled={likeMutation.isPending}
              className={`gap-1 ${post.isLiked ? "text-red-500" : ""}`}
              data-testid={`button-like-post-${post.id}`}
            >
              <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
              {post.likeCount > 0 && <span>{post.likeCount}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-1"
              data-testid={`button-comments-post-${post.id}`}
            >
              <MessageCircle className="h-4 w-4" />
              {post.commentCount > 0 && <span>{post.commentCount}</span>}
            </Button>
          </div>

          {showComments && (
            <div className="mt-4 space-y-3 border-t pt-3">
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
                            ? `@${comment.user.username}`
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
    </Card>
  );
}
