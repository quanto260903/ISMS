'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import ShelfSuggest from "./ShelfSuggest";

import ShelfPopup from "./ShelfPopup";
import { getWarehouseMap } from "@/services/api/warehouse.api";
type LocationShelf = {
    locationId: number;
    shelfId: string;
    rowNumber: number;
    columnNumber: number;
    isFull: boolean;
    type: string;
};

export default function WarehouseMap() {
    const [shelves, setShelves] = useState<LocationShelf[]>([]);
    const [selectedShelf, setSelectedShelf] = useState<number | null>(null);

    useEffect(() => {
        loadMap();
    }, []);

   const loadMap = async () => {
    const data = await getWarehouseMap();
    setShelves(data);
};

    const rows = Math.max(...shelves.map(x => x.rowNumber));
    const cols = Math.max(...shelves.map(x => x.columnNumber));

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">📦 Warehouse Virtual Map</h1>

            <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${cols}, 70px)` }}
            >
                {shelves.map((shelf) => (
                    <div
                        key={shelf.locationId}
                        onClick={() => setSelectedShelf(shelf.locationId)}
                        className={`
                            h-14 cursor-pointer flex items-center justify-center font-semibold text-sm rounded  
                            ${shelf.isFull ? "bg-red-500 text-white" : "bg-green-400 text-black"}  
                            hover:scale-105 transition
                        `}
                    >
                        {shelf.shelfId}
                    </div>
                ))}
            </div>
  <ShelfSuggest />
            {selectedShelf && (
                <ShelfPopup
                    locationId={selectedShelf}
                    onClose={() => setSelectedShelf(null)}
                />
            )}
        </div>
    );
}
