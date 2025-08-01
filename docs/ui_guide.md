# Stock Analysis UI Documentation for Claude Code

## Overview
Build a modern stock analysis web application with a clean, professional layout. Focus on creating the basic page structure and navigation first, with placeholder content for each page.

## Design System

### CSS Framework
- **TailwindCSS v4**: Modern utility-first CSS framework
- Use Tailwind classes for all styling
- Responsive design with Tailwind breakpoints
- Clean, modern layout principles

### Typography
- Use Tailwind's default font stack
- Consistent heading hierarchy (text-xl, text-2xl, text-3xl, etc.)
- Readable body text sizes

### Layout Principles
- **Clean spacing**: Use Tailwind spacing utilities (p-4, m-6, etc.)
- **Card-based design**: Group content in clean containers
- **Responsive**: Mobile-first approach with Tailwind breakpoints
- **Professional**: Clean, minimal design

## Application Structure

### Header/Navigation
```
- Logo: "1000XSTOCKS" text logo
- Navigation Menu: SEARCH | COMPARE | EARNINGS CALLS | SEC FILINGS | PROJECTIONS | FINANCIALS | OTHER
- User section: Welcome message, profile icon, logout button
- Responsive navigation (hamburger menu on mobile)
```

### Page Layout
```
Header (Fixed)
├── Main Content Area
│   ├── Page Title
│   ├── Content Container
│   └── Placeholder Content
└── Footer (Optional)
```

## Page Specifications

### 1. Search Page (Landing/Home)
**Purpose**: Main stock search and overview page

**Content**:
- Page title: "Stock Search"
- Placeholder text: "Stock search functionality will be implemented here"
- Empty container for future search components

### 2. Compare Page
**Purpose**: Side-by-side comparison of multiple stocks

**Content**:
- Page title: "Compare Stocks"
- Placeholder text: "Stock comparison functionality will be implemented here"
- Empty container for future comparison components

### 3. Earnings Calls Page
**Purpose**: Access to earnings call transcripts

**Content**:
- Page title: "Earnings Calls"
- Placeholder text: "Earnings call transcript functionality will be implemented here"
- Empty container for future transcript components

### 4. SEC Filings Page
**Purpose**: Access to SEC filing documents

**Content**:
- Page title: "SEC Filings"
- Placeholder text: "SEC filings functionality will be implemented here"
- Empty container for future filing components

### 5. Projections Page
**Purpose**: Custom financial projections calculator

**Content**:
- Page title: "Financial Projections"
- Placeholder text: "Financial projections calculator will be implemented here"
- Empty container for future projection components

### 6. Financials Page
**Purpose**: Detailed financial statements and ratios

**Content**:
- Page title: "Financial Statements"
- Placeholder text: "Financial statements and ratios will be implemented here"
- Empty container for future financial components

### 7. User Profile Page
**Purpose**: User authentication and profile management

**Content**:
- Page title: "User Profile"
- Placeholder text: "User profile and authentication will be implemented here"
- Empty container for future user components

## Technical Requirements

### Frontend Framework
- **React 18+** with TypeScript
- **React Router** for navigation between pages
- **TailwindCSS v4** for all styling
- **Vite** for build tooling (recommended)

### Project Setup
- Create React app with TypeScript template
- Install and configure TailwindCSS v4
- Set up React Router for page navigation
- Create basic project structure

### Responsive Design
- **Mobile**: Hamburger menu, stacked layout
- **Tablet**: Condensed navigation
- **Desktop**: Full horizontal navigation
- Use Tailwind responsive prefixes (sm:, md:, lg:, xl:)

## Basic Component Structure

### Layout Components
Create these basic components for the initial structure:

**Header Component**
- Logo text "1000XSTOCKS"
- Navigation menu with all page links
- User profile section placeholder
- Responsive hamburger menu for mobile

**Navigation Component**
- Links to all 7 pages
- Active page highlighting
- Mobile-friendly dropdown

**Page Layout Component**
- Consistent page structure
- Page title section
- Main content area
- Responsive containers

### Page Components
Create blank page components for:
- SearchPage.tsx
- ComparePage.tsx 
- EarningsPage.tsx
- FilingsPage.tsx
- ProjectionsPage.tsx
- FinancialsPage.tsx
- ProfilePage.tsx

Each page should have:
- Page title
- Placeholder content
- Consistent layout structure

## File Structure
```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── PageLayout.tsx
│   └── common/
│       └── (future components)
├── pages/
│   ├── SearchPage.tsx
│   ├── ComparePage.tsx
│   ├── EarningsPage.tsx
│   ├── FilingsPage.tsx
│   ├── ProjectionsPage.tsx
│   ├── FinancialsPage.tsx
│   └── ProfilePage.tsx
├── styles/
│   └── globals.css (Tailwind imports)
├── App.tsx
├── main.tsx
└── index.html
```

## Implementation Instructions

### Step 1: Project Setup
1. Create new React + TypeScript project using Vite
2. Install TailwindCSS v4 and configure
3. Install React Router DOM
4. Set up basic project structure

### Step 2: Create Layout
1. Build Header component with logo and navigation
2. Create Navigation component with all page links
3. Build PageLayout component for consistent structure
4. Set up routing in App.tsx

### Step 3: Create Blank Pages
1. Create all 7 page components with placeholder content
2. Each page should use the PageLayout component
3. Add proper page titles and basic content structure
4. Ensure all routes work correctly

### Step 4: Styling
1. Use TailwindCSS classes for all styling
2. Make the layout responsive
3. Add hover states and basic interactions
4. Ensure clean, professional appearance

## Success Criteria
- All 7 pages are accessible via navigation
- Clean, professional layout using TailwindCSS
- Responsive design works on mobile, tablet, and desktop
- Proper routing between pages
- Consistent page structure and styling
- Ready for future feature development on individual pages