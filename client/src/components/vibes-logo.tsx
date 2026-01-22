interface VibesLogoProps {
  className?: string;
}

export function VibesLogo({ className = "text-2xl" }: VibesLogoProps) {
  return (
    <span className={`font-bold tracking-tight ${className}`} data-testid="logo-vibes">
      <span className="rainbow-gradient-text">~</span>
      <span className="text-foreground">vibes</span>
    </span>
  );
}
