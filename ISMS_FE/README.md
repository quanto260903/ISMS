# Warehouse Management System - Frontend

## 🏗️ Project Structure

\`\`\`
SWS_FE/
├── app/              # Pages & Routes (Next.js App Router)
├── components/       # Reusable UI Components  
├── lib/              # Core utilities (auth, api, utils)
├── hooks/            # Custom React Hooks
├── services/         # API Service Layer
├── config/           # Configuration files
├── Prompts/          # Development documentation
└── middleware.ts     # Auth & Route Protection
\`\`\`

## Tech Stack

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/UI** - UI components (built on Radix UI)
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icons

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create environment file:
\`\`\`bash
cp .env.example .env.local
\`\`\`

3. Update the \`.env.local\` file with your API URL:
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:5555/api
\`\`\`

### Development

Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The app will be available at \`http://localhost:3000\`

### Build

Build for production:
\`\`\`bash
npm run build
\`\`\`

Start production server:
\`\`\`bash
npm start
\`\`\`

## 📚 Documentation

Comprehensive documentation available in \`Prompts/\` folder:

- **[PROJECT_STRUCTURE.md](./Prompts/PROJECT_STRUCTURE.md)** - Chi tiết cấu trúc dự án
- **[DEVELOPMENT_GUIDE.md](./Prompts/DEVELOPMENT_GUIDE.md)** - Hướng dẫn phát triển  
- **[AI_PROMPTS.md](./Prompts/AI_PROMPTS.md)** - Templates cho AI assistant

## 📝 Main Routes

- \`/login\` - Login page
- \`/dashboard\` - Main dashboard (protected)
- \`/dashboard/inventory\` - Inventory management
- \`/dashboard/products\` - Product management
- \`/dashboard/orders\` - Order management
- \`/dashboard/reports\` - Reports & Analytics
- \`/dashboard/settings\` - Settings

## Features

- ✅ Next.js 14 App Router
- ✅ TypeScript for type safety
- ✅ Authentication with middleware
- ✅ Clean & organized folder structure
- ✅ Zustand state management with persistence
- ✅ Shadcn/UI components
- ✅ Responsive design
- ✅ Protected routes
- ✅ Toast notifications
- ✅ API integration with interceptors

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint

## 📂 Folder Organization

### Clean & Organized:
- ✅ \`app/\` - All pages and routes
- ✅ \`components/ui/\` - UI components only
- ✅ \`lib/\` - Core utilities (auth, api, utils)
- ✅ \`services/\` - API business logic
- ✅ \`config/\` - All config files
- ✅ \`Prompts/\` - Documentation

### Removed (Old Vite):
- ❌ \`src/\` - Deleted (migrated to Next.js structure)
- ❌ \`vite.config.ts\` - Not needed (using Next.js)
- ❌ \`index.html\` - Not used in Next.js
- ❌ \`dist/\` - Build output moved to \`.next/\`

## Customization

### Adding shadcn/ui Components

\`\`\`bash
npx shadcn-ui@latest add [component-name]
\`\`\`

### Styling

The project uses Tailwind CSS. Configuration in \`config/tailwind.config.js\`

**Design System:**
- Primary: Blue (\`blue-600\`, \`blue-700\`)
- Neutral: Gray (\`gray-50\` to \`gray-900\`)
- Success: Green
- Warning: Orange
- Danger: Red

## 🔒 Authentication

- Cookie-based authentication
- Middleware protection for routes
- Zustand store for auth state
- Automatic token injection in API calls

## 🎯 Next Steps

See [DEVELOPMENT_GUIDE.md](./Prompts/DEVELOPMENT_GUIDE.md) for:
- Creating new pages
- Adding new features
- Working with API services
- Best practices

---

**Version**: 2.0.0 (Next.js Migration)
**Last Updated**: Nov 8, 2025
