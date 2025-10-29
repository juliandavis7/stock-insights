import { ArrowRight } from "lucide-react";
import { FeatureList } from "./FeatureList";
import { cn } from "~/lib/utils";
import type { FeatureModule as FeatureModuleType } from "~/constants/homeModules";
import { useEffect, useRef, useState } from "react";

interface FeatureModuleProps {
  module: FeatureModuleType;
  className?: string;
}

export function FeatureModule({ module, className }: FeatureModuleProps) {
  const isImageLeft = module.imagePosition === 'left';
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={`feature-module-${module.id}`}
      className={cn(
        "py-16 lg:py-24 transition-all duration-1000 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Section */}
          <div
            className={cn(
              "order-1 lg:order-none",
              isImageLeft ? "lg:order-1" : "lg:order-2"
            )}
          >
            <div className="relative overflow-hidden rounded-lg shadow-2xl">
              <div className="relative bg-gray-100" style={{ aspectRatio: '16/12' }}>
                <img
                  src={module.image.src}
                  alt={module.image.alt}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    objectPosition: 'center -50px', // Adjusted to show navbar and stock info
                    objectFit: 'cover',
                    transform: 'scale(1.3)' // Slightly zoomed out to show more content
                  }}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/800x600/f3f4f6/6b7280?text=${module.header}`;
                    // Reset object position for placeholder
                    target.style.objectPosition = 'center';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div
            className={cn(
              "order-2 lg:order-none space-y-6",
              isImageLeft ? "lg:order-2" : "lg:order-1"
            )}
          >
            {/* Headline */}
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {module.headline}
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-600 leading-relaxed">
              {module.description}
            </p>

            {/* Feature List */}
            <FeatureList features={module.features} className="mt-8" />

            {/* CTA Link */}
            <div className="pt-6">
              <a
                href={module.ctaLink}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 group"
              >
                {module.ctaText}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}