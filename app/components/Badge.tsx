import { cn } from "~/lib/utils";

interface BadgeProps {
  text: string;
  color: 'blue' | 'orange' | 'purple' | 'green' | 'teal';
  className?: string;
}

const badgeVariants = {
  blue: "bg-blue-600 text-white",
  orange: "bg-orange-500 text-white",
  purple: "bg-purple-500 text-white",
  green: "bg-green-500 text-white",
  teal: "bg-teal-500 text-white",
};

export function Badge({ text, color, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase",
        badgeVariants[color],
        className
      )}
    >
      {text}
    </span>
  );
}