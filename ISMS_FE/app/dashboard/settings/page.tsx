'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { User, Lock, Save, Mail, Phone, MapPin, Shield } from 'lucide-react'
import { getCurrentUserProfile, updateUserProfile, changePassword } from '@/services/api/user.api'
import type { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '@/lib/types/user.types'

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    address: '',
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await getCurrentUserProfile()
      if (response.isSuccess && response.data) {
        setProfile(response.data)
        setProfileForm({
          username: response.data.username || '',
          email: response.data.email || '',
          fullName: response.data.fullName || '',
          phoneNumber: response.data.phoneNumber || '',
          address: response.data.address || '',
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải thông tin tài khoản',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile) return

    if (!profileForm.email || !profileForm.fullName) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Email và Họ tên là bắt buộc',
      })
      return
    }

    try {
      setIsSaving(true)
      const data: UpdateProfileRequest = {
        username: profileForm.username,
        email: profileForm.email,
        fullName: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber || undefined,
        address: profileForm.address || undefined,
      }

      const response = await updateUserProfile(profile.userId, data)
      if (response.isSuccess) {
        toast({
          title: 'Thành công',
          description: 'Cập nhật thông tin thành công',
        })
        fetchProfile()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể cập nhật thông tin',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Mật khẩu xác nhận không khớp',
      })
      return
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Mật khẩu mới không được trùng với mật khẩu cũ',
      })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      })
      return
    }

    try {
      setIsSaving(true)
      const data: ChangePasswordRequest = {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      }

      const response = await changePassword(data)
      if (response.isSuccess) {
        toast({
          title: 'Thành công',
          description: 'Đổi mật khẩu thành công',
        })
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể đổi mật khẩu',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-3xl font-bold text-transparent">
          Cài Đặt Tài Khoản
        </h1>
        <p className="mt-1 text-gray-500">Quản lý thông tin cá nhân và bảo mật</p>
      </div>

      {/* Profile Overview Card */}
      {profile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profile.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-2xl">{profile.fullName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={profile.roleId === 1 ? 'default' : 'secondary'}>
                <Shield className="mr-1 h-3 w-3" />
                {profile.roleName}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Thông tin
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Bảo mật
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật thông tin tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">
                      <User className="inline mr-2 h-4 w-4" />
                      Tên đăng nhập
                    </Label>
                    <Input
                      id="username"
                      value={profileForm.username}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, username: e.target.value })
                      }
                      placeholder="Nhập tên đăng nhập"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="inline mr-2 h-4 w-4" />
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, email: e.target.value })
                      }
                      placeholder="Nhập email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Họ và tên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={profileForm.fullName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, fullName: e.target.value })
                      }
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">
                      <Phone className="inline mr-2 h-4 w-4" />
                      Số điện thoại
                    </Label>
                    <Input
                      id="phoneNumber"
                      value={profileForm.phoneNumber}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phoneNumber: e.target.value })
                      }
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">
                      <MapPin className="inline mr-2 h-4 w-4" />
                      Địa chỉ
                    </Label>
                    <Input
                      id="address"
                      value={profileForm.address}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, address: e.target.value })
                      }
                      placeholder="Nhập địa chỉ"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>
                Cập nhật mật khẩu của bạn để bảo vệ tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">
                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                    }
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    {isSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
