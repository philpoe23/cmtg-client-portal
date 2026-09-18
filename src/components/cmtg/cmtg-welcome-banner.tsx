import { cn } from "@/lib/utils";

export interface CmtgWelcomeBannerProps {
  heading: string;
  subtext: string;
  className?: string;
}

export function CmtgWelcomeBanner({ heading, subtext, className }: CmtgWelcomeBannerProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl px-8 py-6.5 text-white", className)}
      style={{ background: "linear-gradient(115deg, #0A7171 0%, #51AFAE 100%)" }}
    >
      <svg className="pointer-events-none absolute right-0 bottom-0 opacity-35" width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
        <path d="M180 120 L180 90 L150 90 L150 60 L120 60 L120 90 L100 90 L100 40 L70 40 L70 70 L50 70 L50 20 L20 20 L20 100 L0 100" stroke="#FFFFFF" strokeWidth="3" fill="none" />
        <path
          d="M180 105 L160 105 L160 75 L130 75 L130 105 L110 105 L110 55 L85 55 L85 85 L65 85 L65 35 L40 35 L40 100"
          stroke="#CFF2E6"
          strokeWidth="3"
          fill="none"
        />
      </svg>
      <div className="relative max-w-160">
        <div className="font-blueprint text-2xl font-semibold">{heading}</div>
        <div className="mt-2 text-sm text-[#E7F5F2]">{subtext}</div>
      </div>
    </div>
  );
}
