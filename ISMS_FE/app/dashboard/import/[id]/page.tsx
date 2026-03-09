"use client";
import EditInwardForm from "@/features/import/components/EditInwardForm";

interface Props {
  params: { id: string };
}

export default function EditInwardPage({ params }: Props) {
  return <EditInwardForm voucherId={params.id} />;
}