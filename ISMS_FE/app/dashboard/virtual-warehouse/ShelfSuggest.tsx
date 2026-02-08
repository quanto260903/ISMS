'use client';
import axios from "axios";
import { useState } from "react";
import { suggestShelf } from "@/services/api/warehouse.api";
export default function ShelfSuggest() {
    const [productId, setProductId] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(0);
    const [result, setResult] = useState<any>(null);

    const handleSuggest = async () => {
        try {
            const data = await suggestShelf(productId, quantity);
            setResult(data);
        } catch (e:any) {
            alert("Không tìm thấy kệ phù hợp hoặc dữ liệu gửi lên sai!");
        }
    };

    return (
        <div className="p-4 border rounded">
            <h2 className="text-xl font-bold mb-3">🧭 Suggest Shelf</h2>

            <input
                type="number"
                placeholder="Product ID"
                className="border p-2 mr-2"
                onChange={(e) => setProductId(+e.target.value)}
            />
            <input
                type="number"
                placeholder="Required Qty"
                className="border p-2 mr-2"
                onChange={(e) => setQuantity(+e.target.value)}
            />

            <button
                onClick={handleSuggest}
                className="bg-blue-600 text-white px-3 py-2 rounded"
            >
                Suggest
            </button>

            {result && (
                <p className="mt-3 text-green-700 font-semibold">
                    Suggested Shelf → {result.shelfId} (Row {result.rowNumber} | Col {result.columnNumber})
                </p>
            )}
        </div>
    );
}
