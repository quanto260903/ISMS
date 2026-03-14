import StockTakeDetailPage from "@/features/stock-take/components/StockTakeDetailPage";
export default function Page({ params }: { params: { id: string } }) {
  return <StockTakeDetailPage voucherId={params.id} />;
}