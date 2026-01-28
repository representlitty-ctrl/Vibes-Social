import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  BookOpen,
  ExternalLink,
  ChevronUp,
  Bookmark,
  BookmarkCheck,
  Search,
  Sparkles,
  Plus,
  GraduationCap,
  Clock,
  Users,
  PlayCircle,
  CheckCircle,
  User as UserIcon,
} from "lucide-react";
import type { Resource, User, Profile, Course } from "@shared/schema";

type ResourceWithDetails = Resource & {
  upvoteCount: number;
  hasUpvoted: boolean;
  hasBookmarked: boolean;
};

type CourseWithDetails = Course & {
  instructor: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profileImageUrl: string | null;
    username: string | null;
  } | null;
  lessonCount: number;
  enrollmentCount: number;
  isEnrolled: boolean;
  progress?: number;
  completedCount?: number;
};

const categories = ["All", "Tutorial", "Course", "Article", "Tool", "Video"];
const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function LearnPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: resources, isLoading: resourcesLoading } = useQuery<ResourceWithDetails[]>({
    queryKey: ["/api/resources"],
  });

  const { data: courses, isLoading: coursesLoading } = useQuery<CourseWithDetails[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrolledCourses } = useQuery<CourseWithDetails[]>({
    queryKey: ["/api/courses/enrolled"],
    enabled: !!user,
  });

  const { data: bookmarkedResources } = useQuery<ResourceWithDetails[]>({
    queryKey: ["/api/resources/bookmarked"],
    enabled: !!user,
  });

  const filteredResources = resources?.filter((resource) => {
    const matchesSearch = !searchQuery ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredCourses = courses?.filter((course) => {
    const matchesSearch = !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learning Hub</h1>
          <p className="text-muted-foreground">Curated resources and courses to level up your vibecoding skills</p>
        </div>
        {user && (
          <Link href="/learn/submit">
            <Button className="gap-2" data-testid="button-submit-resource">
              <Plus className="h-4 w-4" />
              Submit Resource
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses and resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-resources"
          />
        </div>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="resources">All Resources</TabsTrigger>
          {user && (
            <TabsTrigger value="enrolled" className="gap-2">
              <PlayCircle className="h-4 w-4" />
              My Learning
            </TabsTrigger>
          )}
          {user && (
            <TabsTrigger value="bookmarked">
              <Bookmark className="mr-2 h-4 w-4" />
              Saved
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="courses" className="mt-6 space-y-6">
          {coursesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-40 w-full rounded-lg" />
                  <Skeleton className="mt-3 h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </Card>
              ))}
            </div>
          ) : filteredCourses && filteredCourses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyCourseState />
          )}
        </TabsContent>

        <TabsContent value="resources" className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
                data-testid={`category-${category.toLowerCase()}`}
              >
                {category}
              </Badge>
            ))}
          </div>

          {resourcesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="mt-3 h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-2/3" />
                </Card>
              ))}
            </div>
          ) : filteredResources && filteredResources.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        <TabsContent value="enrolled" className="mt-6">
          {enrolledCourses && enrolledCourses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} showProgress />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
              <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No enrolled courses</h3>
              <p className="mt-2 text-muted-foreground">
                Browse courses and enroll to start learning.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarked" className="mt-6">
          {bookmarkedResources && bookmarkedResources.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bookmarkedResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
              <Bookmark className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No saved resources</h3>
              <p className="mt-2 text-muted-foreground">
                Bookmark resources to save them for later.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CourseCard({ course, showProgress }: { course: CourseWithDetails; showProgress?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (course.isEnrolled) {
        return apiRequest("DELETE", `/api/courses/${course.id}/enroll`);
      }
      return apiRequest("POST", `/api/courses/${course.id}/enroll`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/enrolled"] });
      toast({
        title: course.isEnrolled ? "Unenrolled" : "Enrolled",
        description: course.isEnrolled
          ? "You have been unenrolled from the course"
          : "You have been enrolled in the course",
      });
    },
  });

  const handleEnroll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    enrollMutation.mutate();
  };

  const instructorName = course.instructor
    ? course.instructor.username || 
      [course.instructor.firstName, course.instructor.lastName].filter(Boolean).join(" ") ||
      course.instructor.email.split("@")[0]
    : "Unknown";

  const instructorInitials = instructorName.slice(0, 2).toUpperCase();

  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="group flex flex-col overflow-hidden transition-all hover-elevate" data-testid={`course-${course.id}`}>
        {course.imageUrl ? (
          <div className="relative aspect-video overflow-hidden">
            <img
              src={course.imageUrl}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {course.isFeatured && (
              <Badge className="absolute right-2 top-2 gap-1">
                <Sparkles className="h-3 w-3" />
                Featured
              </Badge>
            )}
          </div>
        ) : (
          <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <GraduationCap className="h-12 w-12 text-primary/40" />
            {course.isFeatured && (
              <Badge className="absolute right-2 top-2 gap-1">
                <Sparkles className="h-3 w-3" />
                Featured
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {course.category}
            </Badge>
            {course.difficulty && (
              <Badge variant="outline" className={`text-xs ${difficultyColors[course.difficulty] || ""}`}>
                {course.difficulty}
              </Badge>
            )}
          </div>

          <h3 className="font-semibold line-clamp-2">{course.title}</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={course.instructor?.profileImageUrl || undefined} />
              <AvatarFallback><UserIcon className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{instructorName}</span>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <PlayCircle className="h-3 w-3" />
              {course.lessonCount} lessons
            </div>
            {course.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.duration}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {course.enrollmentCount}
            </div>
          </div>

          {showProgress && course.progress !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
              {course.completedCount !== undefined && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {course.completedCount} of {course.lessonCount} lessons completed
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <Button
              variant={course.isEnrolled ? "secondary" : "default"}
              size="sm"
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="gap-1"
              data-testid={`button-enroll-${course.id}`}
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
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ResourceCard({ resource }: { resource: ResourceWithDetails }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      if (resource.hasUpvoted) {
        return apiRequest("DELETE", `/api/resources/${resource.id}/upvote`);
      }
      return apiRequest("POST", `/api/resources/${resource.id}/upvote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (resource.hasBookmarked) {
        return apiRequest("DELETE", `/api/resources/${resource.id}/bookmark`);
      }
      return apiRequest("POST", `/api/resources/${resource.id}/bookmark`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources/bookmarked"] });
      toast({
        title: resource.hasBookmarked ? "Removed from saved" : "Saved",
        description: resource.hasBookmarked
          ? "Resource removed from your saved list"
          : "Resource saved to your list",
      });
    },
  });

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    upvoteMutation.mutate();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    bookmarkMutation.mutate();
  };

  return (
    <Card className="group flex flex-col p-4 transition-all hover-elevate" data-testid={`resource-${resource.id}`}>
      {resource.imageUrl && (
        <div className="mb-3 overflow-hidden rounded-lg">
          <img
            src={resource.imageUrl}
            alt={resource.title}
            className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <Badge variant="secondary" className="mb-2">
          {resource.category}
        </Badge>
        {resource.isFeatured && (
          <Badge variant="default" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Featured
          </Badge>
        )}
      </div>

      <h3 className="font-semibold line-clamp-2">{resource.title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">
        {resource.description}
      </p>

      {resource.tags && resource.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {resource.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={resource.hasUpvoted ? "default" : "outline"}
            size="sm"
            onClick={handleUpvote}
            disabled={upvoteMutation.isPending}
            className="gap-1"
            data-testid={`button-upvote-resource-${resource.id}`}
          >
            <ChevronUp className="h-4 w-4" />
            {resource.upvoteCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={bookmarkMutation.isPending}
            data-testid={`button-bookmark-${resource.id}`}
          >
            {resource.hasBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-visit-${resource.id}`}>
            <ExternalLink className="h-4 w-4" />
            Visit
          </Button>
        </a>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <BookOpen className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">No resources found</h3>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Check back later for curated learning resources.
      </p>
    </div>
  );
}

function EmptyCourseState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <GraduationCap className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">No courses available</h3>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Courses are coming soon. Check back later for vibecoding courses.
      </p>
    </div>
  );
}
