// features/sale/sale.api.ts
import { baseApi } from "@/services/baseApi";
import type { GoodsSearchResult, Voucher, WarehouseTransactionDto, SaleListResult } from "./types/sale.types";

export const searchGoods = (keyword: string, limit = 10) =>
  baseApi.get<GoodsSearchResult[]>(
    `/Items/search?keyword=${keyword}&limit=${limit}`
  );

export const createSale = (payload: Voucher & { paymentOption: string }) =>
  baseApi.post<{ isSuccess: boolean; message: string }>(
    "SaleGoods/add-sale-goods", payload
  );

export const getWarehouseReport = (goodsId: string) =>
  baseApi.get<WarehouseTransactionDto[]>(
    `/Items/warehouse-report/${encodeURIComponent(goodsId)}`
  );

export const getSaleList = async (params: {
  fromDate?: string;
  toDate?:   string;
  keyword?:  string;
  page?:     number;
  pageSize?: number;
}): Promise<SaleListResult> => {
  const q = new URLSearchParams();
  if (params.fromDate) q.set("fromDate", params.fromDate);
  if (params.toDate)   q.set("toDate",   params.toDate);
  if (params.keyword)  q.set("keyword",  params.keyword);
  q.set("page",     String(params.page     ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));
  // Backend trả ResultModel<SaleListResult> — data thực nằm trong .data
  const res = await baseApi.get<{ data: SaleListResult }>(`/SaleGoods/list?${q}`);
  return res.data;
};