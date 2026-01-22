import vibesLogoDark from "../assets/vibes-logo-dark.png";
import vibesLogoLight from "../assets/vibes-logo-light.png";
import { useEffect, useState } from "react";

interface VibesLogoProps {
  className?: string;
  alt?: string;
}

export function VibesLogo({ className = "h-8 w-8", alt = "Vibes" }: VibesLogoProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <img
      src={isDark ? vibesLogoDark : vibesLogoLight}
      alt={alt}
      className={className}
      data-testid="img-vibes-logo"
    />
  );
}
