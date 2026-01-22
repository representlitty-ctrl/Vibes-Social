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
} from "lucide-react";
import type { Grant, Project, GrantSubmission } from "@shared/schema";

type GrantApplication = {
  id: string;
  status: string;
  title: string;
};

type GrantWithDetails = Grant & {
  submissionCount: number;
  applicationCount: number;
  hasSubmitted: boolean;
  hasApplied: boolean;
  userSubmission?: GrantSubmission;
  userApplication?: GrantApplication;
};

type ProjectForSubmission = Pick<Project, "id" | "title">;

export default function GrantsPage() {
  const { user } = useAuth();

  const { data: grants, isLoading } = useQuery<GrantWithDetails[]>({
    queryKey: ["/api/grants"],
  });

  const openGrants = grants?.filter((g) => g.status === "open");
  const closedGrants = grants?.filter((g) => g.status !== "open");

  return (
    <div className="space-y-8">
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
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [applicationTitle, setApplicationTitle] = useState("");
  const [applicationPitch, setApplicationPitch] = useState("");

  const { data: projects } = useQuery<ProjectForSubmission[]>({
    queryKey: ["/api/projects/mine"],
    enabled: !!user && open,
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

  const isOpen = grant.status === "open";
  const isPastDeadline = grant.deadline && new Date(grant.deadline) < new Date();

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
    <Card className="flex flex-col p-6" data-testid={`grant-${grant.id}`}>
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
                      <label className="text-sm font-medium">Your Pitch</label>
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
                      disabled={!applicationTitle || !applicationPitch || applicationPitch.length < 50 || applyMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-apply"
                    >
                      {applyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Application
                    </Button>
                    {applicationPitch && applicationPitch.length < 50 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Pitch must be at least 50 characters
                      </p>
                    )}
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
