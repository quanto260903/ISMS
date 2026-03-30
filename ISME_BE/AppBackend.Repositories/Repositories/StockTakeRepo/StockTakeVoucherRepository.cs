using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;

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
            // StockTakeVoucherId đã được service set từ GenerateVoucherIdAsync()
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

        // ── Sửa lỗi 5: sort theo số thay vì sort theo string ──────────
        // Lỗi cũ: OrderByDescending(v => v.VoucherCode) sort string
        // → "KK9" > "KK10" > "KK2" vì so sánh ký tự, sequence sẽ sai
        // Sửa: lấy hết code về memory rồi parse số để tìm max
        public async Task<string> GenerateVoucherIdAsync()
        {
            var codes = await _context.StockTakeVouchers
                .Where(v => v.StockTakeVoucherId.StartsWith("KK"))
                .Select(v => v.StockTakeVoucherId)
                .ToListAsync();

            int nextNumber = 1;

            if (codes.Any())
            {
                var maxNumber = codes
                    .Select(code =>
                        int.TryParse(code.Substring(2), out int n) ? n : 0)
                    .Max();

                nextNumber = maxNumber + 1;
            }

            return $"KK{nextNumber:D6}";
        }
    }
}