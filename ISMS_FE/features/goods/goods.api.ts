// ============================================================
//  features/goods/goods.api.ts
// ============================================================

import type {
  GoodsListResult, GoodsDetailDto,
  GoodsSearchResult, CreateGoodsRequest, UpdateGoodsRequest,
} from "./types/goods.types";

const BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api<T>(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeader(), ...(options?.headers ?? {}) },
    cache: "no-store",
  });
  return res.json() as Promise<{ isSuccess: boolean; data?: T; message: string; statusCode: number }>;
}

export async function getGoodsList(params: {
  keyword?:      string;
  goodsGroupId?: string;
  isInactive?:   boolean;
  isPromotion?:  boolean;
  page?:         number;
  pageSize?:     number;
}): Promise<GoodsListResult> {
  const q = new URLSearchParams();
  if (params.keyword      !== undefined) q.set("keyword",      params.keyword);
  if (params.goodsGroupId !== undefined) q.set("goodsGroupId", params.goodsGroupId);
  if (params.isInactive   !== undefined) q.set("isInactive",   String(params.isInactive));
  if (params.isPromotion  !== undefined) q.set("isPromotion",  String(params.isPromotion));
  q.set("page",     String(params.page     ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));
  const res = await api<GoodsListResult>(`${BASE}/Goods/list?${q}`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function searchGoods(keyword: string, limit = 10): Promise<GoodsSearchResult[]> {
  const q = new URLSearchParams({ keyword, limit: String(limit) });
  const res = await api<GoodsSearchResult[]>(`${BASE}/Goods/search?${q}`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function getGoodsById(id: string): Promise<GoodsDetailDto> {
  const res = await api<GoodsDetailDto>(`${BASE}/api/Goods/${id}`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function createGoods(payload: CreateGoodsRequest): Promise<GoodsDetailDto> {
  const res = await api<GoodsDetailDto>(`${BASE}/Goods/create`, {
    method: "POST", body: JSON.stringify(payload),
  });
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function updateGoods(id: string, payload: UpdateGoodsRequest): Promise<GoodsDetailDto> {
  const res = await api<GoodsDetailDto>(`${BASE}/Goods/${id}`, {
    method: "PUT", body: JSON.stringify(payload),
  });
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function updateGoodsStatus(id: string, isInactive: boolean): Promise<string> {
  const res = await api<number>(`${BASE}/Goods/${id}/status`, {
    method: "PUT", body: JSON.stringify({ isInactive }),
  });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}

export async function deleteGoods(id: string): Promise<string> {
  const res = await api<number>(`${BASE}/Goods/${id}`, { method: "DELETE" });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}