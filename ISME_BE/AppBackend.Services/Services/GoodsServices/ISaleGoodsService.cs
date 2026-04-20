using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.GoodsServices
{
    public interface ISaleGoodsService
    {
        Task<ResultModel<int>> CreateSaleAsync(CreateSaleRequest request, string? userId);
        Task<ResultModel<SaleVoucherLookupDto>> GetByVoucherIdAsync(string voucherId);
        Task<bool> CheckSaleUsedForReturnAsync(string saleVoucherId);
        Task<ResultModel<List<SaleSearchResult>>> SearchSaleVouchersAsync(string keyword, int limit);
        Task<ResultModel<SaleListResult>> GetListAsync(DateOnly? fromDate, DateOnly? toDate, string? keyword, int page, int pageSize);
    }
}
