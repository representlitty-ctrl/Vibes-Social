import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";
import {
  Trophy,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Sparkles,
  ArrowRight,
  Plus,
  FileText,
  Loader2,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  Undo2,
  Flame,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Users } from "lucide-react";
import type { Grant, Project, GrantSubmission } from "@shared/schema";

type GrantApplication = {
  id: string;
  status: string;
  title: string;
};

type GrantUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
  profile?: {
    username: string | null;
  } | null;
};

type GrantWithDetails = Grant & {
  submissionCount: number;
  applicationCount: number;
  hasSubmitted: boolean;
  hasApplied: boolean;
  userSubmission?: GrantSubmission;
  userApplication?: GrantApplication;
  scheduledDeletionAt?: string | null;
  user?: GrantUser;
};

type SubmissionWithDetails = GrantSubmission & {
  user: GrantUser | null;
  project: Project | null;
};

type ProjectForSubmission = Pick<Project, "id" | "title">;

export default function GrantsPage() {
  const { user } = useAuth();

  const { data: grants, isLoading } = useQuery<GrantWithDetails[]>({
    queryKey: ["/api/grants"],
  });

  const openGrants = grants?.filter((g) => g.status === "open");
  const closedGrants = grants?.filter((g) => g.status !== "open");
  
  // Get trending grants sorted by submission and application counts (copy array to avoid mutation)
  const trendingGrants = openGrants
    ? [...openGrants]
        .sort((a, b) => ((b.submissionCount || 0) + (b.applicationCount || 0)) - ((a.submissionCount || 0) + (a.applicationCount || 0)))
        .slice(0, 4)
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-2 py-4 md:px-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grants</h1>
          <p className="text-muted-foreground">
            Submit your projects to grant programs and compete for funding
          </p>
        </div>
        {user && (
          <Link href="/grants/create">
            <Button className="gap-2" data-testid="button-create-grant">
              <Plus className="h-4 w-4" />
              Create Grant
            </Button>
          </Link>
        )}
      </div>

      {/* Trending Grants Section */}
      {trendingGrants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Popular Grants</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {trendingGrants.map((grant) => (
              <div
                key={grant.id}
                onClick={() => {
                  const grantCard = document.querySelector(`[data-grant-id="${grant.id}"]`);
                  grantCard?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                <Card className="flex-shrink-0 w-[250px] p-3 hover-elevate cursor-pointer">
                  {grant.imageUrl && (
                    <div className="aspect-video w-full rounded-md overflow-hidden mb-2 bg-muted">
                      <img src={grant.imageUrl} alt={grant.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h3 className="font-medium text-sm line-clamp-1">{grant.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {(grant.submissionCount || 0) + (grant.applicationCount || 0)} entries
                    </span>
                    {grant.amount && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {grant.amount}
                      </span>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Active Grants</h2>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="mt-3 h-20 w-full" />
                <Skeleton className="mt-4 h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : openGrants && openGrants.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {openGrants.map((grant) => (
              <GrantCard key={grant.id} grant={grant} />
            ))}
          </div>
        ) : (
          <EmptyState type="open" />
        )}
      </section>

      {closedGrants && closedGrants.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Past Grants</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {closedGrants.map((grant) => (
              <GrantCard key={grant.id} grant={grant} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GrantCard({ grant }: { grant: GrantWithDetails }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [applicationTitle, setApplicationTitle] = useState("");
  const [applicationPitch, setApplicationPitch] = useState("");

  const isCreator = user && user.id === grant.userId;

  const { data: projects } = useQuery<ProjectForSubmission[]>({
    queryKey: ["/api/projects/mine"],
    enabled: !!user && open,
  });

  const { data: submissions } = useQuery<SubmissionWithDetails[]>({
    queryKey: ["/api/grants", grant.id, "submissions"],
    enabled: !!isCreator && showSubmissions,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/grants/${grant.id}/submit`, {
        projectId: selectedProject,
      });
    },
    onSuccess: () => {
      setOpen(false);
      setSelectedProject("");
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      toast({
        title: "Project submitted!",
        description: "Your project has been submitted to this grant.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/grants/${grant.id}/apply`, {
        title: applicationTitle,
        pitch: applicationPitch,
      });
    },
    onSuccess: () => {
      setOpen(false);
      setApplicationTitle("");
      setApplicationPitch("");
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      toast({
        title: "Application submitted!",
        description: "Your application has been submitted for review.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/grants/${grant.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      toast({
        title: "Grant scheduled for deletion",
        description: "This grant will be permanently deleted in 24 hours.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule grant deletion.",
        variant: "destructive",
      });
    },
  });

  const cancelDeletionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/grants/${grant.id}/cancel-deletion`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      toast({
        title: "Deletion cancelled",
        description: "The grant will no longer be deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel deletion.",
        variant: "destructive",
      });
    },
  });

  const isOpen = grant.status === "open";
  const isPastDeadline = grant.deadline && new Date(grant.deadline) < new Date();
  const isScheduledForDeletion = grant.scheduledDeletionAt;
  const deletionTime = grant.scheduledDeletionAt ? new Date(grant.scheduledDeletionAt) : null;

  const getStatusBadge = () => {
    if (grant.status === "open") {
      return (
        <Badge variant="default" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Open
        </Badge>
      );
    }
    if (grant.status === "closed") {
      return <Badge variant="secondary">Closed</Badge>;
    }
    if (grant.status === "reviewing") {
      return <Badge variant="outline">Reviewing</Badge>;
    }
    return null;
  };

  const getSubmissionStatus = () => {
    if (grant.userApplication) {
      if (grant.userApplication.status === "approved") {
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <Trophy className="h-3 w-3" />
            Approved!
          </Badge>
        );
      }
      if (grant.userApplication.status === "pending") {
        return <Badge variant="outline">Application Pending</Badge>;
      }
      if (grant.userApplication.status === "rejected") {
        return <Badge variant="secondary">Application Rejected</Badge>;
      }
    }

    if (!grant.userSubmission) return null;
    
    if (grant.userSubmission.isWinner) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <Trophy className="h-3 w-3" />
          Winner!
        </Badge>
      );
    }
    if (grant.userSubmission.status === "pending") {
      return <Badge variant="outline">Submitted</Badge>;
    }
    if (grant.userSubmission.status === "rejected") {
      return <Badge variant="secondary">Not Selected</Badge>;
    }
    return null;
  };

  const hasAlreadyAppliedOrSubmitted = grant.hasApplied || grant.hasSubmitted;

  return (
    <Card className="relative flex flex-col p-6" data-testid={`grant-${grant.id}`} data-grant-id={grant.id}>
      {isScheduledForDeletion && deletionTime && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Scheduled for deletion {formatDistanceToNow(deletionTime, { addSuffix: true })}
            </span>
          </div>
          {user && user.id === grant.userId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cancelDeletionMutation.mutate()}
              disabled={cancelDeletionMutation.isPending}
              className="gap-1"
              data-testid={`button-cancel-deletion-${grant.id}`}
            >
              <Undo2 className="h-3 w-3" />
              Cancel
            </Button>
          )}
        </div>
      )}
      
      {user && user.id === grant.userId && !isScheduledForDeletion && (
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-options-grant-${grant.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowSubmissions(true)}
                data-testid={`button-view-submissions-${grant.id}`}
              >
                <Users className="mr-2 h-4 w-4" />
                View Submissions ({grant.submissionCount})
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteMutation.mutate()}
                className="text-destructive"
                data-testid={`button-delete-grant-${grant.id}`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Grant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{grant.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {getStatusBadge()}
            {getSubmissionStatus()}
          </div>
        </div>
        {grant.amount && (
          <div className="flex items-center gap-1 text-lg font-bold text-primary">
            <DollarSign className="h-5 w-5" />
            {grant.amount}
          </div>
        )}
      </div>

      <p className="mt-4 flex-1 text-sm text-muted-foreground line-clamp-3">
        {grant.description}
      </p>

      {/* Creator info */}
      {grant.user && (
        <Link href={`/profile/${grant.user.id}`} className="mt-4 flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Avatar className="h-6 w-6">
            <AvatarImage src={grant.user.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              <User className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            Created by <span className="font-medium text-foreground">{grant.user.profile?.username || grant.user.firstName || "User"}</span>
          </span>
        </Link>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {grant.deadline && (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {isPastDeadline
              ? `Ended ${format(new Date(grant.deadline), "MMM d, yyyy")}`
              : `Ends ${formatDistanceToNow(new Date(grant.deadline), { addSuffix: true })}`}
          </div>
        )}
        <div className="flex items-center gap-1">
          <Send className="h-4 w-4" />
          {grant.submissionCount} submission{grant.submissionCount !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="mt-4">
        {isOpen && !isPastDeadline ? (
          hasAlreadyAppliedOrSubmitted ? (
            <Button variant="outline" disabled className="w-full gap-2" data-testid={`button-already-applied-${grant.id}`}>
              <CheckCircle className="h-4 w-4" />
              {grant.hasApplied ? "Already Applied" : "Already Submitted"}
            </Button>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    if (!user) {
                      window.location.href = "/api/login";
                    }
                  }}
                  data-testid={`button-apply-grant-${grant.id}`}
                >
                  <ArrowRight className="h-4 w-4" />
                  Apply Now
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Apply to {grant.title}</DialogTitle>
                  <DialogDescription>
                    Submit your application or an existing project.
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="apply" className="mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="apply" className="flex-1 gap-2" data-testid="tab-apply-pitch">
                      <FileText className="h-4 w-4" />
                      Apply with Pitch
                    </TabsTrigger>
                    <TabsTrigger value="project" className="flex-1 gap-2" data-testid="tab-submit-project">
                      <Send className="h-4 w-4" />
                      Submit Project
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="apply" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Project Title</label>
                      <Input
                        placeholder="Your project idea title"
                        value={applicationTitle}
                        onChange={(e) => setApplicationTitle(e.target.value)}
                        data-testid="input-application-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Pitch <span className="text-muted-foreground text-xs">(optional)</span></label>
                      <Textarea
                        placeholder="Describe your project idea, what you want to build, and why you'd be a great fit for this grant..."
                        value={applicationPitch}
                        onChange={(e) => setApplicationPitch(e.target.value)}
                        className="min-h-[150px] resize-none"
                        data-testid="input-application-pitch"
                      />
                    </div>
                    <Button
                      onClick={() => applyMutation.mutate()}
                      disabled={!applicationTitle || applyMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-apply"
                    >
                      {applyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Application
                    </Button>
                  </TabsContent>

                  <TabsContent value="project" className="space-y-4 mt-4">
                    {projects && projects.length > 0 ? (
                      <>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                          <SelectTrigger data-testid="select-project">
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => submitMutation.mutate()}
                          disabled={!selectedProject || submitMutation.isPending}
                          className="w-full"
                          data-testid="button-confirm-submit"
                        >
                          {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Submit Project
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">
                          You don't have any projects yet.
                        </p>
                        <Link href="/submit">
                          <Button className="mt-4">Create a Project</Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )
        ) : (
          <Button variant="outline" disabled className="w-full">
            {isPastDeadline ? "Deadline Passed" : "Grant Closed"}
          </Button>
        )}
      </div>

      {/* Submissions Dialog for Grant Creator */}
      <Dialog open={showSubmissions} onOpenChange={setShowSubmissions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Submissions for {grant.title}</DialogTitle>
            <DialogDescription>
              {grant.submissionCount} project{grant.submissionCount !== 1 ? "s" : ""} submitted
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {submissions && submissions.length > 0 ? (
              submissions.map((submission) => (
                <Card key={submission.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <Link href={`/profile/${submission.user?.id}`}>
                      <Avatar className="h-10 w-10 cursor-pointer">
                        <AvatarImage src={submission.user?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/profile/${submission.user?.id}`}>
                          <span className="font-medium hover:underline cursor-pointer">
                            {submission.user?.profile?.username || submission.user?.firstName || "User"}
                          </span>
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {submission.createdAt && formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {submission.project && (
                        <Link href={`/project/${submission.project.id}`}>
                          <div className="mt-2 p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer">
                            <h4 className="font-medium">{submission.project.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {submission.project.description}
                            </p>
                          </div>
                        </Link>
                      )}
                      <div className="mt-2">
                        <Badge variant={submission.status === "pending" ? "outline" : submission.isWinner ? "default" : "secondary"}>
                          {submission.isWinner ? "Winner" : submission.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No submissions yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function EmptyState({ type }: { type: "open" | "all" }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Trophy className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">
        {type === "open" ? "No active grants" : "No grants yet"}
      </h3>
      <p className="mt-2 max-w-sm text-muted-foreground">
        {type === "open"
          ? "Check back later for new grant opportunities."
          : "Grant programs will appear here."}
      </p>
    </div>
  );
}
