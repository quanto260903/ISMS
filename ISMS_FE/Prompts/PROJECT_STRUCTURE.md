# Warehouse Management System - Project Structure

## 📁 Cấu trúc thư mục

\`\`\`
SWS_FE/
├── app/                          # Next.js App Router - Các pages của ứng dụng
│   ├── dashboard/                # Module Dashboard (protected)
│   │   ├── layout.tsx           # Layout chung: sidebar + header
│   │   ├── page.tsx             # Trang chủ dashboard
│   │   ├── inventory/           # Quản lý kho hàng
│   │   │   └── page.tsx
│   │   ├── products/            # Quản lý sản phẩm
│   │   │   └── page.tsx
│   │   ├── orders/              # Quản lý đơn hàng
│   │   │   └── page.tsx
│   │   ├── reports/             # Báo cáo & thống kê
│   │   │   └── page.tsx
│   │   └── settings/            # Cài đặt hệ thống
│   │       └── page.tsx
│   ├── login/                   # Trang đăng nhập
│   │   └── page.tsx
│   ├── register/                # Trang đăng ký (nếu cần)
│   │   └── page.tsx
│   ├── layout.tsx               # Root layout - wrapper toàn app
│   ├── page.tsx                 # Home page (redirect to login/dashboard)
│   └── globals.css              # Global CSS với Tailwind
│
├── components/                   # React Components tái sử dụng
│   └── ui/                      # UI Components từ shadcn/ui
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── table.tsx
│       └── ...
│
├── lib/                         # Utilities & Core Logic
│   ├── auth.ts                  # Auth Store (Zustand) - quản lý state user/token
│   ├── api.ts                   # Axios client config - API caller
│   └── utils.ts                 # Helper functions (cn, formatters, etc.)
│
├── hooks/                       # Custom React Hooks
│   └── use-toast.ts            # Toast notification hook
│
├── services/                    # API Service Layer - Business Logic
│   ├── authService.ts          # Authentication APIs
│   ├── productService.ts       # Product APIs
│   ├── orderService.ts         # Order APIs
│   └── ...                     # Các services khác
│
├── config/                      # Configuration Files
│   ├── next.config.js          # Next.js configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── postcss.config.js       # PostCSS configuration
│
├── Prompts/                     # Documentation & Development Guides
│   ├── DEVELOPMENT_GUIDE.md    # Hướng dẫn phát triển
│   ├── AI_PROMPTS.md           # Templates cho AI assistant
│   └── PROJECT_STRUCTURE.md    # File này
│
├── middleware.ts                # Next.js Middleware - Auth protection
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies & scripts
├── .env                        # Environment variables (local)
├── .env.example                # Environment template
└── README.md                   # Project overview

DELETED (không còn dùng):
├── ❌ src/                      # Folder cũ của Vite
├── ❌ vite.config.ts            # Vite config
├── ❌ index.html                # Vite entry point
└── ❌ dist/                     # Vite build output
\`\`\`

---

## 🎯 Mô tả chi tiết các thư mục

### 1. **app/** - Next.js App Router
Chứa toàn bộ routes và pages của ứng dụng theo chuẩn App Router của Next.js 14.

**Quy tắc đặt tên:**
- Mỗi folder = 1 route segment
- \`page.tsx\` = trang chính của route đó
- \`layout.tsx\` = layout bao bọc các pages con
- \`loading.tsx\` = loading state (nếu cần)
- \`error.tsx\` = error boundary (nếu cần)

**Ví dụ:**
- \`/app/dashboard/page.tsx\` → route: \`/dashboard\`
- \`/app/dashboard/products/page.tsx\` → route: \`/dashboard/products\`

---

### 2. **components/** - UI Components
Chứa các React components tái sử dụng.

**Cấu trúc:**
- \`ui/\` - Components từ shadcn/ui (Button, Card, Input, Table, etc.)
- Các components tùy chỉnh khác (nếu cần)

**Nguyên tắc:**
- Components trong \`ui/\` không nên bị modify trực tiếp
- Tạo wrapper components nếu cần customize

---

### 3. **lib/** - Core Utilities
Chứa các utilities và core logic của app.

**Files chính:**
- \`auth.ts\` - Zustand store quản lý authentication state
- \`api.ts\` - Axios instance với interceptors cho API calls
- \`utils.ts\` - Helper functions (classnames, formatters, validators)

**Khi nào tạo file mới:**
- Có logic phức tạp cần tách riêng
- Cần share code giữa nhiều components
- Cần utilities mới (date, number, string helpers)

---

### 4. **hooks/** - Custom Hooks
Chứa các custom React hooks.

**Ví dụ:**
- \`use-toast.ts\` - Hook cho toast notifications
- \`use-debounce.ts\` - Debounce hook
- \`use-local-storage.ts\` - Local storage hook

**Nguyên tắc:**
- Hook name phải bắt đầu với \`use\`
- Mỗi hook nên có 1 responsibility rõ ràng
- Export type definitions cùng với hook

---

### 5. **services/** - API Layer
Chứa các service classes gọi APIs.

**Pattern:**
\`\`\`typescript
// services/productService.ts
class ProductService {
  async getAll() { ... }
  async getById(id: number) { ... }
  async create(data: CreateProductDto) { ... }
  async update(id: number, data: UpdateProductDto) { ... }
  async delete(id: number) { ... }
}

export default new ProductService()
\`\`\`

**Lợi ích:**
- Tách biệt API logic khỏi UI components
- Dễ test và maintain
- Type safety với TypeScript
- Centralized error handling

---

### 6. **config/** - Configuration
Chứa các file configuration của project.

**Files:**
- \`next.config.js\` - Next.js config (images, env, etc.)
- \`tailwind.config.js\` - Tailwind CSS theme, plugins
- \`postcss.config.js\` - PostCSS config

**Lưu ý:**
- Files này được symlink ra root folder để tool có thể tìm thấy
- Chỉ edit trong \`config/\` folder

---

### 7. **Prompts/** - Documentation
Chứa tài liệu hướng dẫn phát triển.

**Files:**
- \`DEVELOPMENT_GUIDE.md\` - Hướng dẫn chi tiết development workflow
- \`AI_PROMPTS.md\` - Templates prompts cho AI assistant
- \`PROJECT_STRUCTURE.md\` - File này

---

### 8. **middleware.ts** - Request Middleware
File đặc biệt của Next.js, chạy trước mọi request.

**Chức năng:**
- Kiểm tra authentication (token trong cookies)
- Redirect nếu chưa login
- Protect admin routes
- Add security headers

**Routes được protect:**
- \`/dashboard/*\` - Cần login
- \`/dashboard/settings/*\` - Cần admin role

---

## 🔄 Data Flow

\`\`\`
User Action
    ↓
Component Event Handler
    ↓
Service Method Call
    ↓
API Client (lib/api.ts)
    ↓ (adds auth token)
Backend API
    ↓ (response)
Service Method
    ↓
Component State Update
    ↓
UI Re-render
\`\`\`

---

## 🎨 Styling Convention

**Tailwind CSS Classes:**
- Sử dụng utility classes trực tiếp trong JSX
- Colors: \`blue-*\` (primary), \`gray-*\` (neutral), \`green/orange/red\` (status)
- Spacing: \`gap-4\`, \`gap-6\`, \`p-4\`, \`p-6\`
- Border: \`border-gray-200\`

**Component Variants:**
\`\`\`typescript
// Sử dụng class-variance-authority (cva)
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "...",
        outline: "...",
      }
    }
  }
)
\`\`\`

---

## 📝 Naming Conventions

**Files:**
- Components: \`PascalCase.tsx\` (ProductCard.tsx)
- Utilities: \`camelCase.ts\` (formatDate.ts)
- Services: \`camelCase.ts\` với suffix Service (productService.ts)
- Hooks: \`kebab-case.ts\` (use-toast.ts)

**Variables & Functions:**
- \`camelCase\` cho biến và functions
- \`PascalCase\` cho Components và Types
- \`UPPER_SNAKE_CASE\` cho constants

**Routes:**
- \`kebab-case\` cho folders (dashboard/order-management)
- Tránh nested quá sâu (max 3 levels)

---

## 🚀 Development Workflow

### Tạo feature mới:

1. **Tạo page**: \`app/dashboard/[feature]/page.tsx\`
2. **Tạo service**: \`services/[feature]Service.ts\`
3. **Define types**: Trong service file hoặc \`types/\` folder
4. **Tạo components**: Nếu cần, trong \`components/\`
5. **Update navigation**: Trong \`app/dashboard/layout.tsx\`
6. **Update middleware**: Nếu cần protect route đặc biệt

### Build & Run:

\`\`\`bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Lint code
\`\`\`

---

## 🔒 Environment Variables

**File: \`.env.local\`** (không commit)

\`\`\`bash
NEXT_PUBLIC_API_URL=http://localhost:5555/api
\`\`\`

**Prefix:**
- \`NEXT_PUBLIC_\` - Exposed to browser
- No prefix - Server-only

---

## ✅ Best Practices

1. **Keep it DRY** - Don't Repeat Yourself
2. **Single Responsibility** - Mỗi file/function làm 1 việc
3. **Type Safety** - Luôn define types/interfaces
4. **Error Handling** - Try-catch trong async functions
5. **Loading States** - Show loading UI khi fetch data
6. **Consistent Naming** - Follow conventions
7. **Comment khi cần** - Giải thích "why", không phải "what"

---

**Last Updated**: Nov 8, 2025
**Next.js Version**: 14.2.33
**React Version**: 18.2.0
