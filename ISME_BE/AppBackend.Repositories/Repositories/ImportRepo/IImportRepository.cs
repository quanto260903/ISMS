using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.ImportRepo
{
    public interface IImportRepository
    {
        Task AddAsync(Voucher voucher);

        Task<(IEnumerable<Voucher> Items, int Total)> GetListAsync(
          GetInwardListRequest request);

        Task<Voucher?> GetByIdAsync(string voucherId);
        Task UpdateAsync(Voucher voucher);
        Task DeleteAsync(string voucherId);
        Task<(int SaleVoucherDetailId, int SoldQty)?> GetSaleSourceDetailAsync(
            string saleVoucherId,
            string goodsId,
            int? saleVoucherDetailId = null);
        Task<int> GetReturnedQuantityForSaleLineAsync(
            int saleVoucherDetailId,
            string saleVoucherId,
            string goodsId,
            string? excludeImportVoucherId = null);
        Task AddSellableStockAsync(string goodsId, int quantity);
        Task DeductSellableStockAsync(string goodsId, int quantity);
        Task AddQuarantineStockAsync(string goodsId, int quantity);
        Task DeductQuarantineStockAsync(string goodsId, int quantity);
        Task<bool> HasDependentExportsAsync(string inboundVoucherId);
        Task<bool> IsUsedForXk1ReturnAsync(string inwardVoucherId);
        Task<List<InwardSearchResult>> SearchAsync(string keyword, int limit);
        Task<string> GenerateVoucherIdAsync();
    }
}
