import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GraduationCap,
  BookOpen,
  Play,
  CheckCircle,
  Lock,
  Award,
  Trophy,
  Sparkles,
  ChevronRight,
  User as UserIcon,
  Clock,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const VIBECODING_SYLLABUS = [
  {
    id: "module-1",
    title: "Introduction to Vibecoding",
    description: "Understanding what vibecoding is and why it's revolutionizing software development",
    lessons: [
      { id: "1-1", title: "What is Vibecoding?", duration: "5 min", type: "video" },
      { id: "1-2", title: "The Rise of AI-Assisted Development", duration: "8 min", type: "article" },
      { id: "1-3", title: "Vibecoding vs Traditional Coding", duration: "6 min", type: "video" },
      { id: "1-4", title: "Setting Up Your Vibecoding Environment", duration: "10 min", type: "hands-on" },
    ],
    quizCount: 5,
  },
  {
    id: "module-2",
    title: "AI Tools & Assistants",
    description: "Master the essential AI tools that power vibecoding workflows",
    lessons: [
      { id: "2-1", title: "Introduction to AI Code Assistants", duration: "7 min", type: "video" },
      { id: "2-2", title: "Working with Claude, GPT, and Other LLMs", duration: "12 min", type: "article" },
      { id: "2-3", title: "Prompt Engineering for Developers", duration: "15 min", type: "video" },
      { id: "2-4", title: "Code Generation Best Practices", duration: "10 min", type: "hands-on" },
      { id: "2-5", title: "Debugging with AI Assistance", duration: "8 min", type: "video" },
    ],
    quizCount: 6,
  },
  {
    id: "module-3",
    title: "The Vibecoding Workflow",
    description: "Learn the complete workflow from idea to deployed application",
    lessons: [
      { id: "3-1", title: "Ideation and Planning with AI", duration: "8 min", type: "video" },
      { id: "3-2", title: "Rapid Prototyping Techniques", duration: "12 min", type: "hands-on" },
      { id: "3-3", title: "Iterative Development with AI Feedback", duration: "10 min", type: "video" },
      { id: "3-4", title: "Version Control and AI Collaboration", duration: "7 min", type: "article" },
      { id: "3-5", title: "Testing AI-Generated Code", duration: "9 min", type: "video" },
    ],
    quizCount: 5,
  },
  {
    id: "module-4",
    title: "Building Real Projects",
    description: "Apply vibecoding to build complete, production-ready applications",
    lessons: [
      { id: "4-1", title: "Project: Building a Portfolio Website", duration: "25 min", type: "project" },
      { id: "4-2", title: "Project: Creating a REST API", duration: "30 min", type: "project" },
      { id: "4-3", title: "Project: Full-Stack Social App", duration: "45 min", type: "project" },
      { id: "4-4", title: "Deploying Your Vibecoded Projects", duration: "12 min", type: "video" },
    ],
    quizCount: 4,
  },
  {
    id: "module-5",
    title: "Advanced Vibecoding Techniques",
    description: "Take your skills to the next level with advanced strategies",
    lessons: [
      { id: "5-1", title: "Multi-Agent Workflows", duration: "15 min", type: "video" },
      { id: "5-2", title: "Custom AI Tool Development", duration: "20 min", type: "hands-on" },
      { id: "5-3", title: "AI-Powered Code Review", duration: "10 min", type: "article" },
      { id: "5-4", title: "Scaling AI-Assisted Development Teams", duration: "12 min", type: "video" },
      { id: "5-5", title: "The Future of Vibecoding", duration: "8 min", type: "video" },
    ],
    quizCount: 6,
  },
];

const TOTAL_LESSONS = VIBECODING_SYLLABUS.reduce((acc, m) => acc + m.lessons.length, 0);
const TOTAL_QUIZZES = VIBECODING_SYLLABUS.reduce((acc, m) => acc + m.quizCount, 0);

interface UserProgress {
  completedLessons: string[];
  passedQuizzes: string[];
  hasCertificate: boolean;
  certificateNumber?: string;
  badges: Array<{
    id: string;
    badgeName: string;
    badgeIcon: string;
    earnedAt: string;
  }>;
}

