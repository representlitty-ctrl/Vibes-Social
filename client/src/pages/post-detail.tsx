import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { useState, useEffect } from "react";
import {
  Heart,
  ArrowLeft,
  MessageCircle,
  Send,
  Trash2,
  User as UserIcon,
  Eye,
  Share2,
} from "lucide-react";
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
  viewCount: number;
  user: PostUser | null;
  media: PostMedia[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: PostUser | null;
}

export default function PostDetailPage() {
  const [, params] = useRoute("/posts/:id");
  const postId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [comment, setComment] = useState("");

  const { data: post, isLoading } = useQuery<Post>({
    queryKey: ["/api/posts", postId],
    enabled: !!postId,
  });

  useEffect(() => {
    if (postId) {
      apiRequest("POST", `/api/posts/${postId}/view`).catch(() => {});
    }
  }, [postId]);

  const { data: comments, isLoading: commentsLoading } = useQuery<PostComment[]>({
    queryKey: ["/api/posts", postId, "comments"],
    enabled: !!postId,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post?.isLiked) {
        return apiRequest("DELETE", `/api/posts/${postId}/like`);
      }
      return apiRequest("POST", `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
      toast({
        title: "Comment added",
        description: "Your comment has been posted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeletePost = () => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const handleLike = () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    likeMutation.mutate();
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    commentMutation.mutate(comment);
  };

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <p className="mt-2 text-muted-foreground">
          The post you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/">
          <Button className="mt-6">Go back home</Button>
        </Link>
      </div>
    );
  }

  const displayName = post.user?.username ||
    `${post.user?.firstName || ""} ${post.user?.lastName || ""}`.trim() ||
    "Anonymous";

  const isOwner = user?.id === post.userId;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/">
        <Button variant="ghost" className="gap-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </Button>
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <Link href={`/profile/${post.userId}`}>
            <div className="flex items-center gap-3 hover-elevate rounded-full pr-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.user?.profileImageUrl || undefined} />
                <AvatarFallback><UserIcon className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{displayName}</span>
                  {post.user && isUserVerified({
                    profileImageUrl: post.user.profileImageUrl,
                    username: post.user.username,
                    email: post.user.email,
                  }) && <VerifiedBadge size="sm" />}
                </div>
                <span className="text-sm text-muted-foreground">
                  {post.createdAt && format(new Date(post.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>
          </Link>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeletePost}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-post"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>

        {post.content && (
          <p className="mt-4 whitespace-pre-wrap text-lg">{post.content}</p>
        )}

        {post.media && post.media.length > 0 && (
          <div className="mt-4 space-y-3">
            {post.media.map((media) => (
              <div key={media.id} className="overflow-hidden rounded-lg">
                {media.mediaType === "video" ? (
                  <video
                    src={media.mediaUrl}
                    controls
                    className="w-full max-h-[500px] object-contain bg-black"
                  />
                ) : (
                  <img
                    src={media.mediaUrl}
                    alt="Post media"
                    className="w-full max-h-[500px] object-contain"
                    onClick={() => window.open(media.mediaUrl, "_blank")}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {post.voiceNoteUrl && (
          <div className="mt-4">
            <audio src={post.voiceNoteUrl} controls className="w-full" />
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className="gap-2"
            data-testid="button-like"
          >
            <Heart className={`h-5 w-5 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
            <span className="font-medium">{post.likeCount}</span>
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentCount} comments</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-5 w-5" />
            <span>{post.viewCount || 0} views</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const url = `${window.location.origin}/posts/${post.id}`;
              const shareData = {
                title: "Post on Vibes",
                text: post.content?.substring(0, 100) || "Check out this post on Vibes",
                url: url,
              };
              
              if (navigator.share && navigator.canShare?.(shareData)) {
                try {
                  await navigator.share(shareData);
                } catch (err) {
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
            className="gap-2"
            data-testid="button-share"
          >
            <Share2 className="h-5 w-5" />
            Share
          </Button>
        </div>
      </Card>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Comments ({comments?.length || 0})</h2>

        <form onSubmit={handleSubmitComment} className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback><UserIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={user ? "Write a comment..." : "Log in to comment"}
              disabled={!user || commentMutation.isPending}
              className="min-h-[80px] resize-none"
              data-testid="input-comment"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!comment.trim() || !user || commentMutation.isPending}
                className="gap-2"
                data-testid="button-submit-comment"
              >
                <Send className="h-4 w-4" />
                Post Comment
              </Button>
            </div>
          </div>
        </form>

        {commentsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((c) => (
              <CommentCard key={c.id} comment={c} postId={postId!} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </section>
    </div>
  );
}

function CommentCard({ comment, postId }: { comment: PostComment; postId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/posts/${postId}/comments/${comment.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed.",
      });
    },
  });

  const displayName = comment.user?.username ||
    `${comment.user?.firstName || ""} ${comment.user?.lastName || ""}`.trim() ||
    "Anonymous";

  const isOwner = user?.id === comment.userId;

  return (
    <div className="flex gap-3" data-testid={`comment-${comment.id}`}>
      <Link href={`/profile/${comment.userId}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.user?.profileImageUrl || undefined} />
          <AvatarFallback><UserIcon className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${comment.userId}`}>
              <span className="font-medium hover:underline">{displayName}</span>
            </Link>
            {comment.user && isUserVerified({
              profileImageUrl: comment.user.profileImageUrl,
              username: comment.user.username,
              email: comment.user.email,
            }) && <VerifiedBadge size="sm" />}
            <span className="text-xs text-muted-foreground">
              {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-comment-${comment.id}`}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm">{comment.content}</p>
      </div>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-9 w-32" />
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="aspect-video w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </Card>
    </div>
  );
}
