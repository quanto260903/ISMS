// features/sale/sale.api.ts
import { baseApi } from "@/services/baseApi";
import type { GoodsSearchResult, Voucher, WarehouseTransactionDto } from "./types/sale.types";

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