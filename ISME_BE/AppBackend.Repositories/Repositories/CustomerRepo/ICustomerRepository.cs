using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.CustomerRepo
{
    public interface ICustomerRepository
    {
        Task<(IEnumerable<Customer> Items, int Total)> GetListAsync(GetCustomerListRequest request);
        Task<Customer?> GetByIdAsync(string id);
        Task<bool> ExistsAsync(string id);
        Task<List<CustomerSearchResult>> SearchAsync(string keyword, int limit = 10);
        Task AddAsync(Customer entity);
        Task<int> SaveChangesAsync();
        Task<int> DeleteAsync(string id);
    }
}
