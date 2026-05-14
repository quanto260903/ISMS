export interface ActivityLogItem {
  id:           number;
  userId:       string | null;
  userFullName: string | null;
  action:       string | null;
  description:  string | null;
  module:       string | null;
  createdAt:    string | null;
}

export interface ActivityLogResult {
  items:    ActivityLogItem[];
  total:    number;
  page:     number;
  pageSize: number;
}

export const MODULE_OPTIONS = [
  { value: "",          label: "Tất cả module" },
  { value: "NHAP_KHO",  label: "Nhập kho" },
  { value: "XUAT_KHO",  label: "Xuất kho" },
  { value: "BAN_HANG",  label: "Bán hàng" },
  { value: "NGUOI_DUNG",label: "Người dùng" },
  { value: "KIEM_KE",   label: "Kiểm kê" },
] as const;

export const MODULE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  NHAP_KHO:   { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  XUAT_KHO:   { bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
  BAN_HANG:   { bg: "#fdf4ff", color: "#7c3aed", border: "#e9d5ff" },
  NGUOI_DUNG: { bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
  KIEM_KE:    { bg: "#fefce8", color: "#854d0e", border: "#fde68a" },
  DEFAULT:    { bg: "#f8fafc", color: "#475569", border: "#cbd5e1" },
};

export const MODULE_LABELS: Record<string, string> = {
  NHAP_KHO:   "Nhập kho",
  XUAT_KHO:   "Xuất kho",
  BAN_HANG:   "Bán hàng",
  NGUOI_DUNG: "Người dùng",
  KIEM_KE:    "Kiểm kê",
};

export const ACTION_LABELS: Record<string, string> = {
  TAO_PHIEU:      "Tạo phiếu",
  CAP_NHAT_PHIEU: "Cập nhật phiếu",
  DANG_KY:        "Đăng ký",
  TAO_TAI_KHOAN:  "Tạo tài khoản",
};
