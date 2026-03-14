using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.StockTakeRepo
{
    public class StockTakeDetailRepository : IStockTakeDetailRepository
    {
        private readonly IndividualBusinessContext _context;

        public StockTakeDetailRepository(IndividualBusinessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StockTakeDetail>> GetByVoucherIdAsync(string stockTakeVoucherId)
        {
            return await _context.StockTakeDetails
                .Where(d => d.StockTakeVoucherId == stockTakeVoucherId)
                .ToListAsync();
        }

        public async Task AddRangeAsync(IEnumerable<StockTakeDetail> details)
        {
            await _context.StockTakeDetails.AddRangeAsync(details);
        }

        public async Task DeleteByVoucherIdAsync(string stockTakeVoucherId)
        {
            var details = await _context.StockTakeDetails
                .Where(d => d.StockTakeVoucherId == stockTakeVoucherId)
                .ToListAsync();
            _context.StockTakeDetails.RemoveRange(details);
        }
    }
}
