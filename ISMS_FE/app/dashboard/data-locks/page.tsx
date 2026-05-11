import type { Metadata } from "next";
import { DataLocksPage } from "@/features/data-locks/components/DataLocksPage";
export const metadata: Metadata = {
  title: "Khóa Dữ Liệu | Quản Lý Kho",
  description: "Quản lý khóa sổ theo module hệ thống",
};

export default function Page() {
  return <DataLocksPage />;
}
