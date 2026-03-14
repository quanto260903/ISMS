using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.StockTakeRepo
{
    public interface IStockTakeDetailRepository
    {
        Task<IEnumerable<StockTakeDetail>> GetByVoucherIdAsync(string stockTakeVoucherId);
        Task AddRangeAsync(IEnumerable<StockTakeDetail> details);
        Task DeleteByVoucherIdAsync(string stockTakeVoucherId);
    }
}
