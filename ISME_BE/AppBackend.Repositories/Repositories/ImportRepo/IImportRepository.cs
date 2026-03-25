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
        Task<bool> IsAlreadyReturnedAsync(string saleVoucherId);
        Task AddStockAsync(string goodsId, int quantity);
        Task DeductStockAsync(string goodsId, int quantity);
        Task<bool> HasDependentExportsAsync(string inboundVoucherId);
        Task<string> GenerateVoucherIdAsync();
    }
}
