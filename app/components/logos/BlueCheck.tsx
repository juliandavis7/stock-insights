import { Check } from "lucide-react";
import { BRAND_COLOR } from "~/config/brand";

export default function BlueCheck() {
  return (
    <div 
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: BRAND_COLOR }}
    >
      <Check className="w-3 h-3 text-white stroke-[2.5]" />
    </div>
  );
}

