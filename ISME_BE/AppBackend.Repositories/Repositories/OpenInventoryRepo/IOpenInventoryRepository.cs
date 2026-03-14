using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.OpenInventoryRepo
{
    public interface IOpenInventoryRepository
    {
        Task<(IEnumerable<OpenInventory> Items, int Total)> GetListAsync(GetOpenInventoryListRequest req);
        Task<OpenInventory?> GetByGoodsIdAsync(string goodsId);
        Task<OpenInventorySummaryDto> GetSummaryAsync();
        Task AddAsync(OpenInventory entity);
        Task<int> DeleteByGoodsIdAsync(string goodsId);
        Task<int> SaveChangesAsync();
    }
}
