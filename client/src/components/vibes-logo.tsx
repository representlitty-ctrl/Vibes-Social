import vibesLogo from "../assets/vibes-logo.png";

interface VibesLogoProps {
  className?: string;
  alt?: string;
}

export function VibesLogo({ className = "h-8", alt = "Vibes" }: VibesLogoProps) {
  return (
    <img
      src={vibesLogo}
      alt={alt}
      className={`${className} object-contain`}
      data-testid="img-vibes-logo"
    />
  );
}
