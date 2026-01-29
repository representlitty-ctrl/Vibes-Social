import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProjectCard } from "@/components/project-card";
import { PostCard } from "@/components/post-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Settings,
  Users,
  MapPin,
  Link as LinkIcon,
  Github,
  Twitter,
  Linkedin,
  Grid3X3,
  UserPlus,
  UserMinus,
  MessageCircle,
  FileText,
  BookOpen,
  User as UserIcon,
  GraduationCap,
  LogOut,
  Award,
  Bot,
} from "lucide-react";
import { VerifiedBadge, isUserVerified } from "@/components/verified-badge";
import { useLocation } from "wouter";
import type { User, Profile, Project } from "@shared/schema";

type ProfileWithUser = Profile & {
  user: User;
  followerCount: number;
  followingCount: number;
  postCount: number;
  projectCount: number;
  isFollowing: boolean;
  isNewsBot?: boolean;
};

type ProjectWithDetails = Project & {
  user: User & { profile: Profile | null };
  upvoteCount: number;
  commentCount: number;
  hasUpvoted: boolean;
};

interface PostUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
  username?: string;
  isNewsBot?: boolean;
}

interface PostMedia {
  id: string;
  postId: string;
  mediaType: string;
  mediaUrl: string;
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
  isLiked: boolean;
  type: "post";
}

interface EnrolledCourse {
  id: string;
  title: string;
  description: string | null;
  instructor: string | null;
  thumbnailUrl: string | null;
  difficulty: string | null;
  duration: string | null;
  lessonCount: number;
  completedLessons: number;
  enrolledAt: string;
}

