using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.GoodsCategoryRepo
{
    public interface IGoodsCategoryRepository
    {
        Task<(IEnumerable<GoodsCategory> Items, int Total)> GetListAsync(GetGoodsCategoryListRequest request);
        Task<GoodsCategory?> GetByIdAsync(string id);
        Task<bool> ExistsAsync(string id);
        Task<int> CountGoodsAsync(string id);
        Task AddAsync(GoodsCategory entity);
        Task<int> SaveChangesAsync();
        Task<int> DeleteAsync(string id);
    }
}
