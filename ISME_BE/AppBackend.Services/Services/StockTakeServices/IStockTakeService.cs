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

        // userId cần để ghi vào phiếu nhập/xuất được tạo tự động
        Task<ProcessStockTakeResultDto> ProcessAsync(string id, string userId);
    }
}
