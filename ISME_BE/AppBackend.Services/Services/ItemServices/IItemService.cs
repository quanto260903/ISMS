using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.ItemServices
{
    public interface IItemService
    {
        Task<ResultModel<List<WarehouseTransactionDto>>>
            GetItemWarehouseReportAsync(string goodsId);
        Task<IEnumerable<GoodsSearchDto>> SearchGoodsAsync(
                string keyword,
                int limit = 10,
                CancellationToken cancellationToken = default);
        
    }
}
