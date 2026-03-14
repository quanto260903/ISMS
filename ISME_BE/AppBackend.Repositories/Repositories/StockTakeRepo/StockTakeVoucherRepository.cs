using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.StockTakeRepo
{
    public class StockTakeVoucherRepository : IStockTakeVoucherRepository
    {
        private readonly IndividualBusinessContext _context;

        public StockTakeVoucherRepository(IndividualBusinessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StockTakeVoucher>> GetAllAsync()
        {
            return await _context.StockTakeVouchers
                .OrderByDescending(v => v.VoucherDate)
                .ToListAsync();
        }

        public async Task<StockTakeVoucher?> GetByIdAsync(string id)
        {
            return await _context.StockTakeVouchers
                .Include(v => v.StockTakeDetails)
                .FirstOrDefaultAsync(v => v.StockTakeVoucherId == id);
        }

        public async Task<StockTakeVoucher> AddAsync(StockTakeVoucher voucher)
        {
            voucher.StockTakeVoucherId = Guid.NewGuid().ToString();
            voucher.CreatedDate = DateTime.UtcNow;
            await _context.StockTakeVouchers.AddAsync(voucher);
            return voucher;
        }

        public async Task UpdateAsync(StockTakeVoucher voucher)
        {
            _context.StockTakeVouchers.Update(voucher);
            await Task.CompletedTask;
        }

        public async Task DeleteAsync(string id)
        {
            var voucher = await _context.StockTakeVouchers.FindAsync(id);
            if (voucher != null)
                _context.StockTakeVouchers.Remove(voucher);
        }

        public async Task<string> GenerateVoucherCodeAsync()
        {
            // Lấy số thứ tự lớn nhất hiện có, format: KK000001
            var lastCode = await _context.StockTakeVouchers
                .OrderByDescending(v => v.VoucherCode)
                .Select(v => v.VoucherCode)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (!string.IsNullOrEmpty(lastCode) && lastCode.StartsWith("KK"))
            {
                if (int.TryParse(lastCode.Substring(2), out int current))
                    nextNumber = current + 1;
            }

            return $"KK{nextNumber:D6}";
        }
    }
}
