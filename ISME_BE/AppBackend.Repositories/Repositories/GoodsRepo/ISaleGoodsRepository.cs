using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Generic;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.GoodsRepo
{
    public interface ISaleGoodsRepository
    {
        Task AddAsync(Voucher sale);
        Task<Voucher?> GetByVoucherIdAsync(string voucherId);
        Task<int> GetReturnedQtyForSaleDetailAsync(
            int saleVoucherDetailId,
            string saleVoucherId,
            string goodsId);
        Task<bool> IsUsedForNk2ReturnAsync(string saleVoucherId);
        Task<List<SaleSearchResult>> SearchAsync(string keyword, int limit);
    }
}
