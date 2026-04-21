// ============================================================
//  features/user-management/types/userManagement.types.ts
// ============================================================

export interface UserListDto {
  userId:       string;
  fullName:     string | null;
  email:        string | null;
  roleIds:      number[];      // ✅ multi-role: thay roleId: number
  roleLabels:   string[];      // ✅ multi-role: thay roleLabel: string
  isActive:     boolean;
  contractType: string | null;
}

export interface UserDetailDto {
  userId:            string;
  username:          string;
  fullName:          string | null;
  email:             string | null;
  roleIds:           number[];   // ✅ multi-role
  roleLabels:        string[];   // ✅ multi-role
  isActive:          boolean;
  idcardNumber:      string | null;
  issuedDate:        string | null;
  issuedBy:          string | null;
  contractType:      string | null;
  negotiatedSalary:  number | null;
  insuranceSalary:   number | null;
  numberOfDependent: number;
}

export interface CreateUserRequest {
  fullName:          string;
  email:             string;
  password:          string;
  roleIds:           number[];   // ✅ multi-role: thay roleId: number
  idcardNumber?:     string;
  issuedDate?:       string;
  issuedBy?:         string;
  contractType?:     string;
  negotiatedSalary?: number;
  insuranceSalary?:  number;
  numberOfDependent: number;
}

export interface UpdateUserRequest {
  fullName?:         string;
  email?:            string;
  idcardNumber?:     string;
  issuedDate?:       string;
  issuedBy?:         string;
  contractType?:     string;
  negotiatedSalary?: number;
  insuranceSalary?:  number;
  numberOfDependent?: number;
}

export interface UpdateRoleRequest {
  roleIds: number[];   // ✅ multi-role: thay { roleId: number }
}

export interface UserListResult {
  items:    UserListDto[];
  total:    number;
  page:     number;
  pageSize: number;
}

export const ROLE_OPTIONS = [
  { value: 2, label: "Manager",  desc: "Quản lý, xem báo cáo",              color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { value: 3, label: "Staff",    desc: "Nhân viên bán hàng, xuất nhập kho", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
];

export const CONTRACT_OPTIONS = [
  "Toàn thời gian",
  "Bán thời gian",
  "Thử việc",
  "Thời vụ",
];