// ============================================================
//  features/goods-category/goodsCategory.api.ts
// ============================================================

import type {
  GoodsCategoryListResult,
  GoodsCategoryDetailDto,
  CreateGoodsCategoryRequest,
  UpdateGoodsCategoryRequest,
} from "./types/goodsCategory.types";

const BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeader(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api<T>(
  url: string,
  options?: RequestInit
): Promise<{ isSuccess: boolean; data?: T; message: string; statusCode: number }> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });
  return res.json();
}

export async function getGoodsCategoryList(params: {
  keyword?:    string;
  isInactive?: boolean;
  page?:       number;
  pageSize?:   number;
}): Promise<GoodsCategoryListResult> {
  const q = new URLSearchParams();
  if (params.keyword    !== undefined) q.set("keyword",    params.keyword);
  if (params.isInactive !== undefined) q.set("isInactive", String(params.isInactive));
  q.set("page",     String(params.page     ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));

  const res = await api<GoodsCategoryListResult>(
    `${BASE}/GoodsCategory/list?${q}`
  );
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function getGoodsCategoryById(id: string): Promise<GoodsCategoryDetailDto> {
  const res = await api<GoodsCategoryDetailDto>(`${BASE}/GoodsCategory/${id}`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function createGoodsCategory(
  payload: CreateGoodsCategoryRequest
): Promise<GoodsCategoryDetailDto> {
  const res = await api<GoodsCategoryDetailDto>(`${BASE}/GoodsCategory/create`, {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function updateGoodsCategory(
  id: string,
  payload: UpdateGoodsCategoryRequest
): Promise<GoodsCategoryDetailDto> {
  const res = await api<GoodsCategoryDetailDto>(`${BASE}/GoodsCategory/${id}`, {
    method: "PUT",
    body:   JSON.stringify(payload),
  });
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function updateGoodsCategoryStatus(
  id: string,
  isInactive: boolean
): Promise<string> {
  const res = await api<number>(`${BASE}/GoodsCategory/${id}/status`, {
    method: "PUT",
    body:   JSON.stringify({ isInactive }),
  });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}

export async function deleteGoodsCategory(id: string): Promise<string> {
  const res = await api<number>(`${BASE}/GoodsCategory/${id}`, {
    method: "DELETE",
  });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}