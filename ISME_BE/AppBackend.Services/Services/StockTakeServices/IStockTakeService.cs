using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.StockTakeServices
{
    public interface IStockTakeService
    {
        Task<IEnumerable<StockTakeVoucherListDto>> GetAllAsync();
        Task<StockTakeVoucherDetailDto?> GetByIdAsync(string id);
        Task<StockTakeVoucherDetailDto> CreateAsync(CreateStockTakeVoucherDto dto, string createdBy);
        Task<StockTakeVoucherDetailDto?> UpdateAsync(string id, UpdateStockTakeVoucherDto dto);
        Task<bool> DeleteAsync(string id);

        // Khoá phiếu kiểm kê (IsCompleted = true); không tự sinh phiếu nhập/xuất
        Task<ProcessStockTakeResultDto> ProcessAsync(string id, string userId);

        // Lấy danh sách hàng THỪA (diff > 0) để pre-fill phiếu nhập NK3
        Task<IEnumerable<SurplusItemDto>> GetSurplusItemsAsync(string id);

        // Lấy danh sách hàng THIẾU (diff < 0) để pre-fill phiếu xuất XK3
        Task<IEnumerable<ShortageItemDto>> GetShortageItemsAsync(string id);

        // Lấy tất cả hàng hóa với tồn kho tính đến ngày asOfDate
        Task<IEnumerable<GoodsStockDto>> GetGoodsStockAsOfDateAsync(DateOnly asOfDate);

        // Xem trước mã phiếu sẽ được sinh (không tạo phiếu)
        Task<string> PreviewNextVoucherCodeAsync();
    }
}
