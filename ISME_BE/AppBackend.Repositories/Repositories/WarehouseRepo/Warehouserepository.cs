using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.WarehouseRepo
{
    public class WarehouseRepository : IWarehouseRepository
    {
        private readonly IndividualBusinessContext _context;

        public WarehouseRepository(IndividualBusinessContext context)
        {
            _context = context;
        }

        // Chỉ lấy kho đang hoạt động (IsInactive = false)
        public async Task<IEnumerable<Warehouse>> GetAllActiveAsync()
        {
            return await _context.Warehouses
                .Where(w => !w.IsInactive)
                .OrderBy(w => w.WarehouseName)
                .Select(w => new Warehouse
                {
                    WarehouseId = w.WarehouseId,
                    WarehouseName = w.WarehouseName,
                    Address = w.Address,
                    IsInactive = w.IsInactive,
                })
                .ToListAsync();
        }
    }
}
