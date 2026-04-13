"use client";
import { useSearchParams } from "next/navigation";
import EditInwardForm from "@/features/import/components/EditInwardForm";

interface Props {
  params: { id: string };
}

export default function EditInwardPage({ params }: Props) {
  const searchParams = useSearchParams();
  const viewOnly = searchParams.get("mode") === "view";
  return <EditInwardForm voucherId={params.id} viewOnly={viewOnly} />;
}
