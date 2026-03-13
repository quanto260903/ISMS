using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.CustomerRepo
{
     public class CustomerRepository : ICustomerRepository
    {
        private readonly IndividualBusinessContext _context;
    public CustomerRepository(IndividualBusinessContext context) => _context = context;

    public async Task<(IEnumerable<Customer> Items, int Total)> GetListAsync(
        GetCustomerListRequest request)
    {
        // Chỉ lấy bản ghi có IsCustomer = true
        var query = _context.Customers
            .Where(c => c.IsCustomer == true)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var kw = request.Keyword.Trim().ToLower();
            query = query.Where(c =>
                c.CustomerId.ToLower().Contains(kw) ||
                (c.CustomerName != null && c.CustomerName.ToLower().Contains(kw)) ||
                (c.Phone != null && c.Phone.Contains(kw)) ||
                (c.TaxId != null && c.TaxId.Contains(kw)));
        }

        if (request.IsInactive.HasValue)
            query = query.Where(c => c.IsInactive == request.IsInactive.Value);

        if (request.IsEnterprise.HasValue)
            query = query.Where(c => c.IsEnterprise == request.IsEnterprise.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(c => c.CustomerId)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<Customer?> GetByIdAsync(string id)
        => await _context.Customers
            .FirstOrDefaultAsync(c => c.CustomerId == id && c.IsCustomer == true);

    public async Task<bool> ExistsAsync(string id)
        => await _context.Customers.AnyAsync(c => c.CustomerId == id);

    public async Task<List<CustomerSearchResult>> SearchAsync(string keyword, int limit = 10)
    {
        var kw = keyword.Trim().ToLower();
        return await _context.Customers
            .Where(c =>
                c.IsCustomer == true &&
                c.IsInactive == false &&
                (c.CustomerId.ToLower().Contains(kw) ||
                 (c.CustomerName != null && c.CustomerName.ToLower().Contains(kw)) ||
                 (c.Phone != null && c.Phone.Contains(kw))))
            .OrderBy(c => c.CustomerId)
            .Take(limit)
            .Select(c => new CustomerSearchResult
            {
                CustomerId = c.CustomerId,
                CustomerName = c.CustomerName,
                Phone = c.Phone,
                TaxId = c.TaxId,
            })
            .ToListAsync();
    }

    public async Task AddAsync(Customer entity)
        => await _context.Customers.AddAsync(entity);

    public async Task<int> SaveChangesAsync()
        => await _context.SaveChangesAsync();

    public async Task<int> DeleteAsync(string id)
    {
        var entity = await _context.Customers
            .FirstOrDefaultAsync(c => c.CustomerId == id && c.IsCustomer == true);
        if (entity == null) return 0;
        _context.Customers.Remove(entity);
        return await _context.SaveChangesAsync();
    }
}
}
