interface VibesLogoProps {
  className?: string;
}

export function VibesLogo({ className = "h-8" }: VibesLogoProps) {
  return (
    <svg
      viewBox="0 0 1200 400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      className={className}
      data-testid="img-vibes-logo"
    >
      <defs>
        <linearGradient id="vibesGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5AC8FA"/>
          <stop offset="35%" stopColor="#6A5CFF"/>
          <stop offset="65%" stopColor="#B14DFF"/>
          <stop offset="100%" stopColor="#FF4D6D"/>
        </linearGradient>
      </defs>

      <path
        d="
          M 0 200
          C 150 80, 300 80, 450 200
          C 600 320, 750 320, 900 200
          C 1050 80, 1200 80, 1200 200
        "
        stroke="url(#vibesGradient)"
        strokeWidth="80"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
