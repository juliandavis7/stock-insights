# Stock Insights Platform

A modern, full-stack financial analytics platform built with React Router v7, Clerk, and Polar.sh. Features advanced stock metrics calculation using Method 1C GAAP-adjusted EPS analysis, real-time data processing, and AI-powered insights.

## Features

- 🚀 **React Router v7** - Modern full-stack React framework with SSR
- ⚡️ **Hot Module Replacement (HMR)** - Fast development experience
- 📦 **Asset bundling and optimization** - Production-ready builds
- 🔄 **Data loading and mutations** - Built-in loader/action patterns
- 🔒 **TypeScript by default** - Type safety throughout
- 🎨 **TailwindCSS v4** - Modern utility-first CSS
- 🔐 **Authentication with Clerk** - Complete user management
- 💳 **Subscription management with Polar.sh** - Billing and payments
- 🗄️ **FastAPI Backend** - High-performance Python API
- 🤖 **AI Chat Integration** - OpenAI-powered financial insights
- 📊 **Advanced Stock Analytics** - Method 1C GAAP-adjusted calculations
- 📈 **Interactive Charts** - Real-time financial data visualization
- 🎯 **Financial Projections** - AI-powered earnings forecasts
- 📱 **Responsive Design** - Mobile-first approach 
- 🚢 **Vercel Deployment Ready** - One-click deployment

## Financial Analytics Features

- **Method 1C GAAP-Adjusted EPS Growth** - Advanced hybrid calculation methodology
- **P/E Ratio Analysis** - TTM, Forward, and Two-year projections
- **Revenue Growth Metrics** - Current and next-year analysis
- **Margin Analysis** - Gross and net margin calculations
- **P/S Ratio Analysis** - Price-to-sales metrics
- **Real-time Data Integration** - AlphaVantage integration
- **Mock Data Support** - Development mode with embedded financial data

## Tech Stack

### Frontend
- **React Router v7** - Full-stack React framework
- **TailwindCSS v4** - Utility-first CSS framework
- **shadcn/ui** - Modern component library with Radix UI
- **Lucide React & Tabler Icons** - Beautiful icon libraries
- **Recharts** - Financial data visualization
- **Motion** - Smooth animations

### Backend & Services
- **FastAPI** - High-performance Python backend API
- **Clerk** - Authentication and user management
- **Polar.sh** - Subscription billing and payments
- **OpenAI** - AI-powered financial insights
- **AlphaVantage API** - Market data integration

### Development & Deployment
- **Vite** - Fast build tool
- **TypeScript** - Type safety
- **Vercel** - Deployment platform

## Getting Started

### Prerequisites

- Node.js 18+ 
- Clerk account for authentication
- Polar.sh account for subscriptions
- OpenAI API key (for AI chat features)
- AlphaVantage API key (for market data)
- Python 3.8+ (for FastAPI backend)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment file and configure your credentials:

```bash
cp .env.example .env
```

3. Set up your environment variables in `.env`:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Polar.sh Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_ORGANIZATION_ID=your_polar_organization_id_here
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret_here

# OpenAI Configuration (for AI chat)
OPENAI_API_KEY=your_openai_api_key_here

# Financial Data APIs
ALPHAVANTAGE_API_KEY=your_alphavantage_api_key_here

# FastAPI Backend URL
VITE_API_BASE_URL=http://127.0.0.1:8000

# Frontend URL for redirects
VITE_FRONTEND_URL=http://localhost:5173
```

4. Start your FastAPI backend (in separate repository):

```bash
# In your FastAPI repository
uvicorn main:app --reload --port 8000
```

5. Set up your Polar.sh webhook endpoint:
   - URL: `{your_domain}/webhook/polar`
   - Events: All subscription events

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your frontend application will be available at `http://localhost:5173`.
Make sure your FastAPI backend is running on `http://localhost:8000`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Vercel Deployment (Recommended)

This starter kit is optimized for Vercel deployment with the `@vercel/react-router` preset:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

The `react-router.config.ts` includes the Vercel preset for seamless deployment.

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Architecture

### Key Routes
- `/` - Homepage with pricing
- `/pricing` - Dynamic pricing page
- `/dashboard` - Protected user dashboard
- `/dashboard/chat` - AI-powered financial chat interface
- `/dashboard/settings` - User settings
- `/charts` - Interactive financial charts
- `/financials` - Financial statements analysis
- `/projections` - Earnings projections and forecasts
- `/compare` - Stock comparison tools
- `/search` - Stock search and discovery
- `/success` - Subscription success page
- `/webhook/polar` - Polar.sh webhook handler

### Key Components

#### Authentication & Authorization
- Protected routes with Clerk authentication
- Server-side user data loading with loaders
- Automatic user synchronization

#### Subscription Management
- Dynamic pricing cards fetched from Polar.sh
- Secure checkout flow with redirect handling
- Real-time subscription status updates
- Customer portal for subscription management
- Webhook handling for payment events

#### Dashboard Features
- Interactive sidebar navigation
- Real-time data updates
- User profile management
- AI chat functionality
- Subscription status display

#### Financial Analytics Engine
- Method 1C GAAP-adjusted EPS calculations
- Real-time stock metrics processing
- P/E ratio and growth analysis
- Revenue and margin calculations
- Financial data caching and optimization
- Mock data support for development

#### AI Chat Integration
- OpenAI-powered financial conversations
- Real-time message streaming
- Chat history persistence
- Context-aware financial insights
- Responsive chat interface

## Environment Variables

### Required for Production

- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `POLAR_ACCESS_TOKEN` - Polar.sh API access token
- `POLAR_ORGANIZATION_ID` - Your Polar.sh organization ID
- `POLAR_WEBHOOK_SECRET` - Polar.sh webhook secret
- `OPENAI_API_KEY` - OpenAI API key for chat features
- `ALPHAVANTAGE_API_KEY` - AlphaVantage API key
- `VITE_API_BASE_URL` - Your FastAPI backend URL
- `VITE_FRONTEND_URL` - Your production frontend URL

## Project Structure

```
├── app/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── homepage/      # Homepage sections
│   │   └── dashboard/     # Dashboard components
│   ├── routes/            # React Router routes
│   └── utils/             # Utility functions
├── public/                # Static assets
└── docs/                  # Documentation
```

## Key Dependencies

- `react` & `react-dom` v19 - Latest React
- `react-router` v7 - Full-stack React framework
- `@clerk/react-router` - Authentication
- `@polar-sh/sdk` - Subscription management
- `@ai-sdk/openai` & `ai` - AI chat capabilities
- `@vercel/react-router` - Vercel deployment
- `tailwindcss` v4 - Styling
- `@radix-ui/*` - UI primitives

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript checks

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

**Advanced Financial Analytics Platform** - Built with cutting-edge technology stack for real-time stock analysis, Method 1C GAAP-adjusted calculations, and AI-powered insights.

Built with ❤️ using React Router v7, FastAPI, Clerk, Polar.sh, and OpenAI.