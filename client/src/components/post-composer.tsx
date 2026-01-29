import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Image, Video, Mic, X, Square, Loader2, Send, User, Users, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import type { Community } from "@shared/schema";

interface MediaItem {
  mediaType: "image" | "video";
  mediaUrl: string;
  previewUrl?: string;
  aspectRatio?: string;
}

interface PostComposerProps {
  onClose?: () => void;
}

export function PostComposer({ onClose }: PostComposerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [postToFeed, setPostToFeed] = useState(true);
  const [selectedCommunityIds, setSelectedCommunityIds] = useState<string[]>([]);

  const { data: joinedCommunities = [] } = useQuery<Community[]>({
    queryKey: ["/api/communities/joined"],
    enabled: !!user,
  });

  const { uploadFile: uploadMedia, isUploading: isUploadingMedia } = useUpload({
    onSuccess: (response) => {
      const isVideo = response.metadata.contentType.startsWith("video/");
      setMediaItems((prev) => [
        ...prev,
        {
          mediaType: isVideo ? "video" : "image",
          mediaUrl: response.objectPath,
        },
      ]);
    },
    onError: () => {
      toast({ title: "Failed to upload media", variant: "destructive" });
    },
  });

  const { uploadFile: uploadVoice, isUploading: isUploadingVoice } = useUpload({
    onSuccess: (response) => {
      setVoiceNoteUrl(response.objectPath);
    },
    onError: () => {
      toast({ title: "Failed to upload voice note", variant: "destructive" });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/posts", {
        content: content.trim() || null,
        voiceNoteUrl,
        media: mediaItems,
        communityIds: selectedCommunityIds,
      });
    },
    onSuccess: () => {
      setContent("");
      setMediaItems([]);
      setVoiceNoteUrl(null);
      setSelectedCommunityIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      toast({ title: "Post created!" });
      onClose?.();
    },
    onError: () => {
      toast({ title: "Failed to create post", variant: "destructive" });
    },
  });

  const toggleCommunity = (communityId: string) => {
    setSelectedCommunityIds(prev => 
      prev.includes(communityId) 
        ? prev.filter(id => id !== communityId)
        : [...prev, communityId]
    );
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      
      for (let i = 0; i < files.length; i++) {
        uploadMedia(files[i]);
      }
      e.target.value = "";
    },
    [uploadMedia]
  );

  const removeMedia = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        uploadVoice(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast({ title: "Cannot access microphone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeVoiceNote = () => {
    setVoiceNoteUrl(null);
  };

  const canSubmit =
    (content.trim() || mediaItems.length > 0 || voiceNoteUrl) &&
    !createPostMutation.isPending &&
    !isUploadingMedia &&
    !isUploadingVoice;

  if (!user) return null;

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  return (
    <Card className="p-4" data-testid="post-composer">
      {onClose && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Create Post</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-composer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={user.profileImageUrl || undefined} />
          <AvatarFallback>
            <User className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none border-0 bg-muted/50 focus-visible:ring-1"
            data-testid="input-post-content"
          />

          {mediaItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mediaItems.map((item, index) => (
                <div key={index} className="relative group">
                  {item.mediaType === "image" ? (
                    <img
                      src={item.mediaUrl}
                      alt=""
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  ) : (
                    <video
                      src={item.mediaUrl}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMedia(index)}
                    data-testid={`button-remove-media-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {voiceNoteUrl && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <audio src={voiceNoteUrl} controls className="h-8 flex-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={removeVoiceNote}
                data-testid="button-remove-voice"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {joinedCommunities.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommunitySelector(!showCommunitySelector)}
                className="gap-2 text-muted-foreground"
                data-testid="button-toggle-community-selector"
              >
                <Users className="h-4 w-4" />
                Post to communities
                {selectedCommunityIds.length > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground px-1.5 rounded-full">
                    {selectedCommunityIds.length}
                  </span>
                )}
                {showCommunitySelector ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              {showCommunitySelector && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="post-to-feed"
                      checked={postToFeed}
                      onCheckedChange={(checked) => setPostToFeed(!!checked)}
                      data-testid="checkbox-post-to-feed"
                    />
                    <Label htmlFor="post-to-feed" className="flex items-center gap-2 text-sm cursor-pointer">
                      <Globe className="h-4 w-4" />
                      Your Feed
                    </Label>
                  </div>
                  <div className="border-t pt-2 mt-2 space-y-2">
                    <p className="text-xs text-muted-foreground">Communities</p>
                    {joinedCommunities.map((community) => (
                      <div key={community.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`community-${community.id}`}
                          checked={selectedCommunityIds.includes(community.id)}
                          onCheckedChange={() => toggleCommunity(community.id)}
                          data-testid={`checkbox-community-${community.id}`}
                        />
                        <Label 
                          htmlFor={`community-${community.id}`} 
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Users className="h-4 w-4" />
                          {community.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingMedia}
                data-testid="button-add-media"
              >
                {isUploadingMedia ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Image className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant={isRecording ? "destructive" : "ghost"}
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isUploadingVoice || !!voiceNoteUrl}
                data-testid="button-voice-note"
              >
                {isRecording ? (
                  <Square className="h-4 w-4" />
                ) : isUploadingVoice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Button
              onClick={() => createPostMutation.mutate()}
              disabled={!canSubmit}
              className="gap-2"
              data-testid="button-submit-post"
            >
              {createPostMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
