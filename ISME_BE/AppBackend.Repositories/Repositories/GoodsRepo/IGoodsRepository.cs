using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.GoodsRepo
{
    public interface IGoodsRepository
    {
        Task<(IEnumerable<Good> Items, int Total)> GetListAsync(GetGoodsListRequest request);
        Task<Good?> GetByIdAsync(string id);
        Task<bool> ExistsAsync(string id);
        Task<List<GoodsSearchResult>> SearchAsync(string keyword, int limit = 10);
        Task AddAsync(Good entity);
        Task<int> SaveChangesAsync();
        Task<int> DeleteAsync(string id);

        // Tính tồn kho của tất cả hàng hóa đến ngày asOfDate
        // Công thức: OpenInventory + Σnhập(Debit 156) - Σxuất(Credit 156)
        Task<IEnumerable<GoodsStockDto>> GetAllGoodsStockAsOfDateAsync(DateOnly asOfDate);

        // Tính tồn kho của 1 mặt hàng đến ngày asOfDate
        Task<decimal> GetStockAsOfDateAsync(string goodsId, DateOnly asOfDate);

        // Lấy dữ liệu tổng hợp tồn kho theo kỳ (đầu kỳ, nhập, xuất, cuối kỳ)
        Task<InventorySummaryDto> GetInventorySummaryAsync(DateOnly fromDate, DateOnly toDate, string? keyword = null);
    }
}
