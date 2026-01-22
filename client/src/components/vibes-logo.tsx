interface VibesLogoProps {
  className?: string;
}

export function VibesLogo({ className = "h-6 w-auto" }: VibesLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 400"
      fill="none"
      className={className}
      data-testid="img-vibes-logo"
    >
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#59C9FF"/>
          <stop offset="35%" stopColor="#5E6BFF"/>
          <stop offset="65%" stopColor="#A84BFF"/>
          <stop offset="100%" stopColor="#FF4F81"/>
        </linearGradient>
      </defs>

      <path
        d="
          M 80 200
          C 220 60, 380 60, 520 200
          C 660 340, 820 340, 960 200
          C 1080 100, 1160 120, 1200 200
        "
        stroke="url(#waveGrad)"
        strokeWidth="90"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
