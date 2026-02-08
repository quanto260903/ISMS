# Warehouse Management System (WMS) - Development Guide

## 📋 Tổng quan dự án

Dự án Warehouse Management System là hệ thống quản lý kho hàng được xây dựng với:
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: ASP.NET Core (SWS_BE)
- **State Management**: Zustand với persist middleware
- **UI Components**: Shadcn/ui (Radix UI primitives)

## 🏗️ Cấu trúc dự án

\`\`\`
SWS_FE/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Dashboard layout group
│   │   ├── layout.tsx           # Layout chính với sidebar & header
│   │   ├── dashboard/           # Trang dashboard
│   │   ├── inventory/           # Quản lý kho
│   │   ├── products/            # Quản lý sản phẩm
│   │   ├── orders/              # Quản lý đơn hàng
│   │   └── settings/            # Cài đặt
│   ├── login/                   # Trang đăng nhập
│   ├── register/                # Trang đăng ký
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Trang chủ (redirect to login)
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ui/                      # Shadcn/ui components
│   └── layout/                  # Layout components
├── lib/                         # Utilities & configs
│   ├── auth.ts                  # Auth store với Zustand
│   ├── api.ts                   # Axios client configuration
│   └── utils.ts                 # Helper functions
├── hooks/                       # Custom React hooks
├── services/                    # API service layer
│   ├── authService.ts          # Authentication services
│   ├── productService.ts       # Product services
│   └── dashboardService.ts     # Dashboard services
├── middleware.ts                # Next.js middleware cho auth
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
\`\`\`

## 🔐 Authentication Flow

### 1. Middleware Protection
File \`middleware.ts\` bảo vệ routes:

\`\`\`typescript
// Public routes (không cần auth)
const publicRoutes = ['/login', '/register']

// Protected routes (cần auth)
const protectedRoutes = ['/dashboard', '/inventory', '/products', '/orders', '/settings']

// Admin only routes
const adminRoutes = ['/settings/users', '/settings/roles']
\`\`\`

### 2. Auth Store (Zustand)
File \`lib/auth.ts\` quản lý state:

\`\`\`typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}
\`\`\`

**Sử dụng trong component:**
\`\`\`typescript
import { useAuthStore } from '@/lib/auth'

const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore()
\`\`\`

### 3. Login Flow
\`\`\`typescript
// 1. User submit form
const handleLogin = async (email, password) => {
  const response = await authService.login({ email, password })
  
  // 2. Lưu token và user vào store
  setAuth(response.token, response.user)
  
  // 3. Store tự động lưu vào cookie và localStorage
  // 4. Middleware sẽ kiểm tra cookie và cho phép truy cập
  
  // 5. Redirect to dashboard
  router.push('/dashboard')
}
\`\`\`

### 4. Logout Flow
\`\`\`typescript
const handleLogout = () => {
  clearAuth() // Xóa token khỏi cookies và localStorage
  window.location.href = '/login'
}
\`\`\`

## 🎨 Theme & Design System

### Color Palette (Tối ưu cho Warehouse Management)
- **Primary**: Blue (Professional, Trust) - \`blue-600\`, \`blue-700\`
- **Success**: Green - \`green-600\` (Completed, In Stock)
- **Warning**: Orange - \`orange-600\` (Low Stock, Pending)
- **Danger**: Red - \`red-600\` (Critical, Out of Stock)
- **Neutral**: Gray - \`gray-50\` to \`gray-900\` (Background, Text)

### Layout Philosophy
- **Wide Layout**: Tối đa không gian hiển thị cho tables và data
- **Minimal Colors**: Ít màu sắc nhưng nổi bật ở những chỗ quan trọng
- **Clean Design**: Focus vào data, không có decoration phức tạp
- **Consistent Spacing**: Sử dụng \`gap-4\`, \`gap-6\` cho spacing
- **Clear Hierarchy**: H1 (32px), H2 (24px), Body (14px)

### Components
\`\`\`typescript
// Card cho stats
<Card className="border-gray-200">
  <CardContent className="pt-6">
    {/* Content */}
  </CardContent>
</Card>

// Button variants
<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary Action</Button>
<Button variant="ghost">Tertiary Action</Button>

// Status badges
<Badge className="bg-green-100 text-green-700">Active</Badge>
<Badge className="bg-red-100 text-red-700">Inactive</Badge>
\`\`\`

## 📡 API Integration

### API Client Setup
File \`lib/api.ts\`:

\`\`\`typescript
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api',
  timeout: 10000,
})

// Request interceptor - thêm token
apiClient.interceptors.request.use((config) => {
  const token = getCookie('token')
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`
  }
  return config
})

