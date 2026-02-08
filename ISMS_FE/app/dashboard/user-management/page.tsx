'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser
} from '@/services/api/user-management.api'
import type { UserDto, CreateUserRequest, UpdateUserRequest } from '@/lib/types/user.types'
import { getRoleName, getRoleOptions, UserRole } from '@/lib/types/user.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
    UserPlus,
    Search,
    Edit,
    Trash2,
    Filter,
    ChevronLeft,
    ChevronRight,
    Eye,
    Mail,
    Phone,
    MapPin,
    Shield,
} from 'lucide-react'
import { toast } from 'sonner'

export default function UserManagementPage() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useAuthStore()
    const [users, setUsers] = useState<UserDto[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<number | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalUsers, setTotalUsers] = useState(0)
    const pageSize = 10
    const [hasHydrated, setHasHydrated] = useState(false)

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserDto | null>(null)

    // Form states
    const [createForm, setCreateForm] = useState<CreateUserRequest>({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        address: '',
        role: 3, // Default to Staff
    })

    const [editForm, setEditForm] = useState<UpdateUserRequest>({
        fullName: '',
        phone: '',
        address: '',
        role: 3,
    })

    // Wait for Zustand to hydrate from localStorage
    useEffect(() => {
        setHasHydrated(true)
    }, [])

    // Check authorization - only redirect if user is loaded and doesn't have permission
    useEffect(() => {
        // Don't check authorization while auth is loading or before hydration
        if (authLoading || !hasHydrated) return;

        // If user is loaded but doesn't have permission, redirect
        if (!user || (user.role !== UserRole.Admin && user.role !== UserRole.Manager)) {
            router.push('/unauthorized')
        }
    }, [user, authLoading, hasHydrated, router])

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await getUsers({
                pageIndex: currentPage,
                pageSize,
                search: searchTerm || undefined,
                roleFilter: roleFilter,
            })

            if (response.isSuccess && response.data) {
                setUsers(response.data.items)
                setTotalPages(response.data.totalPages)
                setTotalUsers(response.data.total)
            }
        } catch (error: any) {
            toast.error('Lỗi khi tải danh sách người dùng', {
                description: error.response?.data?.message || 'Vui lòng thử lại sau'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user && (user.role === UserRole.Admin || user.role === UserRole.Manager)) {
            fetchUsers()
        }
    }, [currentPage, searchTerm, roleFilter, user])

    // Handle create user
    const handleCreateUser = async () => {
        try {
            const response = await createUser(createForm)
            if (response.isSuccess) {
                toast.success('Tạo người dùng thành công')
                setCreateDialogOpen(false)
                setCreateForm({
                    email: '',
                    password: '',
                    fullName: '',
                    phone: '',
                    address: '',
                    role: 3,
                })
                fetchUsers()
            }
        } catch (error: any) {
            toast.error('Lỗi khi tạo người dùng', {
                description: error.response?.data?.message || 'Vui lòng thử lại sau'
            })
        }
    }

    // Handle update user
    const handleUpdateUser = async () => {
        if (!selectedUser) return

        try {
            const response = await updateUser(selectedUser.userId, editForm)
            if (response.isSuccess) {
                toast.success('Cập nhật người dùng thành công')
                setEditDialogOpen(false)
                setSelectedUser(null)
                fetchUsers()
            }
        } catch (error: any) {
            toast.error('Lỗi khi cập nhật người dùng', {
                description: error.response?.data?.message || 'Vui lòng thử lại sau'
            })
        }
    }

    // Handle delete user
    const handleDeleteUser = async () => {
        if (!selectedUser) return

        try {
            const response = await deleteUser(selectedUser.userId)
            if (response.isSuccess) {
                toast.success('Xóa người dùng thành công')
                setDeleteDialogOpen(false)
                setSelectedUser(null)
                fetchUsers()
            }
        } catch (error: any) {
            toast.error('Lỗi khi xóa người dùng', {
                description: error.response?.data?.message || 'Vui lòng thử lại sau'
            })
        }
    }

    // Open edit dialog
    const openEditDialog = (user: UserDto) => {
        setSelectedUser(user)
        setEditForm({
            fullName: user.fullName,
            phone: user.phone || '',
            address: user.address || '',
            role: user.role,
        })
        setEditDialogOpen(true)
    }

    // Open delete dialog
    const openDeleteDialog = (user: UserDto) => {
        setSelectedUser(user)
        setDeleteDialogOpen(true)
    }

    // Open view dialog
    const openViewDialog = (user: UserDto) => {
        setSelectedUser(user)
        setViewDialogOpen(true)
    }

    // Get role badge color
    const getRoleBadgeColor = (role: number) => {
        switch (role) {
            case 1: return 'bg-gradient-to-r from-purple-600 to-pink-600'
            case 2: return 'bg-gradient-to-r from-blue-600 to-cyan-600'
            case 3: return 'bg-gradient-to-r from-green-600 to-teal-600'
            case 4: return 'bg-gradient-to-r from-orange-600 to-amber-600'
            default: return 'bg-gray-600'
        }
    }

    const isAdmin = user?.role === UserRole.Admin

    // Show loading while checking auth or waiting for hydration
    if (authLoading || !hasHydrated) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
                        Quản lý Người dùng
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Quản lý tài khoản và phân quyền người dùng trong hệ thống
                    </p>
                </div>
                {isAdmin && (
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-700 hover:to-teal-600"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Tạo người dùng mới
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Tìm kiếm theo email, tên..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-10"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select
                            value={roleFilter?.toString() || 'all'}
                            onValueChange={(value) => {
                                setRoleFilter(value === 'all' ? undefined : parseInt(value))
                                setCurrentPage(1)
                            }}
                        >
                            <SelectTrigger>
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Lọc theo vai trò" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả vai trò</SelectItem>
                                <SelectItem value="1">Admin</SelectItem>
                                <SelectItem value="2">Manager</SelectItem>
                                <SelectItem value="3">Warehouse Staff</SelectItem>
                                <SelectItem value="4">Provider/Supplier</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">ID</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Họ và tên</TableHead>
                            <TableHead className="font-semibold">Số điện thoại</TableHead>
                            <TableHead className="font-semibold">Vai trò</TableHead>
                            <TableHead className="font-semibold text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Không tìm thấy người dùng nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.userId} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">{user.userId}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            {user.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.fullName}</TableCell>
                                    <TableCell>
                                        {user.phone ? (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                {user.phone}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${getRoleBadgeColor(user.role)} text-white border-0`}>
                                            {user.roleName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openViewDialog(user)}
                                                className="hover:bg-blue-50 hover:text-blue-600"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {isAdmin && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditDialog(user)}
                                                        className="hover:bg-green-50 hover:text-green-600"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openDeleteDialog(user)}
                                                        className="hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">
                        Trang {currentPage} / {totalPages} - Tổng {totalUsers} người dùng
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create User Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tạo người dùng mới</DialogTitle>
                        <DialogDescription>
                            Nhập thông tin để tạo tài khoản người dùng mới
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-email">Email *</Label>
                            <Input
                                id="create-email"
                                type="email"
                                placeholder="user@example.com"
                                value={createForm.email}
                                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-password">Mật khẩu *</Label>
                            <Input
                                id="create-password"
                                type="password"
                                placeholder="Tối thiểu 6 ký tự"
                                value={createForm.password}
                                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-fullname">Họ và tên *</Label>
                            <Input
                                id="create-fullname"
                                placeholder="Nguyễn Văn A"
                                value={createForm.fullName}
                                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-phone">Số điện thoại</Label>
                            <Input
                                id="create-phone"
                                placeholder="0123456789"
                                value={createForm.phone}
                                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-address">Địa chỉ</Label>
                            <Input
                                id="create-address"
                                placeholder="123 Đường ABC, Quận XYZ"
                                value={createForm.address}
                                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-role">Vai trò *</Label>
                            <Select
                                value={createForm.role.toString()}
                                onValueChange={(value) => setCreateForm({ ...createForm, role: parseInt(value) })}
                            >
                                <SelectTrigger id="create-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {getRoleOptions().map((option) => (
                                        <SelectItem key={option.value} value={option.value.toString()}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleCreateUser}
                            className="bg-gradient-to-r from-purple-600 to-teal-500"
                            disabled={!createForm.email || !createForm.password || !createForm.fullName}
                        >
                            Tạo người dùng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
                        <DialogDescription>
                            Cập nhật thông tin người dùng
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-fullname">Họ và tên *</Label>
                            <Input
                                id="edit-fullname"
                                placeholder="Nguyễn Văn A"
                                value={editForm.fullName}
                                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Số điện thoại</Label>
                            <Input
                                id="edit-phone"
                                placeholder="0123456789"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-address">Địa chỉ</Label>
                            <Input
                                id="edit-address"
                                placeholder="123 Đường ABC, Quận XYZ"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Vai trò *</Label>
                            <Select
                                value={editForm.role.toString()}
                                onValueChange={(value) => setEditForm({ ...editForm, role: parseInt(value) })}
                            >
                                <SelectTrigger id="edit-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {getRoleOptions().map((option) => (
                                        <SelectItem key={option.value} value={option.value.toString()}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleUpdateUser}
                            className="bg-gradient-to-r from-purple-600 to-teal-500"
                            disabled={!editForm.fullName}
                        >
                            Cập nhật
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser?.fullName}</strong>?
                            <br />
                            Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleDeleteUser}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Xóa người dùng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View User Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chi tiết người dùng</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-teal-500 rounded-full flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">
                                        {selectedUser.fullName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedUser.fullName}</h3>
                                    <Badge className={`${getRoleBadgeColor(selectedUser.role)} text-white border-0`}>
                                        {selectedUser.roleName}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-3 border-t pt-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{selectedUser.email}</p>
                                    </div>
                                </div>
                                {selectedUser.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Số điện thoại</p>
                                            <p className="font-medium">{selectedUser.phone}</p>
                                        </div>
                                    </div>
                                )}
                                {selectedUser.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Địa chỉ</p>
                                            <p className="font-medium">{selectedUser.address}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">User ID</p>
                                        <p className="font-medium">#{selectedUser.userId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                            Đóng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
