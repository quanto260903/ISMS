"use client";
import EditExportForm from "@/features/export/components/EditExportForm";
interface Props { params: { id: string } }
export default function EditExportPage({ params }: Props) {
  return <EditExportForm voucherId={params.id} />;
}