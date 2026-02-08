'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Check,
  ChevronDown,
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Settings,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function UIShowcasePage() {
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [selectedValue, setSelectedValue] = useState('')

  const showSuccessToast = () => {
    toast({
      title: 'Success!',
      description: 'This is a success toast notification',
    })
  }

  const showErrorToast = () => {
    toast({
      variant: 'destructive',
      title: 'Error!',
      description: 'This is an error toast notification',
    })
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent mb-2">
          UI Components Showcase
        </h1>
        <p className="text-gray-600">
          Explore all available UI components with live examples
        </p>
      </div>

      {/* Buttons Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Buttons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Primary Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">Default Button</Button>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-teal-500">
                Gradient Button
              </Button>
              <Button className="w-full" size="sm">Small Button</Button>
              <Button className="w-full" size="lg">Large Button</Button>
              <Button className="w-full" disabled>Disabled Button</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variant Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="secondary" className="w-full">Secondary</Button>
              <Button variant="outline" className="w-full">Outline</Button>
              <Button variant="ghost" className="w-full">Ghost</Button>
              <Button variant="link" className="w-full">Link</Button>
              <Button variant="destructive" className="w-full">Destructive</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Icon Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
              <Button variant="outline" className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Inputs Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Form Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Text Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="basic">Basic Input</Label>
                <Input id="basic" placeholder="Enter text..." />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Input</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="email" type="email" className="pl-10" placeholder="email@example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password Input</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    className="pl-10 pr-10" 
                    placeholder="Enter password" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="disabled">Disabled Input</Label>
                <Input id="disabled" disabled placeholder="Disabled input" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select & Dropdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Menu</Label>
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dropdown Menu</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Open Menu
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Badges Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Badges</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Success</Badge>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Info</Badge>
              <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Warning</Badge>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">Purple</Badge>
              <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200">Teal</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Cards Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
              <CardDescription>Card with header and content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                This is a basic card component with header and content area.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Shadow Card</CardTitle>
              <CardDescription>Card with shadow effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                This card has a shadow effect for better visual hierarchy.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-teal-500 text-white border-0">
            <CardHeader>
              <CardTitle className="text-white">Gradient Card</CardTitle>
              <CardDescription className="text-purple-100">
                Card with gradient background
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-50">
                This card features a beautiful gradient background.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tabs Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tabs</h2>
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="tab1" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="space-y-4">
                <h3 className="text-lg font-semibold">Tab 1 Content</h3>
                <p className="text-sm text-gray-600">
                  This is the content for the first tab. You can put any component here.
                </p>
              </TabsContent>
              <TabsContent value="tab2" className="space-y-4">
                <h3 className="text-lg font-semibold">Tab 2 Content</h3>
                <p className="text-sm text-gray-600">
                  This is the content for the second tab with different information.
                </p>
              </TabsContent>
              <TabsContent value="tab3" className="space-y-4">
                <h3 className="text-lg font-semibold">Tab 3 Content</h3>
                <p className="text-sm text-gray-600">
                  This is the content for the third tab. Tabs are great for organizing content.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Toast Notifications Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Toast Notifications</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Toast Examples</CardTitle>
            <CardDescription>Click buttons to see toast notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={showSuccessToast} className="w-full md:w-auto">
              <CheckCircle className="w-4 h-4 mr-2" />
              Show Success Toast
            </Button>
            <Button onClick={showErrorToast} variant="destructive" className="w-full md:w-auto ml-0 md:ml-3">
              <AlertCircle className="w-4 h-4 mr-2" />
              Show Error Toast
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Icons Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Icons (Lucide)</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Icons</CardTitle>
            <CardDescription>Sample of commonly used icons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 md:grid-cols-10 gap-4">
              {[
                User, Mail, Lock, Search, Plus, Edit, Trash2, Download, Upload, Settings,
                CheckCircle, AlertCircle, Info, X, Check, Eye, EyeOff, ChevronDown,
              ].map((Icon, index) => (
                <div key={index} className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg">
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Color Palette Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Color Palette</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Primary Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-purple-600 rounded-lg shadow-md"></div>
                <div>
                  <p className="font-semibold">Purple</p>
                  <p className="text-sm text-gray-500">#9333ea</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-teal-500 rounded-lg shadow-md"></div>
                <div>
                  <p className="font-semibold">Teal</p>
                  <p className="text-sm text-gray-500">#14b8a6</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-teal-500 rounded-lg shadow-md"></div>
                <div>
                  <p className="font-semibold">Gradient</p>
                  <p className="text-sm text-gray-500">Purple to Teal</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-green-600 rounded-lg shadow-md"></div>
                <div>
                  <p className="font-semibold">Success</p>
                  <p className="text-sm text-gray-500">#16a34a</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-red-600 rounded-lg shadow-md"></div>
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm text-gray-500">#dc2626</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-yellow-500 rounded-lg shadow-md"></div>
                <div>
                  <p className="font-semibold">Warning</p>
                  <p className="text-sm text-gray-500">#eab308</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-blue-600 rounded-lg shadow-md"></div>
                <div>
                  <p className="font-semibold">Info</p>
                  <p className="text-sm text-gray-500">#2563eb</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
