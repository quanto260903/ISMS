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
