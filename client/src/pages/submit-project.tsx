import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

const submitProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description must be less than 2000 characters"),
  demoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.string().optional(),
});

type SubmitProjectForm = z.infer<typeof submitProjectSchema>;

export default function SubmitProjectPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, authLoading]);

  const form = useForm<SubmitProjectForm>({
    resolver: zodResolver(submitProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      demoUrl: "",
      githubUrl: "",
      imageUrl: "",
      tags: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: SubmitProjectForm) => {
      const tags = data.tags
        ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      const response = await apiRequest("POST", "/api/projects", {
        title: data.title,
        description: data.description,
        demoUrl: data.demoUrl || null,
        githubUrl: data.githubUrl || null,
        imageUrl: data.imageUrl || null,
        tags,
      });
      return response.json();
    },
    onSuccess: (data: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project submitted!",
        description: "Your project is now live for the community to see.",
      });
      setLocation(`/projects/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubmitProjectForm) => {
    mutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/">
        <Button variant="ghost" className="gap-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Submit Your Project</CardTitle>
          <CardDescription>
            Share your vibecoded creation with the community. Fill out the details below
            and let others discover your work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Awesome Project"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what your project does, the technologies used, and what inspired you to build it..."
                        className="min-h-[150px] resize-none"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum 20 characters. Be descriptive!
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="demoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demo URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://myproject.com"
                          {...field}
                          data-testid="input-demo-url"
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
                      <FormLabel>GitHub URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://github.com/user/repo"
                          {...field}
                          data-testid="input-github-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.png"
                        {...field}
                        data-testid="input-image-url"
                      />
                    </FormControl>
                    <FormDescription>
                      Add a screenshot or cover image for your project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="react, ai, game, tool"
                        {...field}
                        data-testid="input-tags"
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of tags to help others discover your project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Link href="/">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  data-testid="button-submit"
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Project
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
