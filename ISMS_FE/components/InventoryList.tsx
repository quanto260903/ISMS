import React, { useEffect, useState } from 'react';
import { getInventoryByProduct } from '../services/api/inventory.api';
import { Inventory } from '../services/api/inventory.api';

interface InventoryListProps {
    productId: number;
}

const InventoryList: React.FC<InventoryListProps> = ({ productId }) => {
    const [inventory, setInventory] = useState<Inventory[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const data = await getInventoryByProduct(productId);
                if (Array.isArray(data)) {
                    setInventory(data);
                } else {
                    setError("Dữ liệu tồn kho không hợp lệ.");
                }
            } catch (err) {
                setError("Lỗi khi tải dữ liệu: " + (err instanceof Error ? err.message : ''));
            }
        };
        fetchInventory();
    }, [productId]);

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left">
                <thead>
                    <tr>
                        <th className="px-4 py-2">Inventory ID</th>
                        <th className="px-4 py-2">Location ID</th>
                        <th className="px-4 py-2">Quantity Available</th>
                        <th className="px-4 py-2">Allocated Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {inventory.length > 0 ? (
                        inventory.map(item => (
                            <tr key={item.inventoryId}>
                                <td className="border px-4 py-2">{item.inventoryId}</td>
                                <td className="border px-4 py-2">{item.locationId}</td>
                                <td className="border px-4 py-2">{item.quantityAvailable}</td>
                                <td className="border px-4 py-2">{item.allocatedQuantity}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="text-center py-4">No inventory found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryList;