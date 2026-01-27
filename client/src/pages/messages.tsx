import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Send, ArrowLeft, MessageCircle, Mic, Square, Loader2, Image, Paperclip, Download } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profileImageUrl: string | null;
    username: string | null;
  } | null;
  unreadCount: number;
  lastMessage: {
    content: string | null;
    messageType: string | null;
    createdAt: string | null;
  } | null;
  lastMessageAt: string | null;
}

interface Message {
  id: string;
  senderId: string;
  content: string | null;
  messageType: string | null;
  voiceNoteUrl: string | null;
  imageUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string | null;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    username: string | null;
  } | null;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [autoSelectUserId, setAutoSelectUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const withUserId = params.get("with");
    if (withUserId) {
      setAutoSelectUserId(withUserId);
      setLocation("/messages", { replace: true });
    }
  }, []);
  
  const pendingFileNameRef = useRef<string>("");
  
  const { uploadFile: uploadVoice, isUploading: isUploadingVoice } = useUpload({
    onSuccess: (response) => {
      sendMessageMutation.mutate({ voiceNoteUrl: response.objectPath, messageType: "voice" });
    },
    onError: () => {
      toast({ title: "Failed to upload voice note", variant: "destructive" });
    }
  });

  const { uploadFile: uploadImage, isUploading: isUploadingImage } = useUpload({
    onSuccess: (response) => {
      sendMessageMutation.mutate({ imageUrl: response.objectPath, messageType: "image" });
    },
    onError: () => {
      toast({ title: "Failed to upload image", variant: "destructive" });
    }
  });

  const { uploadFile: uploadFileToStorage, isUploading: isUploadingFile } = useUpload({
    onSuccess: (response) => {
      sendMessageMutation.mutate({ fileUrl: response.objectPath, fileName: pendingFileNameRef.current, messageType: "file" });
      pendingFileNameRef.current = "";
    },
    onError: () => {
      toast({ title: "Failed to upload file", variant: "destructive" });
      pendingFileNameRef.current = "";
    }
  });

  const isUploading = isUploadingVoice || isUploadingImage || isUploadingFile;

  const { data: conversations = [], isLoading: loadingConvos } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConvo?.id, "messages"],
    enabled: !!selectedConvo,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content?: string; voiceNoteUrl?: string; imageUrl?: string; fileUrl?: string; fileName?: string; messageType?: string }) => {
      return apiRequest("POST", `/api/conversations/${selectedConvo?.id}/messages`, data);
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConvo?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (convoId: string) => {
      return apiRequest("POST", `/api/conversations/${convoId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  useEffect(() => {
    if (selectedConvo && selectedConvo.unreadCount > 0) {
      markReadMutation.mutate(selectedConvo.id);
    }
  }, [selectedConvo?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (autoSelectUserId && conversations.length > 0 && !selectedConvo) {
      const matchingConvo = conversations.find(c => c.otherUser?.id === autoSelectUserId);
      if (matchingConvo) {
        setSelectedConvo(matchingConvo);
        setAutoSelectUserId(null);
        setTimeout(() => messageInputRef.current?.focus(), 100);
      }
    }
  }, [autoSelectUserId, conversations, selectedConvo]);

  useEffect(() => {
    if (selectedConvo && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [selectedConvo?.id]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConvo) return;
    sendMessageMutation.mutate({ content: messageText, messageType: "text" });
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
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        uploadVoice(file);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast({ title: "Could not access microphone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
    e.target.value = "";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      pendingFileNameRef.current = file.name;
      uploadFileToStorage(file);
    }
    e.target.value = "";
  };

  const getInitials = (user: { firstName?: string | null; lastName?: string | null; email?: string } | null) => {
    if (!user) return "?";
    if (user.firstName) return user.firstName[0].toUpperCase();
    return user.email?.[0]?.toUpperCase() || "?";
  };

  const getUserName = (user: { firstName?: string | null; lastName?: string | null; email?: string; username?: string | null } | null) => {
    if (!user) return "Unknown";
    if (user.username) return `@${user.username}`;
    if (user.firstName) return `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`;
    return user.email;
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view messages</h2>
        <p className="text-muted-foreground">You need to be logged in to send and receive messages.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex" data-testid="messages-page">
      <div className={`w-full md:w-80 border-r flex flex-col ${selectedConvo ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start a conversation from someone's profile</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedConvo(convo)}
                className={`w-full p-4 flex items-center gap-3 hover-elevate border-b transition-colors ${
                  selectedConvo?.id === convo.id ? "bg-muted" : ""
                }`}
                data-testid={`conversation-${convo.id}`}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={convo.otherUser?.profileImageUrl || undefined} />
                  <AvatarFallback>{getInitials(convo.otherUser)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{getUserName(convo.otherUser)}</span>
                    {convo.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2 h-5 min-w-[1.25rem] px-1.5">
                        {convo.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {convo.lastMessage?.messageType === "voice" 
                      ? "Voice note" 
                      : convo.lastMessage?.content || "No messages yet"
                    }
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      
      <div className={`flex-1 flex flex-col ${selectedConvo ? "flex" : "hidden md:flex"}`}>
        {selectedConvo ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedConvo(null)}
                data-testid="button-back-messages"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Link href={`/profile/${selectedConvo.otherUser?.id}`}>
                <div className="flex items-center gap-3 hover-elevate rounded-full pr-3 cursor-pointer">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConvo.otherUser?.profileImageUrl || undefined} />
                    <AvatarFallback>{getInitials(selectedConvo.otherUser)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{getUserName(selectedConvo.otherUser)}</span>
                </div>
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : ""}`}>
                        {!isOwn && (
                          <Link href={`/profile/${msg.sender?.id}`}>
                            <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer hover:opacity-80">
                              <AvatarImage src={msg.sender?.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">{getInitials(msg.sender)}</AvatarFallback>
                            </Avatar>
                          </Link>
                        )}
                        <div className={`rounded-2xl px-4 py-2 ${
                          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          {msg.messageType === "voice" && msg.voiceNoteUrl ? (
                            <audio src={msg.voiceNoteUrl} controls className="max-w-full" />
                          ) : msg.messageType === "image" && msg.imageUrl ? (
                            <img 
                              src={msg.imageUrl} 
                              alt="Shared image" 
                              className="max-w-full rounded-lg cursor-pointer"
                              onClick={() => window.open(msg.imageUrl!, "_blank")}
                              data-testid={`img-message-${msg.id}`}
                            />
                          ) : msg.messageType === "file" && msg.fileUrl ? (
                            <a 
                              href={msg.fileUrl} 
                              download={msg.fileName || "file"}
                              className={`flex items-center gap-2 ${isOwn ? "text-primary-foreground hover:underline" : "text-foreground hover:underline"}`}
                              data-testid={`link-download-${msg.id}`}
                            >
                              <Download className="h-4 w-4" />
                              <span className="text-sm">{msg.fileName || "Download file"}</span>
                            </a>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          )}
                          {msg.createdAt && (
                            <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-center gap-1"
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-image-upload"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-file-upload"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading || sendMessageMutation.isPending}
                  data-testid="button-image-upload"
                >
                  {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || sendMessageMutation.isPending}
                  data-testid="button-file-upload"
                >
                  {isUploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "ghost"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isUploading || sendMessageMutation.isPending}
                  data-testid="button-voice-note"
                >
                  {isRecording ? <Square className="h-4 w-4" /> : (isUploadingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />)}
                </Button>
                <Input
                  ref={messageInputRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={isRecording || isUploading}
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!messageText.trim() || sendMessageMutation.isPending || isRecording || isUploading}
                  data-testid="button-send-message"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="h-16 w-16 mb-4" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
