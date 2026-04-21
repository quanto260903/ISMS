"use client";
import { useSearchParams } from "next/navigation";
import EditExportForm from "@/features/export/components/EditExportForm";

interface Props { params: { id: string } }

export default function EditExportPage({ params }: Props) {
  const searchParams = useSearchParams();
  const viewOnly = searchParams.get("mode") === "view";
  return <EditExportForm voucherId={params.id} viewOnly={viewOnly} />;
}
