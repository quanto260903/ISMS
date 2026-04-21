using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.ImportRepo
{
    public class ImportRepository : IImportRepository
    {
        private readonly IndividualBusinessContext _context;

        public ImportRepository(IndividualBusinessContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Voucher voucher)
        {
            if (voucher == null)
                throw new ArgumentNullException(nameof(voucher));

            await _context.Vouchers.AddAsync(voucher);
        }

        public async Task<(IEnumerable<Voucher> Items, int Total)> GetListAsync(
          GetInwardListRequest request)
        {
            // Phiếu nhập kho = VoucherCode bắt đầu bằng "NK"
            var query = _context.Vouchers
                .Include(v => v.VoucherDetails)
                .Where(v => v.VoucherCode != null && v.VoucherCode.StartsWith("NK"))
                .AsQueryable();

            // ── Lọc ngày ──
            if (request.FromDate.HasValue)
                query = query.Where(v => v.VoucherDate >= request.FromDate);
            if (request.ToDate.HasValue)
                query = query.Where(v => v.VoucherDate <= request.ToDate);

            // ── Tìm kiếm ──
            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                var kw = request.Keyword.Trim().ToLower();
                query = query.Where(v =>
                    v.VoucherId.ToLower().Contains(kw) ||
                    (v.CustomerName != null && v.CustomerName.ToLower().Contains(kw)));
            }

            // ── Lọc theo loại phiếu ──
            if (!string.IsNullOrWhiteSpace(request.VoucherCode))
                query = query.Where(v => v.VoucherCode == request.VoucherCode);

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(v => v.VoucherDate)
                .ThenByDescending(v => v.VoucherId)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return (items, total);
        }
        public async Task<Voucher?> GetByIdAsync(string voucherId)
        {
            return await _context.Vouchers
                .Include(v => v.VoucherDetails)
                .FirstOrDefaultAsync(v =>
                    v.VoucherId == voucherId &&
                    v.VoucherCode != null &&
                    v.VoucherCode.StartsWith("NK"));
        }

        public async Task UpdateAsync(Voucher voucher)
        {
            _context.Vouchers.Update(voucher);
        }

        public async Task DeleteAsync(string voucherId)
        {
            var voucher = await _context.Vouchers
                .Include(v => v.VoucherDetails)
                .FirstOrDefaultAsync(v => v.VoucherId == voucherId);
            if (voucher != null)
                _context.Vouchers.Remove(voucher);
        }

        public async Task<bool> IsAlreadyReturnedAsync(string saleVoucherId)
        {
            return await _context.Vouchers
                .Where(v => v.VoucherCode == "NK2")
                .AnyAsync(v => v.VoucherDetails.Any(d => d.OffsetVoucher == saleVoucherId));
        }

        public async Task AddStockAsync(string goodsId, int quantity)
        {
            var goods = await _context.Goods.FirstOrDefaultAsync(g => g.GoodsId == goodsId);
            if (goods == null)
                throw new InvalidOperationException($"Không tìm thấy hàng hóa: {goodsId}");
            goods.ItemOnHand = (goods.ItemOnHand ?? 0) + quantity;
        }

        public async Task DeductStockAsync(string goodsId, int quantity)
        {
            var goods = await _context.Goods.FirstOrDefaultAsync(g => g.GoodsId == goodsId);
            if (goods == null)
                throw new InvalidOperationException($"Không tìm thấy hàng hóa: {goodsId}");
            goods.ItemOnHand = Math.Max(0, (goods.ItemOnHand ?? 0) - quantity);
        }

        public async Task<bool> HasDependentExportsAsync(string inboundVoucherId)
        {
            return await _context.VoucherDetails
                .AnyAsync(d => d.OffsetVoucher == inboundVoucherId);
        }

        public async Task<bool> IsUsedForXk1ReturnAsync(string inwardVoucherId)
        {
            return await _context.Vouchers
                .Where(v => v.VoucherCode == "XK1")
                .AnyAsync(v => v.VoucherDetails.Any(d => d.OffsetVoucher == inwardVoucherId));
        }

        public async Task<List<InwardSearchResult>> SearchAsync(string keyword, int limit)
        {
            var kw = keyword.Trim().ToLower();
            return await _context.Vouchers
                .Include(v => v.VoucherDetails)
                .Where(v => v.VoucherCode != null && v.VoucherCode.StartsWith("NK")
                    && (v.VoucherId.ToLower().Contains(kw)
                        || (v.CustomerName != null && v.CustomerName.ToLower().Contains(kw))))
                .OrderByDescending(v => v.VoucherDate)
                .Take(limit)
                .Select(v => new InwardSearchResult
                {
                    VoucherId    = v.VoucherId,
                    VoucherDate  = v.VoucherDate.HasValue ? v.VoucherDate.Value.ToString("yyyy-MM-dd") : null,
                    CustomerName = v.CustomerName,
                    TotalAmount  = v.VoucherDetails.Where(d => d.Amount1.HasValue).Sum(d => (decimal)d.Amount1!.Value),
                    ItemCount    = v.VoucherDetails.Count,
                })
                .ToListAsync();
        }

        public async Task<string> GenerateVoucherIdAsync()
        {
            var ids = await _context.Vouchers
                .Where(v => v.VoucherId != null && v.VoucherId.StartsWith("NK"))
                .Select(v => v.VoucherId!)
                .ToListAsync();

            int nextNumber = 1;
            if (ids.Any())
            {
                var maxNumber = ids
                    .Select(id => int.TryParse(id.Substring(2), out int n) ? n : 0)
                    .Max();
                nextNumber = maxNumber + 1;
            }

            return $"NK{nextNumber:D6}";
        }

    }
}
