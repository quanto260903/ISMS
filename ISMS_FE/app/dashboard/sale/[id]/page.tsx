"use client";
import SaleDetailPage from "@/features/sale/components/SaleDetailPage";

interface Props { params: { id: string } }

export default function SaleViewPage({ params }: Props) {
  return <SaleDetailPage voucherId={params.id} />;
}
