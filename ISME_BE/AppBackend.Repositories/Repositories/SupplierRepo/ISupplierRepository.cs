using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.SupplierRepo
{
    public interface ISupplierRepository
    {
        Task<List<SupplierSearchResult>> SearchAsync(string keyword, int limit = 10);
        Task<bool> ExistsAsync(string supplierId);
        Task AddAsync(Customer supplier);
        // ── Mới ──
        Task<(IEnumerable<Customer> Items, int Total)> GetListAsync(GetSupplierListRequest request);
        Task<Customer?> GetByIdAsync(string id);
        Task<int> SaveChangesAsync();
        Task<int> DeleteAsync(string id);
    }
}