export default function LearnVibecodingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeModule, setActiveModule] = useState<string | null>("module-1");

  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress>({
    queryKey: ["/api/users", user?.id, "vibecoding-progress"],
    queryFn: async () => {
      return {
        completedLessons: [],
        passedQuizzes: [],
        hasCertificate: false,
        badges: [],
      };
    },
    enabled: !!user,
  });

  const { data: certificates } = useQuery<any[]>({
    queryKey: ["/api/users", user?.id, "certificates"],
    enabled: !!user,
  });

  const { data: badges } = useQuery<any[]>({
    queryKey: ["/api/users", user?.id, "badges"],
    enabled: !!user,
  });

  const completedLessonsCount = progress?.completedLessons?.length || 0;
  const progressPercentage = Math.round((completedLessonsCount / TOTAL_LESSONS) * 100);

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="h-4 w-4" />;
      case "article":
        return <BookOpen className="h-4 w-4" />;
      case "hands-on":
        return <Sparkles className="h-4 w-4" />;
      case "project":
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getLessonBadge = (type: string) => {
    switch (type) {
      case "video":
        return <Badge variant="secondary">Video</Badge>;
      case "article":
        return <Badge variant="outline">Article</Badge>;
      case "hands-on":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Hands-on</Badge>;
      case "project":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Project</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress?.completedLessons?.includes(lessonId) || false;
  };

  const vibecodingCertificates = certificates?.filter(c => 
    c.course?.category === "Vibecoding" || c.course?.title?.toLowerCase().includes("vibecoding")
  ) || [];

  const vibecodingBadges = badges?.filter(b => 
    b.badgeType === "course_completion" || b.badgeType === "vibecoding"
  ) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Learn Vibecoding</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Master the art of AI-assisted development. Complete the curriculum, pass all quizzes, 
            and earn your official Vibecoder Certificate and Badge.
          </p>
        </div>
        {user && (
          <Card className="min-w-[200px]">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Your Progress</span>
              </div>
              <Progress value={progressPercentage} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                {completedLessonsCount} of {TOTAL_LESSONS} lessons completed
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Syllabus
              </CardTitle>
              <CardDescription>
                {VIBECODING_SYLLABUS.length} modules, {TOTAL_LESSONS} lessons, {TOTAL_QUIZZES} quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion 
                type="single" 
                collapsible 
                value={activeModule || undefined}
                onValueChange={(value) => setActiveModule(value)}
              >
                {VIBECODING_SYLLABUS.map((module, moduleIndex) => {
                  const moduleCompleted = module.lessons.every(l => isLessonCompleted(l.id));
                  const lessonsCompleted = module.lessons.filter(l => isLessonCompleted(l.id)).length;
                  
                  return (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                            moduleCompleted 
                              ? "bg-green-500 text-white" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {moduleCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              moduleIndex + 1
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{module.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {module.lessons.length} lessons • {module.quizCount} quizzes
                              {lessonsCompleted > 0 && (
                                <span className="ml-2 text-green-600">
                                  ({lessonsCompleted}/{module.lessons.length} completed)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground mb-4 pl-11">
                          {module.description}
                        </p>
                        <div className="space-y-2 pl-11">
                          {module.lessons.map((lesson, lessonIndex) => {
                            const completed = isLessonCompleted(lesson.id);
                            return (
                              <div
                                key={lesson.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border ${
                                  completed 
                                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" 
                                    : "bg-card hover-elevate"
                                }`}
                                data-testid={`lesson-${lesson.id}`}
                              >
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                                  completed 
                                    ? "bg-green-500 text-white" 
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {completed ? (
                                    <CheckCircle className="h-3 w-3" />
                                  ) : (
                                    lessonIndex + 1
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{lesson.title}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {getLessonBadge(lesson.type)}
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {lesson.duration}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant={completed ? "outline" : "default"}
                                  size="sm"
                                  className="gap-1"
                                  data-testid={`start-lesson-${lesson.id}`}
                                >
                                  {completed ? "Review" : "Start"}
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                          
                          <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed bg-muted/50">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                              <Star className="h-3 w-3 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">Module Quiz</div>
                              <div className="text-xs text-muted-foreground">
                                {module.quizCount} questions to test your knowledge
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="gap-1">
                              Take Quiz
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-5 w-5 text-amber-500" />
                Certificate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vibecodingCertificates.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                    <Award className="h-8 w-8 text-amber-500" />
                    <div>
                      <div className="font-medium text-sm">Vibecoder Certified</div>
                      <div className="text-xs text-muted-foreground">
                        Earned on {new Date(vibecodingCertificates[0].earnedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Certificate
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete all lessons and pass all quizzes to earn your Vibecoder Certificate
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-5 w-5 text-primary" />
                Badges Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vibecodingBadges.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {vibecodingBadges.map((badge) => (
                    <div 
                      key={badge.id} 
                      className="flex flex-col items-center p-2 rounded-lg bg-muted/50 text-center"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mb-1">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs font-medium line-clamp-2">
                        {badge.badgeName}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Complete modules to earn badges
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">What You'll Learn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Use AI assistants effectively for coding</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Master prompt engineering for developers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Build complete projects with AI assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Deploy production-ready applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Advanced multi-agent workflows</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {!user && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <GraduationCap className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Ready to Start?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to track your progress and earn your certificate
                  </p>
                  <Button 
                    onClick={() => window.location.href = "/api/login"}
                    className="w-full"
                    data-testid="button-signin-learn"
                  >
                    Sign In to Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
