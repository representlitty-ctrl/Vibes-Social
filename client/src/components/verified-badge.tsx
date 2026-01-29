import { BadgeCheck, Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function VerifiedBadge({ className = "", size = "md" }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <BadgeCheck 
          className={`text-primary fill-primary/20 ${sizeClasses[size]} ${className}`}
          data-testid="badge-verified"
        />
      </TooltipTrigger>
      <TooltipContent>
        <p>Verified Vibecoder</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface PrivateBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PrivateBadge({ className = "", size = "md" }: PrivateBadgeProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Lock 
          className={`text-muted-foreground ${sizeClasses[size]} ${className}`}
          data-testid="badge-private"
        />
      </TooltipTrigger>
      <TooltipContent>
        <p>Private Account</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function isUserVerified(user: {
  profileImageUrl?: string | null;
  username?: string | null;
  email?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  return !!(user.profileImageUrl && user.username && user.email);
}
