import { apiFetch } from "./apiClient";
import type {
SupplierSearchResult,
CreateSupplierRequest
} from "@/shared/types/supplier.types";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function searchSuppliers(
keyword: string,
limit = 10
): Promise<SupplierSearchResult[]> {

if (!keyword.trim()) return [];

const data = await apiFetch<any>(
`${BASE}/Supplier/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`
);

return data.data ?? data;
}

export async function createSupplier(
payload: CreateSupplierRequest
): Promise<{
isSuccess: boolean;
message: string;
data?: SupplierSearchResult;
}> {

return apiFetch(
`${BASE}/Supplier/create`,
{
method: "POST",
body: JSON.stringify(payload),
}
);
}
