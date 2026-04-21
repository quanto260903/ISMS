using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Generic;
using AppBackend.Repositories.Repositories.UserRepo;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.GoodsRepo
{
    public class SaleGoodsRepository : ISaleGoodsRepository
    {
        private readonly IndividualBusinessContext _context;

        public SaleGoodsRepository(IndividualBusinessContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Voucher voucher)
        {
            if (voucher == null)
                throw new ArgumentNullException(nameof(voucher));

            await _context.Vouchers.AddAsync(voucher);
        }

        public async Task<Voucher?> GetByVoucherIdAsync(string voucherId)
        {
            return await _context.Vouchers
                .Include(v => v.VoucherDetails)
                .FirstOrDefaultAsync(v =>
                    v.VoucherId == voucherId &&
                    v.VoucherCode != null &&
                    v.VoucherCode.StartsWith("BH"));
        }

        public async Task<bool> IsUsedForNk2ReturnAsync(string saleVoucherId)
        {
            return await _context.Vouchers
                .Where(v => v.VoucherCode == "NK2")
                .AnyAsync(v => v.VoucherDetails.Any(d => d.OffsetVoucher == saleVoucherId));
        }

        public async Task<List<SaleSearchResult>> SearchAsync(string keyword, int limit)
        {
            var kw = keyword.Trim().ToLower();
            return await _context.Vouchers
                .Include(v => v.VoucherDetails)
                .Where(v => v.VoucherCode != null && v.VoucherCode.StartsWith("BH")
                    && (v.VoucherId.ToLower().Contains(kw)
                        || (v.CustomerName != null && v.CustomerName.ToLower().Contains(kw))))
                .OrderByDescending(v => v.VoucherDate)
                .Take(limit)
                .Select(v => new SaleSearchResult
                {
                    VoucherId    = v.VoucherId,
                    VoucherDate  = v.VoucherDate.HasValue ? v.VoucherDate.Value.ToString("yyyy-MM-dd") : null,
                    CustomerName = v.CustomerName,
                    TotalAmount  = v.VoucherDetails.Where(d => d.Amount1.HasValue).Sum(d => (decimal)d.Amount1!.Value),
                    ItemCount    = v.VoucherDetails.Count,
                })
                .ToListAsync();
        }
    }
}
