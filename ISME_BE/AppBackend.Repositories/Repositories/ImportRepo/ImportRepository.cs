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

        public async Task<(int SaleVoucherDetailId, int SoldQty)?> GetSaleSourceDetailAsync(
            string saleVoucherId,
            string goodsId,
            int? saleVoucherDetailId = null)
        {
            var query = _context.VoucherDetails
                .Include(d => d.Voucher)
                .Where(d =>
                    d.VoucherId == saleVoucherId &&
                    d.GoodsId == goodsId &&
                    d.Voucher != null &&
                    d.Voucher.VoucherCode != null &&
                    (d.Voucher.VoucherCode.StartsWith("BH") || d.Voucher.VoucherCode.StartsWith("XH")));

            if (saleVoucherDetailId.HasValue)
                query = query.Where(d => d.Id == saleVoucherDetailId.Value);

            var detail = await query
                .OrderBy(d => d.Id)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            return detail == null
                ? null
                : (detail.Id, detail.Quantity ?? 0);
        }

        public async Task<int> GetReturnedQuantityForSaleLineAsync(
            int saleVoucherDetailId,
            string saleVoucherId,
            string goodsId,
            string? excludeImportVoucherId = null)
        {
            return await _context.VoucherDetails
                .Where(d =>
                    d.Voucher != null &&
                    d.Voucher.VoucherCode == "NK2" &&
                    (excludeImportVoucherId == null || d.VoucherId != excludeImportVoucherId) &&
                    (
                        d.SourceVoucherDetailId == saleVoucherDetailId ||
                        (
                            d.SourceVoucherDetailId == null &&
                            (d.SourceVoucherId == saleVoucherId || d.OffsetVoucher == saleVoucherId) &&
                            d.GoodsId == goodsId
                        )
                    ))
                .AsNoTracking()
                .SumAsync(d => d.Quantity ?? 0);
        }

        public async Task AddSellableStockAsync(string goodsId, int quantity)
        {
            var goods = await _context.Goods.FirstOrDefaultAsync(g => g.GoodsId == goodsId);
            if (goods == null)
                throw new InvalidOperationException($"Không tìm thấy hàng hóa: {goodsId}");
            goods.ItemOnHand = (goods.ItemOnHand ?? 0) + quantity;
        }

        public async Task DeductSellableStockAsync(string goodsId, int quantity)
        {
            var goods = await _context.Goods.FirstOrDefaultAsync(g => g.GoodsId == goodsId);
            if (goods == null)
                throw new InvalidOperationException($"Không tìm thấy hàng hóa: {goodsId}");
            goods.ItemOnHand = Math.Max(0, (goods.ItemOnHand ?? 0) - quantity);
        }

        public async Task AddQuarantineStockAsync(string goodsId, int quantity)
        {
            var goods = await _context.Goods.FirstOrDefaultAsync(g => g.GoodsId == goodsId);
            if (goods == null)
                throw new InvalidOperationException($"Không tìm thấy hàng hóa: {goodsId}");
            goods.QuarantineOnHand = (goods.QuarantineOnHand ?? 0) + quantity;
        }

        public async Task DeductQuarantineStockAsync(string goodsId, int quantity)
        {
            var goods = await _context.Goods.FirstOrDefaultAsync(g => g.GoodsId == goodsId);
            if (goods == null)
                throw new InvalidOperationException($"Không tìm thấy hàng hóa: {goodsId}");
            goods.QuarantineOnHand = Math.Max(0, (goods.QuarantineOnHand ?? 0) - quantity);
        }

        public async Task<bool> HasDependentExportsAsync(string inboundVoucherId)
        {
            // Kiểm tra có dòng xuất nào đối trừ vào phiếu nhập này không
            // (OffsetVoucher lưu VoucherId của phiếu nhập)
            return await _context.VoucherDetails
                .AnyAsync(d =>
                    d.OffsetVoucher == inboundVoucherId &&
                    d.Voucher != null &&
                    d.Voucher.VoucherCode != null &&
                    d.Voucher.VoucherCode.StartsWith("XK"));
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
