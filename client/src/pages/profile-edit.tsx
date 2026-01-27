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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Loader2, Camera, User as UserIcon } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { ImageCropper } from "@/components/image-cropper";
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
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading: isUploadingImage } = useUpload({
    onSuccess: (response) => {
      setProfileImageUrl(response.objectPath);
      toast({
        title: "Image uploaded",
        description: "Your profile picture has been uploaded.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

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
      if (profile.profileImageUrl) {
        setProfileImageUrl(profile.profileImageUrl);
      }
    }
  }, [profile, form]);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, authLoading]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    const file = new File([croppedBlob], "profile.jpg", { type: "image/jpeg" });
    await uploadFile(file);
    setCropperOpen(false);
    setImageToCrop("");
  }, [uploadFile]);

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
        profileImageUrl: profileImageUrl || null,
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
              <div className="flex flex-col items-center gap-4 pb-4 border-b">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileImageUrl || ""} alt="Profile" />
                    <AvatarFallback>
                      <UserIcon className="h-10 w-10 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    data-testid="button-upload-avatar"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    data-testid="input-avatar-file"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the camera icon to upload a profile picture
                </p>
              </div>

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

      <ImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        isLoading={isUploadingImage}
      />
    </div>
  );
}
