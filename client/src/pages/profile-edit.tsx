import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect } from "react";
import type { Profile } from "@shared/schema";

const editProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30).optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().or(z.literal("")),
  skills: z.string().optional(),
  tools: z.string().optional(),
  twitterUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

export default function ProfileEditPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      username: "",
      bio: "",
      skills: "",
      tools: "",
      twitterUrl: "",
      githubUrl: "",
      websiteUrl: "",
      linkedinUrl: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        username: profile.username || "",
        bio: profile.bio || "",
        skills: profile.skills?.join(", ") || "",
        tools: profile.tools?.join(", ") || "",
        twitterUrl: profile.twitterUrl || "",
        githubUrl: profile.githubUrl || "",
        websiteUrl: profile.websiteUrl || "",
        linkedinUrl: profile.linkedinUrl || "",
      });
    }
  }, [profile, form]);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, authLoading]);

  const mutation = useMutation({
    mutationFn: async (data: EditProfileForm) => {
      const skills = data.skills
        ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const tools = data.tools
        ? data.tools.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      return apiRequest("PUT", "/api/profile", {
        username: data.username || null,
        bio: data.bio || null,
        skills,
        tools,
        twitterUrl: data.twitterUrl || null,
        githubUrl: data.githubUrl || null,
        websiteUrl: data.websiteUrl || null,
        linkedinUrl: data.linkedinUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been saved.",
      });
      setLocation(`/profile/${user?.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditProfileForm) => {
    mutation.mutate(data);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href={user ? `/profile/${user.id}` : "/"}>
        <Button variant="ghost" className="gap-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your profile information to help others discover you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="yourname"
                        {...field}
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormDescription>
                      Your unique username visible to others.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px] resize-none"
                        {...field}
                        data-testid="input-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="React, TypeScript, AI, Design"
                        {...field}
                        data-testid="input-skills"
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of your skills.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tools"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tools</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VS Code, Figma, ChatGPT"
                        {...field}
                        data-testid="input-tools"
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of tools you use.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://yoursite.com"
                          {...field}
                          data-testid="input-website"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="githubUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://github.com/username"
                          {...field}
                          data-testid="input-github"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitterUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://twitter.com/username"
                          {...field}
                          data-testid="input-twitter"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://linkedin.com/in/username"
                          {...field}
                          data-testid="input-linkedin"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Link href={user ? `/profile/${user.id}` : "/"}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  data-testid="button-save"
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
