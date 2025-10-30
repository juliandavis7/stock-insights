import { getAuth } from "@clerk/react-router/ssr.server";
import { createClerkClient } from "@clerk/react-router/api.server";
import { Navbar } from "~/components/homepage/navbar";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { featureModules } from "~/constants/homeModules";
import { useEffect } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  const title = "Stock Insights - Financial Analysis Platform";
  const description = "A comprehensive stock analysis platform with real-time data and projections.";

  return [
    { title },
    { name: "description", content: description },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);

  if (userId) {
    // Get real user details from Clerk
    const user = await createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    }).users.getUser(userId);
  }
  
  return {
    isSignedIn: !!userId,
    hasActiveSubscription: !!userId, // Simplified for development
  };
}

interface FeatureTileProps {
  module: typeof featureModules[0];
  isProjections?: boolean;
}

// Cropping configuration for each tile's screenshot
const imageCropping: Record<string, { objectPosition: string; scale: number }> = {
  search: { objectPosition: 'center -4px', scale: 1.3 },
  compare: { objectPosition: 'center -4px', scale: 1.3 },
  projections: { objectPosition: 'center -15px', scale: 1.3 }, // Larger image, less zoom
  financials: { objectPosition: 'center -4px', scale: 1.3 },
  charts: { objectPosition: 'center -4px', scale: 1.3 }
};

// Aspect ratio configuration for each tile's screenshot container
const imageAspectRatio: Record<string, string> = {
  search: '4/3',
  compare: '4/3',
  projections: '4/5', // Taller ratio to show more vertical content
  financials: '4/3',
  charts: '4/3'
};

// Max height configuration for each tile's screenshot container
const imageMaxHeight: Record<string, string> = {
  search: '550px',
  compare: '550px',
  projections: '850px', // Taller to show full projections table
  financials: '550px',
  charts: '550px'
};

// Max width configuration for each tile's screenshot container
const imageMaxWidth: Record<string, string | undefined> = {
  search: undefined,
  compare: undefined,
  projections: undefined, // Narrower to reduce excess white space
  financials: undefined,
  charts: undefined
};

// Border configuration for screenshots (set to false for seamless look)
const showImageBorder = true;

function FeatureTile({ module, isProjections = false }: FeatureTileProps) {
  const cropSettings = imageCropping[module.id] || { objectPosition: 'center -3px', scale: 1.3 };
  const aspectRatio = imageAspectRatio[module.id] || '4/3';
  const maxHeight = imageMaxHeight[module.id] || '550px';
  const maxWidth = imageMaxWidth[module.id];
  return (
    <div 
      className="
        bg-white border border-gray-200
        rounded-xl 
        pt-6 pb-10 px-6 md:pt-6 md:pb-10 md:px-10
        hover:-translate-y-2
        hover:border-blue-600
        transition-all duration-300 ease-out
        flex flex-col h-full
        cursor-pointer
      "
      style={{ 
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)';
      }}
      id={`feature-tile-${module.id}`}
    >
      {/* Header */}
      <div>
        <h3 
          className="font-bold text-gray-900"
          style={{ 
            fontSize: '24px',
            lineHeight: '1.2'
          }}
        >
          {module.header}
        </h3>
      </div>
      
      {/* Screenshot */}
      <div 
        className={`relative overflow-hidden rounded-lg bg-gray-100 ${showImageBorder ? 'border border-gray-200' : ''}`}
        style={{ 
          maxHeight: maxHeight,
          maxWidth: maxWidth,
          minHeight: '300px',
          width: maxWidth || '100%',
          flex: '1 1 auto',
          aspectRatio: aspectRatio,
          marginTop: '24px',
          marginBottom: '24px',
          marginLeft: maxWidth ? 'auto' : '0',
          marginRight: maxWidth ? 'auto' : '0'
        }}
      >
        <img 
          src={module.image.src}
          alt={module.image.alt}
          className="absolute inset-0 w-full h-full"
          style={{
            objectPosition: cropSettings.objectPosition,
            objectFit: 'cover',
            transform: `scale(${cropSettings.scale})`
          }}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/800x600/f3f4f6/6b7280?text=${module.header}`;
            target.style.objectPosition = 'center';
          }}
        />
      </div>
      
      {/* Feature Bullets */}
      <ul className="space-y-3 mb-6">
        {module.features.slice(0, 2).map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-white stroke-[2.5]" />
            </div>
            <span 
              className="text-gray-700" 
              style={{ fontSize: '14px', lineHeight: '1.5' }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>
      
      {/* CTA Button */}
      <div>
        <a 
          href={module.ctaLink}
          className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 transition-all duration-300 ease-out group"
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: 'transparent'
          }}
        >
          {module.ctaText}
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </a>
      </div>
    </div>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { getAuthToken, isSignedIn } = useAuthenticatedFetch();

  useEffect(() => {
    if (isSignedIn) {
      getAuthToken();
    }
  }, [isSignedIn, getAuthToken]);

  // Get modules in the correct order for Bento Box layout
  const searchModule = featureModules.find(m => m.id === 'search')!;
  const compareModule = featureModules.find(m => m.id === 'compare')!;
  const projectionsModule = featureModules.find(m => m.id === 'projections')!;
  const financialsModule = featureModules.find(m => m.id === 'financials')!;
  const chartsModule = featureModules.find(m => m.id === 'charts')!;

  return (
    <>
      <Navbar loaderData={loaderData} />
      
      {/* Hero Section */}
      <section 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse, #f8fafc, #c7d2fe)'
        }}
      >
        <div className="text-center px-4">
          <h1 
            style={{ 
              fontSize: '56px', 
              lineHeight: 1.1,
              marginBottom: '24px'
            }}
          >
            <span style={{ 
                fontWeight: 700,
                color: '#1F2937'
              }}>
                Invest Smarter,
              </span>{' '}
              <span style={{ 
                fontWeight: 700,
                color: '#2463EB'
              }}>
                Not Harder
              </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Made by investors, for investors
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/search"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Start Free Trial
            </a>
            <a
              href="/compare"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              View Features
            </a>
          </div>
        </div>
      </section>

      {/* Bento Box Feature Grid */}
      <main 
        className="py-24 bg-page-background"
        style={{
          marginTop: '0',
          paddingTop: '96px'
        }}
      >
        <div className="mx-auto px-4 md:px-6" style={{ maxWidth: '1400px' }}>
          <div className="grid gap-8">
            
            {/* Row 1: Search and Compare (50/50) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              <FeatureTile module={searchModule} />
              <FeatureTile module={compareModule} />
            </div>
            
            {/* Row 2: Projections (Full width) */}
            <div className="grid grid-cols-1">
              <FeatureTile module={projectionsModule} isProjections={true} />
            </div>
            
            {/* Row 3: Financials and Charts (50/50) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              <FeatureTile module={financialsModule} />
              <FeatureTile module={chartsModule} />
            </div>
            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-footer-background text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Start Making Smarter Investment Decisions</h2>
          <p className="text-gray-400 mb-8">
            Join thousands of investors making data-driven decisions
          </p>
          <a
            href="/search"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Start Free Trial
          </a>
        </div>
      </footer>
    </>
  );
}
