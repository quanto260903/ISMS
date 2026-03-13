using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.GoodsRepo
{
    public interface IGoodsRepository
    {
        Task<(IEnumerable<Good> Items, int Total)> GetListAsync(GetGoodsListRequest request);
        Task<Good?> GetByIdAsync(string id);
        Task<bool> ExistsAsync(string id);
        Task<List<GoodsSearchResult>> SearchAsync(string keyword, int limit = 10);
        Task AddAsync(Good entity);
        Task<int> SaveChangesAsync();
        Task<int> DeleteAsync(string id);
    }
}
