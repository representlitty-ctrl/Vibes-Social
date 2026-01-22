interface VibesLogoProps {
  className?: string;
}

export function VibesLogo({ className = "h-4 w-auto" }: VibesLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 400"
      fill="none"
      className={className}
      data-testid="img-vibes-logo"
    >
      <defs>
        <linearGradient id="vsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#59C9FF"/>
          <stop offset="40%" stopColor="#6A5CFF"/>
          <stop offset="70%" stopColor="#B14DFF"/>
          <stop offset="100%" stopColor="#FF4D6D"/>
        </linearGradient>
      </defs>

      <path
        d="
          M 100 80
          L 220 320
          L 340 80
          C 420 20, 520 120, 420 200
          C 320 280, 520 380, 620 300
        "
        stroke="url(#vsGrad)"
        strokeWidth="80"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
