// ============================================================
//  app/dashboard/import/[id]/page.tsx
// ============================================================

"use client";

import { use } from "react";
import EditInwardForm from "@/features/import/components/EditInwardForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditInwardPage({ params }: Props) {
  const { id } = use(params);
  return <EditInwardForm voucherId={id} />;
}