import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme, COLOR_THEMES } from "@/components/theme-provider";
import { Settings, Palette, Bell, Shield, Eye, Moon, Sun, Monitor, Check, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const SETTINGS_KEY = "vibes-settings";

interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  followerNotifications: boolean;
  messageNotifications: boolean;
  privateProfile: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  compactMode: boolean;
  showMediaPreviews: boolean;
  autoplayVideos: boolean;
  reduceAnimations: boolean;
}

const defaultSettings: UserSettings = {
  pushNotifications: true,
  emailNotifications: false,
  followerNotifications: true,
  messageNotifications: true,
  privateProfile: false,
  showOnlineStatus: true,
  allowDirectMessages: true,
  compactMode: false,
  showMediaPreviews: true,
  autoplayVideos: false,
  reduceAnimations: false,
};

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return defaultSettings;
}

function saveSettings(settings: UserSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

export default function SettingsPage() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: serverSettings } = useQuery<{ showNewsPosts: boolean }>({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

  const newsSettingMutation = useMutation({
    mutationFn: async (showNewsPosts: boolean) => {
      return apiRequest("PUT", "/api/settings", { showNewsPosts });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/global"] });
    },
  });

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how Vibes looks for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Theme Mode</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="gap-2"
                data-testid="button-theme-dark"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="gap-2"
                data-testid="button-theme-light"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="gap-2"
                data-testid="button-theme-system"
              >
                <Monitor className="h-4 w-4" />
                System
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Accent Color</Label>
            <div className="flex flex-wrap gap-3">
              {COLOR_THEMES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setColorTheme(ct.value)}
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110",
                    colorTheme === ct.value && "ring-2 ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: ct.color, borderColor: ct.color }}
                  title={ct.label}
                  data-testid={`button-color-${ct.value}`}
                >
                  {colorTheme === ct.value && (
                    <Check className="h-5 w-5 text-white" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Selected: {COLOR_THEMES.find(ct => ct.value === colorTheme)?.label}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Control how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for new activity
              </p>
            </div>
            <Switch
              data-testid="switch-push-notifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly digest emails
              </p>
            </div>
            <Switch
              data-testid="switch-email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Follower Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone follows you
              </p>
            </div>
            <Switch
              data-testid="switch-follower-notifications"
              checked={settings.followerNotifications}
              onCheckedChange={(checked) => updateSetting("followerNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Message Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified for new direct messages
              </p>
            </div>
            <Switch
              data-testid="switch-message-notifications"
              checked={settings.messageNotifications}
              onCheckedChange={(checked) => updateSetting("messageNotifications", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              News Feed
            </CardTitle>
            <CardDescription>
              Control news content in your feed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show News Posts</Label>
                <p className="text-sm text-muted-foreground">
                  See crypto, tech, AI, finance, and political news in your feed
                </p>
              </div>
              <Switch
                data-testid="switch-show-news"
                checked={serverSettings?.showNewsPosts ?? true}
                disabled={newsSettingMutation.isPending}
                onCheckedChange={(checked) => newsSettingMutation.mutate(checked)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
          <CardDescription>
            Control your privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Private Profile</Label>
              <p className="text-sm text-muted-foreground">
                Only approved followers can see your posts
              </p>
            </div>
            <Switch
              data-testid="switch-private-profile"
              checked={settings.privateProfile}
              onCheckedChange={(checked) => updateSetting("privateProfile", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Online Status</Label>
              <p className="text-sm text-muted-foreground">
                Let others see when you're online
              </p>
            </div>
            <Switch
              data-testid="switch-online-status"
              checked={settings.showOnlineStatus}
              onCheckedChange={(checked) => updateSetting("showOnlineStatus", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Direct Messages</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone to send you messages
              </p>
            </div>
            <Switch
              data-testid="switch-allow-dms"
              checked={settings.allowDirectMessages}
              onCheckedChange={(checked) => updateSetting("allowDirectMessages", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Display
          </CardTitle>
          <CardDescription>
            Customize your viewing experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Show more content with less spacing
              </p>
            </div>
            <Switch
              data-testid="switch-compact-mode"
              checked={settings.compactMode}
              onCheckedChange={(checked) => updateSetting("compactMode", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Media Previews</Label>
              <p className="text-sm text-muted-foreground">
                Automatically load image and video previews
              </p>
            </div>
            <Switch
              data-testid="switch-media-previews"
              checked={settings.showMediaPreviews}
              onCheckedChange={(checked) => updateSetting("showMediaPreviews", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autoplay Videos</Label>
              <p className="text-sm text-muted-foreground">
                Automatically play videos in feed
              </p>
            </div>
            <Switch
              data-testid="switch-autoplay-videos"
              checked={settings.autoplayVideos}
              onCheckedChange={(checked) => updateSetting("autoplayVideos", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reduce Animations</Label>
              <p className="text-sm text-muted-foreground">
                Minimize motion effects
              </p>
            </div>
            <Switch
              data-testid="switch-reduce-animations"
              checked={settings.reduceAnimations}
              onCheckedChange={(checked) => updateSetting("reduceAnimations", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