interface VibecodingProgress {
  completedLessons: string[];
  passedQuizzes: string[];
  hasCertificate: boolean;
  certificateNumber?: string;
  badges: Array<{
    id: string;
    badgeType: string;
    badgeIcon: string;
    earnedAt: string;
  }>;
}

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:id");
  const userId = params?.id;
  const { user: currentUser, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showProfilePicture, setShowProfilePicture] = useState(false);

  const { data: profile, isLoading } = useQuery<ProfileWithUser>({
    queryKey: ["/api/profiles", userId],
    enabled: !!userId,
  });

  const { data: projects } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/users", userId, "projects"],
    enabled: !!userId,
  });

  const { data: posts } = useQuery<Post[]>({
    queryKey: ["/api/users", userId, "posts"],
    enabled: !!userId,
  });

  const { data: enrolledCourses } = useQuery<EnrolledCourse[]>({
    queryKey: ["/api/users", userId, "courses"],
    enabled: !!userId,
  });

  const { data: vibecodingProgress } = useQuery<VibecodingProgress>({
    queryKey: ["/api/users", userId, "vibecoding-progress"],
    enabled: !!userId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (profile?.isFollowing) {
        return apiRequest("DELETE", `/api/users/${userId}/follow`);
      }
      return apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles", userId] });
      toast({
        title: profile?.isFollowing ? "Unfollowed" : "Following",
        description: profile?.isFollowing
          ? "You are no longer following this user"
          : "You are now following this user",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const messageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/conversations", { userId });
    },
    onSuccess: () => {
      setLocation(`/messages?with=${userId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    },
  });

  const handleFollow = () => {
    if (!currentUser) {
      window.location.href = "/api/login";
      return;
    }
    followMutation.mutate();
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <p className="mt-2 text-muted-foreground">
          This user doesn't exist or hasn't set up their profile yet.
        </p>
        <Link href="/">
          <Button className="mt-6">Go back home</Button>
        </Link>
      </div>
    );
  }

  const getInitials = () => {
    if (profile.user.firstName && profile.user.lastName) {
      return `${profile.user.firstName[0]}${profile.user.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  const displayName = profile.username ||
    `${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim() ||
    "Anonymous";

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-2 py-4 md:px-4">
      <Card className="p-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <div 
            className="cursor-pointer"
            onClick={() => {
              if (!profile.isNewsBot && (profile.profileImageUrl || profile.user.profileImageUrl)) {
                setShowProfilePicture(true);
              }
            }}
            data-testid="avatar-profile-clickable"
          >
            {profile.isNewsBot ? (
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-12 w-12 sm:h-16 sm:w-16 text-primary-foreground" />
              </div>
            ) : (
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                <AvatarImage src={profile.profileImageUrl || profile.user.profileImageUrl || undefined} />
                <AvatarFallback>
                  <UserIcon className="h-12 w-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          <Dialog open={showProfilePicture} onOpenChange={setShowProfilePicture}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">
              <img
                src={profile.profileImageUrl || profile.user.profileImageUrl || ""}
                alt={`${profile.username || profile.user.firstName || "User"}'s profile picture`}
                className="w-full h-auto"
                data-testid="img-profile-fullsize"
              />
            </DialogContent>
          </Dialog>

          <div className="flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  {profile.isNewsBot ? (
                    <Badge variant="secondary" className="gap-1">
                      <Bot className="h-3 w-3" />
                      Automated
                    </Badge>
                  ) : (
                    <>
                      {isUserVerified({
                        profileImageUrl: profile.profileImageUrl || profile.user.profileImageUrl,
                        username: profile.username,
                        email: profile.user.email,
                      }) && <VerifiedBadge size="lg" />}
                      {vibecodingProgress?.hasCertificate && (
                        <Badge 
                          variant="secondary" 
                          className="bg-gradient-to-r from-sky-400 to-blue-500 text-white border-0 gap-1"
                          data-testid="badge-vibecoder"
                        >
                          <GraduationCap className="h-3 w-3" />
                          Vibecoder
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                {profile.username && profile.user.firstName && (
                  <p className="text-muted-foreground">
                    {profile.user.firstName} {profile.user.lastName}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {isOwnProfile ? (
                  <>
                    <Link href="/profile/edit">
                      <Button variant="outline" className="gap-2" data-testid="button-edit-profile">
                        <Settings className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        try {
                          logout();
                        } catch (error) {
                          toast({
                            title: "Logout failed",
                            description: "Please try again",
                            variant: "destructive",
                          });
                        }
                      }}
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => messageMutation.mutate()}
                      disabled={messageMutation.isPending}
                      className="gap-2"
                      data-testid="button-message"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                    <Button
                      variant={profile.isFollowing ? "outline" : "default"}
                      onClick={handleFollow}
                      disabled={followMutation.isPending}
                      className="gap-2"
                      data-testid="button-follow"
                    >
                      {profile.isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="mt-4 whitespace-pre-wrap">{profile.bio}</p>
            )}

            {!profile.isNewsBot && (
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-foreground">{profile.postCount}</span> posts
                </div>
                <div className="flex items-center gap-1">
                  <Grid3X3 className="h-4 w-4" />
                  <span className="font-medium text-foreground">{profile.projectCount}</span> projects
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-foreground">{profile.followerCount}</span> followers
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{profile.followingCount}</span> following
                </div>
              </div>
            )}

            {((profile.skills?.length ?? 0) > 0 || (profile.tools?.length ?? 0) > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills?.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
                {profile.tools?.map((tool) => (
                  <Badge key={tool} variant="outline">
                    {tool}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <LinkIcon className="h-4 w-4" />
                  Website
                </a>
              )}
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              )}
              {profile.twitterUrl && (
                <a
                  href={profile.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts" className="gap-2" data-testid="tab-posts">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          {!profile.isNewsBot && (
            <>
              <TabsTrigger value="projects" className="gap-2" data-testid="tab-projects">
                <Grid3X3 className="h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="learning" className="gap-2" data-testid="tab-learning">
                <BookOpen className="h-4 w-4" />
                Learning
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No posts yet</h3>
              <p className="mt-2 text-muted-foreground">
                {isOwnProfile
                  ? "You haven't made any posts yet."
                  : "This user hasn't made any posts yet."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          {projects && projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center" data-testid="empty-state-projects">
              <Grid3X3 className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No projects yet</h3>
              <p className="mt-2 text-muted-foreground">
                {isOwnProfile
                  ? "You haven't submitted any projects yet."
                  : "This user hasn't submitted any projects yet."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="learning" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-4">
              {enrolledCourses && enrolledCourses.length > 0 ? (
                enrolledCourses.map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <Card className="p-4 hover-elevate cursor-pointer">
                      <div className="flex gap-4">
                        {course.thumbnailUrl && (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="h-20 w-32 rounded-md object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{course.title}</h3>
                          {course.instructor && (
                            <p className="text-sm text-muted-foreground">by {course.instructor}</p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            {course.difficulty && (
                              <Badge variant="secondary" className="text-xs">
                                {course.difficulty}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {course.completedLessons} / {course.lessonCount} lessons
                            </span>
                          </div>
                          <div className="mt-2">
                            <Progress 
                              value={course.lessonCount > 0 ? (course.completedLessons / course.lessonCount) * 100 : 0} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
                  <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No courses enrolled</h3>
                  <p className="mt-2 text-muted-foreground">
                    {isOwnProfile
                      ? "You haven't enrolled in any courses yet."
                      : "This user hasn't enrolled in any courses yet."}
                  </p>
                  {isOwnProfile && (
                    <Link href="/learn">
                      <Button className="mt-6">Browse Courses</Button>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Vibes101 Side Panel */}
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Vibes101</h3>
                    <p className="text-xs text-muted-foreground">Learn Vibecoding</p>
                  </div>
                </div>
                
                {vibecodingProgress ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Lessons Completed</span>
                        <span className="font-medium" data-testid="text-lessons-progress">{vibecodingProgress.completedLessons.length} / 23</span>
                      </div>
                      <Progress 
                        value={(vibecodingProgress.completedLessons.length / 23) * 100} 
                        className="h-2"
                        data-testid="progress-lessons"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Quizzes Passed</span>
                        <span className="font-medium" data-testid="text-quizzes-progress">{vibecodingProgress.passedQuizzes.length} / 5</span>
                      </div>
                      <Progress 
                        value={(vibecodingProgress.passedQuizzes.length / 5) * 100} 
                        className="h-2"
                        data-testid="progress-quizzes"
                      />
                    </div>

                    {vibecodingProgress.hasCertificate && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10 text-green-600 dark:text-green-400" data-testid="status-certificate-earned">
                        <GraduationCap className="h-4 w-4" />
                        <span className="text-sm font-medium">Certificate Earned</span>
                      </div>
                    )}

                    {vibecodingProgress.badges && vibecodingProgress.badges.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Badges</p>
                        <div className="flex flex-wrap gap-2">
                          {vibecodingProgress.badges.map((badge) => (
                            <Badge key={badge.id} variant="secondary" className="text-xs" data-testid={`badge-${badge.badgeType}`}>
                              <Award className="h-3 w-3 mr-1" />
                              {badge.badgeType}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {isOwnProfile && vibecodingProgress.completedLessons.length < 23 && (
                      <Link href="/learn/vibecoding">
                        <Button variant="outline" size="sm" className="w-full mt-2" data-testid="button-continue-learning">
                          Continue Learning
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3" data-testid="text-vibecoding-not-started">
                      {isOwnProfile 
                        ? "Start your vibecoding journey!" 
                        : "Not started yet"}
                    </p>
                    {isOwnProfile && (
                      <Link href="/learn/vibecoding">
                        <Button variant="outline" size="sm" data-testid="button-start-learning">
                          Start Learning
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="p-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
          <div className="flex-1 space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-28" />
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
