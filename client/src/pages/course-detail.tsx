import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  Users,
  PlayCircle,
  CheckCircle,
  Circle,
  Video,
  FileText,
  User as UserIcon,
  Lock,
} from "lucide-react";
import type { Course, CourseLesson } from "@shared/schema";

type CourseWithDetails = Course & {
  instructor: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profileImageUrl: string | null;
    username: string | null;
  } | null;
  lessons: CourseLesson[];
  lessonCount: number;
  enrollmentCount: number;
  isEnrolled: boolean;
  completedLessons: string[];
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery<CourseWithDetails>({
    queryKey: ["/api/courses", id],
    enabled: !!id,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (course?.isEnrolled) {
        return apiRequest("DELETE", `/api/courses/${id}/enroll`);
      }
      return apiRequest("POST", `/api/courses/${id}/enroll`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/enrolled"] });
      toast({
        title: course?.isEnrolled ? "Unenrolled" : "Enrolled",
        description: course?.isEnrolled
          ? "You have been unenrolled from the course"
          : "You have been enrolled in the course",
      });
    },
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return apiRequest("POST", `/api/lessons/${lessonId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/enrolled"] });
      toast({
        title: "Lesson completed",
        description: "Keep up the great work!",
      });
    },
  });

  const handleEnroll = () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    enrollMutation.mutate();
  };

  const handleCompleteLesson = (lessonId: string) => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    completeLessonMutation.mutate(lessonId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Course not found</h2>
        <p className="mt-2 text-muted-foreground">
          The course you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/learn">
          <Button className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Learning Hub
          </Button>
        </Link>
      </div>
    );
  }

  const instructorName = course.instructor
    ? course.instructor.username || 
      [course.instructor.firstName, course.instructor.lastName].filter(Boolean).join(" ") ||
      course.instructor.email.split("@")[0]
    : "Unknown";

  const instructorInitials = instructorName.slice(0, 2).toUpperCase();
  const completedCount = course.completedLessons?.length || 0;
  const progressPercentage = course.lessonCount > 0 
    ? Math.round((completedCount / course.lessonCount) * 100) 
    : 0;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Link href="/learn">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Course Details</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {course.imageUrl ? (
            <div className="aspect-video overflow-hidden rounded-lg">
              <img
                src={course.imageUrl}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
              <GraduationCap className="h-20 w-20 text-primary/40" />
            </div>
          )}

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{course.category}</Badge>
              {course.difficulty && (
                <Badge variant="outline" className={difficultyColors[course.difficulty] || ""}>
                  {course.difficulty}
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-bold">{course.title}</h2>
            <p className="mt-3 text-muted-foreground">{course.description}</p>
          </div>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Course Content</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {course.lessonCount} lessons {course.duration && `• ${course.duration}`}
            </p>
            
            {course.lessons && course.lessons.length > 0 ? (
              <div className="space-y-2">
                {course.lessons.map((lesson, index) => {
                  const isCompleted = course.completedLessons?.includes(lesson.id);
                  // Lesson is unlocked if it's the first one or all previous lessons are completed
                  const isUnlocked = index === 0 || 
                    course.lessons.slice(0, index).every((l: CourseLesson) => 
                      course.completedLessons?.includes(l.id)
                    );
                  const isLocked = !isUnlocked && !isCompleted;
                  
                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        isCompleted 
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                          : isLocked
                          ? "bg-muted/30 border-muted opacity-60"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                        isCompleted 
                          ? "bg-green-500 text-white"
                          : isLocked
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/20 text-primary"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : isLocked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {lesson.videoUrl ? (
                            <Video className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={`font-medium ${isLocked ? "text-muted-foreground" : ""}`}>
                            {lesson.title}
                          </span>
                        </div>
                        {lesson.duration && (
                          <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                        )}
                      </div>
                      {course.isEnrolled && (
                        isLocked ? (
                          <Button
                            variant="outline"
                            size="icon"
                            disabled
                            data-testid={`button-complete-lesson-${lesson.id}`}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => !isCompleted && handleCompleteLesson(lesson.id)}
                            disabled={isCompleted || completeLessonMutation.isPending}
                            data-testid={`button-complete-lesson-${lesson.id}`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No lessons available yet.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-4">
              <Link href={`/profile/${course.instructor?.id}`}>
                <Avatar className="h-12 w-12 cursor-pointer">
                  <AvatarImage src={course.instructor?.profileImageUrl || undefined} />
                  <AvatarFallback><UserIcon className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <p className="text-sm text-muted-foreground">Instructor</p>
                <Link href={`/profile/${course.instructor?.id}`}>
                  <p className="font-semibold hover:underline">{instructorName}</p>
                </Link>
              </div>
            </div>

            <div className="mb-6 space-y-3 border-t pt-4">
              <div className="flex items-center gap-2 text-sm">
                <PlayCircle className="h-4 w-4 text-muted-foreground" />
                <span>{course.lessonCount} lessons</span>
              </div>
              {course.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{course.duration}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{course.enrollmentCount} enrolled</span>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              variant={course.isEnrolled ? "secondary" : "default"}
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              data-testid="button-enroll"
            >
              {course.isEnrolled ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Enrolled
                </>
              ) : (
                "Enroll Now"
              )}
            </Button>
          </Card>

          {course.isEnrolled && (
            <Card className="p-6">
              <h3 className="mb-3 font-semibold">Your Progress</h3>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="mt-2 text-sm text-muted-foreground">
                {completedCount} of {course.lessonCount} lessons completed
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
