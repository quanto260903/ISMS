'use client';
import axios from "axios";
import { useEffect, useState } from "react";
import { getShelfDetail } from "@/services/api/warehouse.api";
type ProductShelf = {
    inventoryId: number;
    productId: number;
    serialNumber: string;
    name: string;
    available: number;
    allocated: number;
};


export type ShelfDetail = {
    locationId: number;
    shelfId: string;
    columnNumber: number;
    rowNumber: number;
    type: string;
    isFull: boolean;
    inventories: ProductShelf[];
};

export default function ShelfPopup({ locationId, onClose }: { locationId: number, onClose: () => void }) {
    const [data, setData] = useState<ShelfDetail | null>(null);

    useEffect(() => {
        fetchDetail();
    }, []);

 const fetchDetail = async () => {
        try {
            const res = await getShelfDetail(locationId);

            const convert: ShelfDetail = {
                locationId: res.locationId,
                shelfId: res.shelfId,
                columnNumber: res.columnNumber,
                rowNumber: res.rowNumber,
                type: res.type,
                isFull: res.isFull,
                inventories: res.inventories.map((i: any) => ({
                    inventoryId: i.inventoryId,
                    productId: i.productId,
                    serialNumber: i.product.serialNumber,
                    name: i.product.name,
                    available: i.quantityAvailable,
                    allocated: i.allocatedQuantity
                }))
            };

            setData(convert);
        } catch (err) {
            console.error("❌ Failed to load shelf detail", err);
        }
    };

    if (!data) return null;



    if (!data) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-5 w-[420px]">
                <h2 className="text-xl font-bold mb-2">🔎 Shelf {data.shelfId}</h2>

                <div className="mb-3">
                    <p><b>Row:</b> {data.rowNumber}</p>
                    <p><b>Column:</b> {data.columnNumber}</p>
                    <p><b>Type:</b> {data.type}</p>
                    <p><b>Status:</b> {data.isFull ? "FULL ❌" : "Available ✔"}</p>
                </div>

                <h3 className="font-bold text-lg mb-2">📦 Products in shelf</h3>
                <ul className="border rounded p-2 max-h-40 overflow-y-auto space-y-1">
                    {data.inventories.length > 0 ? (
                        data.inventories.map(p => (
                            <li key={p.productId} className="border-b pb-1">
                                <b>{p.serialNumber}</b> — {p.name}  
                                <span className="float-right text-blue-600">{p.available} pcs</span>
                            </li>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center">No products</p>
                    )}
                </ul>

                <button
                    className="w-full mt-4 bg-gray-700 hover:bg-gray-900 text-white rounded py-2"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
}
