interface VibesLogoProps {
  className?: string;
  showText?: boolean;
}

export function VibesLogo({ className = "text-2xl", showText = false }: VibesLogoProps) {
  return (
    <span className={`font-mono font-bold rainbow-gradient-text ${className}`} data-testid="logo-vibes">
      &lt;vibes/&gt;
    </span>
  );
}
