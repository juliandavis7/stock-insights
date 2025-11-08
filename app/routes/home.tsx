import { getAuth } from "@clerk/react-router/ssr.server";
import { createClerkClient } from "@clerk/react-router/api.server";
import { redirect, Link } from "react-router";
import { Check } from "lucide-react";
import type { Route } from "./+types/home";
import { BRAND_NAME, BRAND_TAGLINE, BRAND_COLOR, ACCENT_BACKGROUND_STYLE } from "~/config/brand";
import { BrandNameAndLogo } from "~/components/logos";
import { MarketingLayout } from "~/components/marketing/marketing-layout";
import { FAQSection } from "~/components/marketing/faq-section";
import { featureModules } from "~/constants/homeModules";

export function meta({}: Route.MetaArgs) {
  const title = `${BRAND_NAME} - Financial Analysis Platform`;
  const description = "A comprehensive stock analysis platform with real-time data and projections.";

  return [
    { title },
    { name: "description", content: description },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);

  // Redirect logged-in users to the app
  if (userId) {
    throw redirect("/search");
  }
  
  return { user: null };
}

// Feature tiles configuration
const defaultLeftRightCrop = '-3.5rem';
const defaultTopCrop = '-3.5rem';
const defaultTransformOrigin = 'center top';
const defaultCropping = { objectPosition: `${defaultLeftRightCrop} ${defaultTopCrop}`, scale: 1.4, transformOrigin: defaultTransformOrigin };
const defaultAspectRatio = '4/3';
const defaultMaxHeight = '35rem';

const projectionsLeftRightCrop = '-1rem';
const projectionsTopCrop = '-10rem';
const projectionsTransformOrigin = 'center top';
const projectionsCropping = { objectPosition: `${projectionsLeftRightCrop} ${projectionsTopCrop}`, scale: 1.2, transformOrigin: projectionsTransformOrigin };
const projectionsAspectRatio = '16/9';
const projectionsMaxHeight = '45rem';

const showImageBorder = true;

function FeatureTile({ module, isProjections = false }: { module: typeof featureModules[0]; isProjections?: boolean }) {
  const cropSettings = module.id === 'projections' ? projectionsCropping : defaultCropping;
  const aspectRatio = module.id === 'projections' ? projectionsAspectRatio : defaultAspectRatio;
  const maxHeight = module.id === 'projections' ? projectionsMaxHeight : defaultMaxHeight;
  
  return (
    <div 
      className="
        bg-white border border-gray-200
        rounded-xl 
        pt-6 pb-10 px-6 md:pt-6 md:pb-10 md:px-10
        transition-all duration-300 ease-out
        flex flex-col h-full
      "
      style={{ 
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)'
      }}
    >
      <div>
        {/* Title and Subtitle */}
        <div className="mb-6">
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            {module.headline}
          </h3>
          <p className="text-lg text-gray-600 leading-relaxed">
            {module.description}
          </p>
        </div>
        
        <ul className="space-y-3 mb-8">
          {module.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div 
          className="w-full overflow-hidden"
          style={{ 
            aspectRatio,
            maxHeight,
            position: 'relative',
            border: showImageBorder ? '1px solid #e5e7eb' : 'none',
            borderRadius: '8px'
          }}
        >
          <img 
            src={module.image.src} 
            alt={module.image.alt}
            className="w-full h-full"
            style={{ 
              objectFit: 'cover',
              objectPosition: cropSettings.objectPosition,
              transform: `scale(${cropSettings.scale})`,
              transformOrigin: cropSettings.transformOrigin
            }}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <MarketingLayout>
      {/* Hero Section - Two Column Layout */}
      <section id="top" className="min-h-screen flex items-center justify-center py-16 px-4" style={ACCENT_BACKGROUND_STYLE}>
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left Column - Content */}
            <div className="lg:pr-8">
              {/* Headline */}
              <h1 className="text-6xl md:text-6xl font-bold text-gray-900 mb-4 text-center">
                Find your next <br />winning stock
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-[#6B7280] mb-8 text-center">
                Made by investors, for investors.
              </p>

              {/* Primary CTA Button */}
              <div className="flex justify-center">
                <Link to="/sign-up">
                  <button className="bg-[#2463EB] hover:bg-[#1d4fd8] text-white text-lg font-medium px-12 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:translate-y-[-2px]">
                    Get {BRAND_NAME} free
                  </button>
                </Link>
              </div>

              {/* Trial Details - Single Line with Dots */}
              <div className="mt-6 flex justify-center">
                <p className="text-base text-gray-700 text-center">
                  7-day free trial <span className="text-[#2463EB] mx-2">•</span> No credit card required <span className="text-[#2463EB] mx-2">•</span> Full access to all features
                </p>
              </div>

              {/* Login Link */}
              <p className="text-base text-gray-600 mt-6 text-center">
                Already have an account?{' '}
                <Link to="/sign-in" className="text-[#2463EB] hover:text-[#1d4fd8] hover:underline font-medium">
                  Login
                </Link>
              </p>
            </div>

            {/* Right Column - Hero SVG */}
            <div className="flex items-center justify-center lg:justify-start lg:ml-60">
              <div className="w-full" style={{ transform: 'scale(1.75)' }}>
                <img 
                  src="/hero.svg" 
                  alt="Stock Analytics Illustration"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features"
        className="py-24 bg-page-background"
      >
        <div className="mx-auto px-4 md:px-6" style={{ maxWidth: '1400px' }}>
          <h2 className="text-5xl font-bold text-center mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            Everything you need to make informed investment decisions
          </p>
          
          <div className="grid gap-8">
            {/* Row 1: Search and Compare (50/50) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              <FeatureTile module={featureModules.find(m => m.id === 'search')!} />
              <FeatureTile module={featureModules.find(m => m.id === 'compare')!} />
            </div>
            
            {/* Row 2: Projections (Full width) */}
            <div className="grid grid-cols-1">
              <FeatureTile module={featureModules.find(m => m.id === 'projections')!} isProjections={true} />
            </div>
            
            {/* Row 3: Financials and Charts (50/50) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              <FeatureTile module={featureModules.find(m => m.id === 'financials')!} />
              <FeatureTile module={featureModules.find(m => m.id === 'charts')!} />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">
            Join investors making smarter decisions with {BRAND_NAME}
          </p>
          <Link to="/sign-up">
            <button className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-semibold transition-colors duration-200 shadow-lg">
              Get {BRAND_NAME} free
            </button>
          </Link>
        </div>
      </footer>
    </MarketingLayout>
  );
}
