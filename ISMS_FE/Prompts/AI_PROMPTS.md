# AI Assistant Prompts for WMS Development

## 🤖 Prompt Templates

### 1. Tạo Page Mới (CRUD)

\`\`\`
Tạo cho tôi một trang quản lý [TÊN MODULE] trong Next.js với các yêu cầu:

**Chức năng:**
- Hiển thị danh sách [TÊN MODULE] dạng table
- Tìm kiếm và filter
- Thêm mới [TÊN MODULE]
- Chỉnh sửa [TÊN MODULE]  
- Xóa [TÊN MODULE]
- Pagination

**Cấu trúc dữ liệu:**
- [Field 1]: [Type] (required/optional)
- [Field 2]: [Type] (required/optional)
- ...

**Thiết kế:**
- Sử dụng layout dashboard đã có
- Theme sáng, tối giản, chuyên nghiệp
- Table với border gray-200
- Buttons: Primary (blue), Secondary (gray), Danger (red)
- Modal cho form thêm/sửa

**API Endpoints:**
- GET /api/[module] - Lấy danh sách
- POST /api/[module] - Tạo mới
- PUT /api/[module]/:id - Cập nhật
- DELETE /api/[module]/:id - Xóa

**Files cần tạo:**
- app/(dashboard)/[module]/page.tsx
- services/[module]Service.ts
- components/[module]/[Module]Table.tsx
- components/[module]/[Module]Form.tsx
\`\`\`

**Ví dụ cụ thể:**
\`\`\`
Tạo cho tôi một trang quản lý Products trong Next.js với các yêu cầu:

**Chức năng:**
- Hiển thị danh sách products dạng table
- Tìm kiếm theo tên, SKU
- Filter theo category, status
- Thêm mới product
- Chỉnh sửa product
- Xóa product
- Pagination (20 items/page)

**Cấu trúc dữ liệu:**
- productId: number (auto)
- name: string (required)
- sku: string (required, unique)
- category: string (required)
- price: number (required)
- cost: number (optional)
- stock: number (default: 0)
- minStock: number (default: 0)
- status: 'active' | 'inactive' (default: 'active')
- description: string (optional)
- images: string[] (optional)

**Thiết kế:**
- Sử dụng layout dashboard đã có
- Theme sáng, tối giản, chuyên nghiệp
- Table với border gray-200
- Status badge: green (active), gray (inactive)
- Stock warning: orange (< minStock), red (= 0)

**API Endpoints:**
- GET /api/products - Lấy danh sách
- POST /api/products - Tạo mới
- PUT /api/products/:id - Cập nhật
- DELETE /api/products/:id - Xóa
\`\`\`

---

### 2. Tạo Service Layer

\`\`\`
Tạo service layer cho [MODULE] với các methods:
- getAll(params?: QueryParams)
- getById(id: number)
- create(data: Create[Module]Dto)
- update(id: number, data: Update[Module]Dto)
- delete(id: number)

Sử dụng apiClient từ @/lib/api
Handle errors và return typed responses
Add JSDoc comments

Interface/Types:
[Paste cấu trúc dữ liệu]
\`\`\`

---

### 3. Tạo Form Component

\`\`\`
Tạo form component cho [MODULE] với:
- Validation bằng React Hook Form + Zod
- Fields: [list fields với type]
- Submit handler với loading state
- Error handling với toast notifications
- Cancel button
- Sử dụng shadcn/ui components

Style: Clean, minimal, wide layout phù hợp warehouse management
\`\`\`

---

### 4. Tạo Table Component

\`\`\`
Tạo data table component cho [MODULE] với:
- Columns: [list columns]
- Sortable columns
- Row actions (Edit, Delete)
- Selection với checkboxes
- Loading state với skeleton
- Empty state
- Sử dụng shadcn/ui Table

Style: Professional, clean, gray borders, consistent spacing
\`\`\`

---

### 5. Refactor Code

\`\`\`
Refactor đoạn code sau để:
- Tối ưu performance
- Improve type safety
- Tách logic ra custom hooks
- Sử dụng best practices của Next.js 14
- Thêm error handling
- Thêm loading states

[Paste code cần refactor]
\`\`\`

---

### 6. Fix Bug

\`\`\`
Tôi đang gặp lỗi:
[Paste error message]

Context:
- File: [file path]
- Component/Function: [name]
- Expected behavior: [mô tả]
- Current behavior: [mô tả]

Code liên quan:
[Paste code]

Hãy giúp tôi fix lỗi này và giải thích nguyên nhân.
\`\`\`

---

### 7. Tạo Dashboard Widget

\`\`\`
Tạo dashboard widget hiển thị [METRIC] với:
- Card component từ shadcn/ui
- Icon phù hợp từ lucide-react
- Value với số lớn (format number)
- Change percentage với trend (up/down)
- Mini chart nếu có data
- Loading state
- Click để navigate đến detail page

Style: Clean card, icon with colored background, clear typography
Colors: [specify colors based on metric type]
\`\`\`

---

### 8. Implement Authentication

\`\`\`
Implement authentication flow cho:
- Login page với email/password
- Register page
- Social login (Google, GitHub)
- Protected routes với middleware
- Auth store với Zustand
- Token management với cookies
- Logout functionality

Sử dụng:
- Next.js middleware
- Cookie-based sessions
- API: [paste API endpoints]
\`\`\`

---

### 9. Optimize Performance

\`\`\`
Optimize performance cho page/component:
[Paste component code]

Yêu cầu:
- Lazy load components nếu cần
- Memoize expensive calculations
- Optimize re-renders
- Add pagination/virtualization cho long lists
- Image optimization
- Code splitting
\`\`\`

---

### 10. Create API Route Handler

\`\`\`
Tạo API route handler trong Next.js 14 cho:
- Endpoint: [method] /api/[path]
- Logic: [mô tả logic]
- Authentication required: yes/no
- Request body schema: [schema]
- Response schema: [schema]

Sử dụng:
- Next.js Route Handlers
- Zod validation
- Error handling
- Type safety
\`\`\`

---

## 🎯 Context-Aware Prompts

### Khi Chat về Architecture

\`\`\`
Architecture hiện tại:
- Frontend: Next.js 14 App Router
- State: Zustand với persist
- Styling: Tailwind CSS + shadcn/ui
- Auth: Cookie-based với middleware
- API: REST với axios client

[Your question về architecture]
\`\`\`

### Khi Chat về Styling

\`\`\`
Design system của dự án:
- Theme: Light, minimal, professional warehouse management
- Colors: Blue (primary), Gray (neutral), Green/Orange/Red (status)
- Layout: Wide, maximize data display space
- Typography: Inter font, clear hierarchy
- Components: shadcn/ui với Radix UI

[Your question về styling]
\`\`\`

### Khi Chat về Data Flow

\`\`\`
Data flow pattern:
1. Component calls service
2. Service uses apiClient (with interceptors)
3. apiClient adds auth token from cookies
4. Response flows back to component
5. Component updates local state
6. UI re-renders

[Your question về data flow]
\`\`\`

---

## 🚀 Quick Commands

### Tạo nhanh một module hoàn chỉnh
\`\`\`
Tạo module [MODULE_NAME] hoàn chỉnh với:
1. Page với CRUD operations
2. Service layer
3. Form component với validation
4. Table component
5. Types/Interfaces
6. Add vào navigation

Theo structure và style của dự án hiện tại.
\`\`\`

### Review code
\`\`\`
Review code sau và suggest improvements về:
- Performance
- Type safety
- Best practices
- Security
- Accessibility
- Code organization

[Paste code]
\`\`\`

### Generate types from API
\`\`\`
Generate TypeScript interfaces từ API response:

[Paste API response JSON]

Tạo:
- Interface cho entity
- DTO cho create
- DTO cho update
- Query params interface
\`\`\`

---

## 💡 Tips for Better Prompts

1. **Cung cấp context đầy đủ**: File paths, dependencies, existing code
2. **Mô tả rõ requirements**: Chức năng, validation, error handling
3. **Specify style**: Nói rõ design pattern và coding style
4. **Include examples**: Đưa ra ví dụ về input/output mong muốn
5. **Break down complex tasks**: Chia nhỏ task phức tạp thành nhiều steps

---

## 📋 Checklist Template

Khi tạo feature mới:

\`\`\`
- [ ] Create page component in app/(dashboard)/[feature]/
- [ ] Create service in services/[feature]Service.ts
- [ ] Define types/interfaces
- [ ] Implement API calls
- [ ] Create form component with validation
- [ ] Create table/list component
- [ ] Add to navigation
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Add to middleware if protected
- [ ] Test authentication flow
- [ ] Test CRUD operations
- [ ] Responsive design
- [ ] Accessibility (a11y)
\`\`\`

---

**Lưu ý**: Thay thế [TÊN MODULE], [FIELD], [TYPE] bằng giá trị cụ thể khi sử dụng prompts.
