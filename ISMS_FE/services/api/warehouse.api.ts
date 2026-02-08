import axios from "axios";

export interface ShelfDto {
    locationId: number;
    shelfId: string;
    rowNumber: number;
    columnNumber: number;
    type: string;
    isFull: boolean;
}

export interface ShelfDetail {
    locationId: number;
    shelfId: string;
    rowNumber: number;
    columnNumber: number;
    type: string;
    isFull: boolean;
    inventories: {
        productId: number;
        serialNumber: string;
        name: string;
        available: number;
    }[];
}
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
/* ===================== 1. Lấy bản đồ kho ====================== */
export async function getWarehouseMap(): Promise<ShelfDto[]> {
    const res = await axios.get(`${BASE_URL}/Location`);
    return res.data;
}  

/* ===================== 2. Lấy chi tiết từng kệ ================= */
export async function getShelfDetail(locationId: number): Promise<ShelfDetail> {
    const res = await axios.get(`${BASE_URL}/Location/${locationId}`);
    return res.data;
}

/* ============ 3. API gợi ý vị trí lưu hàng phù hợp ============ */
export async function suggestShelf(productId: number, required: number) {
    const res = await axios.get(`${BASE_URL}/Location/suggest`, {
        params: { productId, required }
    });
    return res.data;
}
