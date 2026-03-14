using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.StockTakeRepo
{
    public interface IStockTakeVoucherRepository
    {
        Task<IEnumerable<StockTakeVoucher>> GetAllAsync();
        Task<StockTakeVoucher?> GetByIdAsync(string id);
        Task<StockTakeVoucher> AddAsync(StockTakeVoucher voucher);
        Task UpdateAsync(StockTakeVoucher voucher);
        Task DeleteAsync(string id);
        Task<string> GenerateVoucherCodeAsync();
    }
}
