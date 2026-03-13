using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.SupplierRepo
{
    public class SupplierRepository : ISupplierRepository
    {
        private readonly IndividualBusinessContext _context;

    public SupplierRepository(IndividualBusinessContext context)
    {
        _context = context;
    }

    public async Task<List<SupplierSearchResult>> SearchAsync(string keyword, int limit = 10)
    {
        var kw = keyword.Trim().ToLower();

        return await _context.Customers
            .Where(c =>
                c.IsVendor == true &&           // chỉ lấy nhà cung cấp
                c.IsInactive == false &&         // chỉ lấy còn hoạt động
                (
                    c.CustomerId.ToLower().Contains(kw) ||
                    (c.CustomerName != null && c.CustomerName.ToLower().Contains(kw))
                )
            )
            .OrderBy(c => c.CustomerId)
            .Take(limit)
            .Select(c => new SupplierSearchResult
            {
                SupplierId = c.CustomerId,
                SupplierName = c.CustomerName,
                TaxId = c.TaxId,
                Address = c.Address,
                Phone = c.Phone,
            })
            .ToListAsync();
    }
        // ── Mới ─────────────────────────────────────────────
        public async Task<(IEnumerable<Customer> Items, int Total)> GetListAsync(
            GetSupplierListRequest request)
        {
            var query = _context.Customers
                .Where(c => c.IsVendor == true)
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
                .FirstOrDefaultAsync(c => c.CustomerId == id && c.IsVendor == true);

        public async Task<int> SaveChangesAsync()
            => await _context.SaveChangesAsync();

        public async Task<int> DeleteAsync(string id)
        {
            var entity = await _context.Customers
                .FirstOrDefaultAsync(c => c.CustomerId == id && c.IsVendor == true);
            if (entity == null) return 0;
            _context.Customers.Remove(entity);
            return await _context.SaveChangesAsync();
        }
    public async Task<bool> ExistsAsync(string supplierId)
    {
        return await _context.Customers
            .AnyAsync(c => c.CustomerId == supplierId);
    }

    public async Task AddAsync(Customer supplier)
    {
        await _context.Customers.AddAsync(supplier);
    }
}
}
