import axios from 'axios'
const BASE_URL = process.env.NEXT_PUBLIC_API_URL; // ví dụ: http://localhost:5000

/* ========================================================
   TYPE
======================================================== */

export interface GoodsSearchResult {
  goodsId: string;
  goodsName: string;
  unit: string;
  salePrice: number;
  vatrate: string;
  itemOnHand: number;
}


/* ========================================================
   searchGoods
   Gọi GET /api/goods/search?keyword=...&limit=...
   Trả về mảng GoodsSearchResult cho dropdown autocomplete.
======================================================== */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
})
export async function searchGoods(
  keyword: string,
  limit = 10
): Promise<GoodsSearchResult[]> {
  if (!keyword.trim()) return [];

  const response = await apiClient.get("/Items/search", {
    params: {
      keyword: keyword.trim(),
      limit,
    },
  });

  return response.data;
}

export const createSale = async (data: any) => {
  const response = await apiClient.post("/SaleGoods/add-sale-goods", data);
  return response.data;
};
// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
// ... các hàm api khác (createSale, v.v.) ...