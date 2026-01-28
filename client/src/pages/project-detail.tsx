import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmojiReactions } from "@/components/emoji-reactions";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { useState, useEffect } from "react";
import {
  ChevronUp,
  ExternalLink,
  Github,
  ArrowLeft,
  MessageCircle,
  Send,
  Edit,
  Trash2,
  User as UserIcon,
  Eye,
  Share2,
} from "lucide-react";
import type { Project, User, Profile, ProjectComment } from "@shared/schema";

type ProjectWithDetails = Project & {
  user: User & { profile: Profile | null };
  upvoteCount: number;
  commentCount: number;
  hasUpvoted: boolean;
};

type CommentWithUser = ProjectComment & {
  user: User & { profile: Profile | null };
};

export default function ProjectDetailPage() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: project, isLoading } = useQuery<ProjectWithDetails>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  useEffect(() => {
    if (projectId) {
      apiRequest("POST", `/api/projects/${projectId}/view`).catch(() => {});
    }
  }, [projectId]);

  const { data: comments, isLoading: commentsLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/projects", projectId, "comments"],
    enabled: !!projectId,
  });

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      if (project?.hasUpvoted) {
        return apiRequest("DELETE", `/api/projects/${projectId}/upvote`);
      }
      return apiRequest("POST", `/api/projects/${projectId}/upvote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/projects/${projectId}/comments`, { content });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
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

  const [, setLocation] = useLocation();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/projects"] });
      await queryClient.cancelQueries({ queryKey: ["/api/feed"] });
      await queryClient.cancelQueries({ queryKey: ["/api/projects/featured"] });

      // Snapshot previous values
      const previousProjects = queryClient.getQueryData(["/api/projects"]);
      const previousFeed = queryClient.getQueryData(["/api/feed"]);
      const previousFeatured = queryClient.getQueryData(["/api/projects/featured"]);

      // Optimistically remove from cache
      queryClient.setQueryData(["/api/projects"], (old: Array<{ id: string }> | undefined) => 
        old ? old.filter(p => p.id !== projectId) : []
      );
      queryClient.setQueryData(["/api/feed"], (old: Array<{ id: string }> | undefined) => 
        old ? old.filter(item => item.id !== projectId) : []
      );
      queryClient.setQueryData(["/api/projects/featured"], (old: Array<{ id: string }> | undefined) => 
        old ? old.filter(p => p.id !== projectId) : []
      );

      return { previousProjects, previousFeed, previousFeatured };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/featured"] });
      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully.",
      });
      setLocation("/");
    },
    onError: (_err, _vars, context) => {
      // Restore cache on error
      if (context?.previousProjects) {
        queryClient.setQueryData(["/api/projects"], context.previousProjects);
      }
      if (context?.previousFeed) {
        queryClient.setQueryData(["/api/feed"], context.previousFeed);
      }
      if (context?.previousFeatured) {
        queryClient.setQueryData(["/api/projects/featured"], context.previousFeatured);
      }
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProject = () => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const handleUpvote = () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    upvoteMutation.mutate();
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
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <p className="mt-2 text-muted-foreground">
          The project you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/">
          <Button className="mt-6">Go back home</Button>
        </Link>
      </div>
    );
  }

  const getInitials = (u: User) => {
    if (u.firstName && u.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  const displayName = project.user.profile?.username ||
    `${project.user.firstName || ""} ${project.user.lastName || ""}`.trim() ||
    "Anonymous";

  const isOwner = user?.id === project.userId;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/">
        <Button variant="ghost" className="gap-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Button>
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          {project.imageUrl && (
            <div className="overflow-hidden rounded-xl">
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full object-cover"
              />
            </div>
          )}

          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              {isOwner && (
                <div className="flex gap-2">
                  <Link href={`/projects/${project.id}/edit`}>
                    <Button variant="outline" size="icon" data-testid="button-edit-project">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDeleteProject}
                    disabled={deleteMutation.isPending}
                    data-testid="button-delete-project"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link href={`/profile/${project.userId}`}>
                <div className="flex items-center gap-2 hover-elevate rounded-full pr-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={project.user.profileImageUrl || undefined} />
                    <AvatarFallback><UserIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{displayName}</span>
                </div>
              </Link>

              <span className="text-sm text-muted-foreground">
                {project.createdAt && format(new Date(project.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>

            {project.tags && project.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-muted-foreground">{project.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2" data-testid="button-demo">
                  <ExternalLink className="h-4 w-4" />
                  Live Demo
                </Button>
              </a>
            )}
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2" data-testid="button-github">
                  <Github className="h-4 w-4" />
                  View Code
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="lg:w-64">
          <Card className="sticky top-6 p-4">
            <Button
              variant={project.hasUpvoted ? "default" : "outline"}
              className="w-full gap-2"
              onClick={handleUpvote}
              disabled={upvoteMutation.isPending}
              data-testid="button-upvote-detail"
            >
              <ChevronUp className="h-5 w-5" />
              <span className="font-bold">{project.upvoteCount}</span>
              <span>Upvote{project.upvoteCount !== 1 ? "s" : ""}</span>
            </Button>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {project.commentCount} comment{project.commentCount !== 1 ? "s" : ""}
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {project.viewCount || 0} view{(project.viewCount || 0) !== 1 ? "s" : ""}
            </div>

            <Button
              variant="outline"
              className="w-full mt-4 gap-2"
              onClick={async () => {
                const url = `${window.location.origin}/projects/${project.id}`;
                const shareData = {
                  title: project.name,
                  text: project.tagline || `Check out ${project.name} on Vibes`,
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
                        description: "Project link copied to clipboard",
                      });
                    }
                  }
                } else {
                  navigator.clipboard.writeText(url);
                  toast({
                    title: "Link copied",
                    description: "Project link copied to clipboard",
                  });
                }
              }}
              data-testid="button-share-detail"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Reactions</p>
              <EmojiReactions targetType="project" targetId={project.id} />
            </div>
          </Card>
        </div>
      </div>

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
              <CommentCard key={c.id} comment={c} projectId={projectId!} />
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

function CommentCard({ comment, projectId }: { comment: CommentWithUser; projectId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/projects/${projectId}/comments/${comment.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed.",
      });
    },
  });

  const getInitials = () => {
    if (comment.user.firstName && comment.user.lastName) {
      return `${comment.user.firstName[0]}${comment.user.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  const displayName = comment.user.profile?.username ||
    `${comment.user.firstName || ""} ${comment.user.lastName || ""}`.trim() ||
    "Anonymous";

  const isOwner = user?.id === comment.userId;

  return (
    <div className="flex gap-3" data-testid={`comment-${comment.id}`}>
      <Link href={`/profile/${comment.userId}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.user.profileImageUrl || undefined} />
          <AvatarFallback><UserIcon className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${comment.userId}`}>
              <span className="font-medium hover:underline">{displayName}</span>
            </Link>
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
        <EmojiReactions targetType="comment" targetId={comment.id} className="mt-2" />
      </div>
    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-9 w-40" />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="lg:w-64">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
