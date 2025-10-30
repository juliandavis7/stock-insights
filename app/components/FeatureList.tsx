import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

interface FeatureListProps {
  features: string[];
  className?: string;
}

export function FeatureList({ features, className }: FeatureListProps) {
  return (
    <ul className={cn("space-y-3", className)}>
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Check className="h-5 w-5 text-green-500" />
          </div>
          <span className="text-gray-700 leading-relaxed">{feature}</span>
        </li>
      ))}
    </ul>
  );
}