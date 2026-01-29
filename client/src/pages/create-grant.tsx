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
import { useUpload } from "@/hooks/use-upload";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Loader2, ImagePlus, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { ImageCropper } from "@/components/image-cropper";

const createGrantSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(50, "Description must be at least 50 characters").max(2000),
  amount: z.string().optional(),
  requirements: z.string().optional(),
  deadline: z.string().optional(),
});

type CreateGrantForm = z.infer<typeof createGrantSchema>;

export default function CreateGrantPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading: isUploadingImage } = useUpload({
    onSuccess: (response) => {
      setCoverImageUrl(response.objectPath);
      toast({
        title: "Image uploaded",
        description: "Cover image has been uploaded.",
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
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }
      // Show cropper for 16:9 aspect ratio
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setImageToCrop(null);
    const file = new File([croppedBlob], "cover.jpg", { type: "image/jpeg" });
    await uploadFile(file);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, authLoading]);

  const form = useForm<CreateGrantForm>({
    resolver: zodResolver(createGrantSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      requirements: "",
      deadline: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateGrantForm) => {
      return apiRequest("POST", "/api/grants", {
        title: data.title,
        description: data.description,
        amount: data.amount || null,
        requirements: data.requirements || null,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        imageUrl: coverImageUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      toast({
        title: "Grant created!",
        description: "Your grant program is now live for applications.",
      });
      setLocation("/grants");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create grant. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateGrantForm) => {
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
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <Link href="/grants">
        <Button variant="ghost" className="gap-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Back to Grants
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create a Grant Program</CardTitle>
          <CardDescription>
            Create a grant program to fund vibecoded projects. Users can apply 
            with their pitch and you can review applications.
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
                    <FormLabel>Grant Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Vibecoder Innovation Grant"
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
                        placeholder="Describe your grant program, what you're looking for, and who should apply..."
                        className="min-h-[150px] resize-none"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum 50 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grant Amount</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="$1,000 - $5,000"
                          {...field}
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormDescription>
                        Prize or funding amount
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Deadline</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-deadline"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List any specific requirements, eligibility criteria, or things you're looking for..."
                        className="min-h-[100px] resize-none"
                        {...field}
                        data-testid="input-requirements"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Cover Image</FormLabel>
                {coverImageUrl ? (
                  <div className="relative rounded-lg overflow-hidden border">
                    <img 
                      src={coverImageUrl} 
                      alt="Cover preview" 
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setCoverImageUrl(null)}
                      data-testid="button-remove-cover"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    data-testid="dropzone-cover-image"
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload a cover image
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  data-testid="input-cover-file"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Link href="/grants">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  data-testid="button-create"
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Grant
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 16:9 Cover Image Cropper */}
      {imageToCrop && (
        <ImageCropper
          open={showCropper}
          onOpenChange={(open) => {
            setShowCropper(open);
            if (!open) {
              setImageToCrop(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }
          }}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          aspectRatio={16 / 9}
          isLoading={isUploadingImage}
        />
      )}
    </div>
  );
}