// Response interceptor - xử lý errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
\`\`\`

### Service Layer Pattern
\`\`\`typescript
// services/productService.ts
class ProductService {
  async getAll() {
    const response = await apiClient.get('/products')
    return response.data
  }
  
  async getById(id: number) {
    const response = await apiClient.get(\`/products/\${id}\`)
    return response.data
  }
  
  async create(data: CreateProductDto) {
    const response = await apiClient.post('/products', data)
    return response.data
  }
  
  async update(id: number, data: UpdateProductDto) {
    const response = await apiClient.put(\`/products/\${id}\`, data)
    return response.data
  }
  
  async delete(id: number) {
    const response = await apiClient.delete(\`/products/\${id}\`)
    return response.data
  }
}

export default new ProductService()
\`\`\`

### Usage in Components
\`\`\`typescript
'use client'

import { useState, useEffect } from 'react'
import productService from '@/services/productService'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadProducts()
  }, [])
  
  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getAll()
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      {/* Render products */}
    </div>
  )
}
\`\`\`

## 🚀 Development Workflow

### 1. Tạo Page Mới

\`\`\`bash
# Tạo folder trong (dashboard) group
mkdir -p app/(dashboard)/inventory
touch app/(dashboard)/inventory/page.tsx
\`\`\`

\`\`\`typescript
// app/(dashboard)/inventory/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 mt-1">Manage your warehouse inventory</p>
        </div>
        <Button>Add Product</Button>
      </div>
      
      {/* Page content */}
    </div>
  )
}
\`\`\`

### 2. Tạo Service Mới

\`\`\`typescript
// services/inventoryService.ts
import apiClient from '@/lib/api'

interface Inventory {
  id: number
  productId: number
  quantity: number
  location: string
}

class InventoryService {
  async getAll(): Promise<Inventory[]> {
    const response = await apiClient.get('/inventory')
    return response.data
  }
  
  async updateQuantity(id: number, quantity: number) {
    const response = await apiClient.patch(\`/inventory/\${id}\`, { quantity })
    return response.data
  }
}

export default new InventoryService()
\`\`\`

### 3. Thêm Navigation

Edit \`app/(dashboard)/layout.tsx\`:

\`\`\`typescript
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Warehouse },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
]
\`\`\`

## 🧪 Best Practices

### 1. Component Structure
\`\`\`typescript
'use client' // Chỉ cần cho components có state/effects

import { useState } from 'react'
import { Component } from '@/components/ui/component'

interface Props {
  // Define props
}

export default function MyComponent({ }: Props) {
  // 1. Hooks
  const [state, setState] = useState()
  
  // 2. Effects
  useEffect(() => {
    // ...
  }, [])
  
  // 3. Handlers
  const handleClick = () => {
    // ...
  }
  
  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
\`\`\`

### 2. Error Handling
\`\`\`typescript
try {
  const data = await service.getData()
  setData(data)
} catch (error) {
  console.error('Error:', error)
  toast({
    variant: 'destructive',
    title: 'Error',
    description: error.message || 'Something went wrong'
  })
}
\`\`\`

### 3. Loading States
\`\`\`typescript
if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  )
}
\`\`\`

### 4. Type Safety
\`\`\`typescript
// Luôn define types/interfaces
interface Product {
  id: number
  name: string
  price: number
  stock: number
}

// Sử dụng trong functions
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}
\`\`\`

## 📝 Common Tasks

### Thêm Protected Route Mới
1. Tạo page trong \`app/(dashboard)/\`
2. Route sẽ tự động được protect bởi layout
3. Không cần thêm gì vào middleware

### Thêm Admin Only Route
1. Thêm path vào \`adminRoutes\` trong \`middleware.ts\`
2. Middleware sẽ check \`userRole === '1'\`

### Thêm UI Component Mới
\`\`\`bash
# Sử dụng shadcn/ui CLI
npx shadcn-ui@latest add [component-name]
\`\`\`

### Update API Base URL
Edit \`.env.local\`:
\`\`\`
NEXT_PUBLIC_API_URL=http://your-backend-url/api
\`\`\`

## 🐛 Troubleshooting

### Token không được gửi trong request
- Kiểm tra cookie đã được set chưa (DevTools > Application > Cookies)
- Kiểm tra interceptor trong \`lib/api.ts\`

### Middleware không hoạt động
- Kiểm tra \`matcher\` config trong \`middleware.ts\`
- Kiểm tra cookie name đúng chưa

### Component không re-render khi state change
- Kiểm tra đã wrap component bằng \`'use client'\` chưa
- Kiểm tra dependencies trong useEffect

### Build lỗi
\`\`\`bash
# Clear cache và rebuild
rm -rf .next
npm run build
\`\`\`

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🎯 Next Steps

1. ✅ Setup middleware authentication
2. ✅ Create dashboard layout
3. 🔄 Implement inventory management
4. 🔄 Implement product management
5. 🔄 Implement order management
6. 🔄 Add reports and analytics
7. 🔄 Add user management (admin only)

---

**Note**: File này nên được cập nhật thường xuyên khi có thay đổi lớn trong dự án.
