using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.ItemRepo
{
    public class ItemRepository : IItemRepository
    {
        private readonly IndividualBusinessContext _context;

        public ItemRepository(IndividualBusinessContext context)
        {
            _context = context;
        }

        public async Task<Good> GetByIdAsync(string itemId)
        {
            if (string.IsNullOrWhiteSpace(itemId))
                throw new ArgumentException("ItemId cannot be null or empty", nameof(itemId));

            var item = await _context.Goods
                .FirstOrDefaultAsync(x => x.GoodsId == itemId);

            if (item == null)
                throw new KeyNotFoundException($"Goods with id {itemId} not found");

            return item;
        }
        /// <summary>
        /// Lấy tồn kho theo từng phiếu nhập của 1 mặt hàng.
        /// 
        /// Logic FIFO có lùi ngày:
        /// - Chỉ tính các phiếu NHẬP có VoucherDate <= asOfDate (ngày xuất kho đang tạo)
        /// - Tồn của mỗi phiếu nhập = WarehouseIn - tổng WarehouseOut đã xuất từ phiếu đó
        /// - Chỉ trả về các phiếu còn tồn > 0
        /// 
        /// Ví dụ: asOfDate = ngày 11
        /// → phiếu nhập ngày 12 bị loại → không có hàng để xuất ✅
        /// 
        /// Ví dụ: asOfDate = ngày 13
        /// → phiếu nhập ngày 10 và ngày 12 đều hợp lệ
        /// → tính tồn thực tế của từng phiếu ✅
        /// </summary>
        public async Task<List<WarehouseTransactionDto>> GetWarehouseTransactionsAsync(
            string goodsId,
            DateOnly? asOfDate = null)   // null = không giới hạn ngày (dùng khi xem báo cáo)
        {
            // ── 1. Lấy tất cả VoucherDetail liên quan đến TK 156 của mặt hàng ──
            var data = await _context.VoucherDetails
                .Where(vd =>
                    vd.GoodsId == goodsId
                    && (
                        vd.DebitAccount1 == "156"
                        || vd.DebitAccount2 == "156"
                        || vd.CreditAccount1 == "156"
                        || vd.CreditAccount2 == "156"
                    ))
                .Include(vd => vd.Voucher)
                .ToListAsync();

            // ── 2. Tách riêng dòng NHẬP và dòng XUẤT ──────────────────────────
            // Nhập kho: Debit 156 (tồn tăng)
            // Xuất kho: Credit 156 (tồn giảm)
            var inboundRows = data
                .Where(vd => vd.DebitAccount1 == "156" || vd.DebitAccount2 == "156")
                .ToList();

            var outboundRows = data
                .Where(vd => vd.CreditAccount1 == "156" || vd.CreditAccount2 == "156")
                .ToList();

            // ── 3. Filter phiếu NHẬP theo asOfDate ────────────────────────────
            // Nếu asOfDate = ngày 11 → bỏ phiếu nhập ngày 12 trở đi
            // Nếu asOfDate = null    → giữ tất cả (dùng cho màn hình báo cáo)
            var eligibleInbounds = asOfDate.HasValue
                ? inboundRows.Where(vd =>
                    vd.Voucher?.VoucherDate != null
                    && vd.Voucher.VoucherDate.Value <= asOfDate.Value)
                  .ToList()
                : inboundRows;

            // ── 4. Group theo VoucherId của phiếu NHẬP ────────────────────────
            // Tính WarehouseIn, Cost, UnitPrice cho từng phiếu nhập đủ điều kiện
            var inboundGroups = eligibleInbounds
                .GroupBy(vd => vd.VoucherId)
                .Select(g =>
                {
                    var firstRow = g.First();
                    return new
                    {
                        InboundVoucherId = g.Key,
                        VoucherDate = firstRow.Voucher?.VoucherDate,
                        WarehouseIn = g.Sum(vd => (decimal?)vd.Quantity ?? 0),
                        Cost = g.Sum(vd => (decimal?)vd.Amount1 ?? 0),
                        UnitPrice = firstRow.UnitPrice ?? 0,
                    };
                })
                .ToList();

            // ── 5. Tính WarehouseOut cho từng phiếu nhập ──────────────────────
            // OffsetVoucher trên dòng xuất trỏ đến VoucherId của phiếu nhập
            // → group theo OffsetVoucher để biết đã xuất bao nhiêu từ mỗi phiếu nhập
            var outboundByInbound = outboundRows
                .Where(vd => vd.OffsetVoucher != null)
                .GroupBy(vd => vd.OffsetVoucher!)
                .ToDictionary(
                    g => g.Key,
                    g => g.Sum(vd => (decimal?)vd.Quantity ?? 0)
                );

            // ── 6. Build kết quả ──────────────────────────────────────────────
            var result = inboundGroups
                .Select(ib =>
                {
                    var warehouseOut = outboundByInbound.TryGetValue(
                        ib.InboundVoucherId!, out var o) ? o : 0;

                    return new WarehouseTransactionDto
                    {
                        OffsetVoucher = ib.InboundVoucherId,
                        GoodsId = goodsId,
                        VoucherDate = ib.VoucherDate,
                        WarehouseIn = ib.WarehouseIn,
                        WarehouseOut = warehouseOut,
                        CustomInHand = ib.WarehouseIn - warehouseOut,
                        Cost = ib.Cost,
                        UnitPrice = ib.UnitPrice,
                    };
                })
                .Where(x => x.CustomInHand > 0)     // chỉ phiếu còn tồn
                .OrderBy(x => x.VoucherDate)         // FIFO: cũ nhất lên đầu
                .ToList();

            return result;
        }
        /// <inheritdoc/>
        public async Task<IEnumerable<GoodsSearchDto>> SearchByIdAsync(
      string keyword,
      int limit = 10,
      CancellationToken cancellationToken = default)
        {
            var normalizedKeyword = keyword.Trim().ToLower();

            return await _context.Goods
                .AsNoTracking()
                .Where(g =>
                    !g.IsInactive &&
                    (g.GoodsId.ToLower().Contains(normalizedKeyword) ||
                     g.GoodsName.ToLower().Contains(normalizedKeyword)))
                .OrderBy(g =>
                    g.GoodsId.ToLower().StartsWith(normalizedKeyword) ? 0 :
                    g.GoodsName.ToLower().StartsWith(normalizedKeyword) ? 1 : 2)
                .ThenBy(g => g.GoodsId)
                .Take(limit)
                .Select(g => new GoodsSearchDto
                {
                    GoodsId = g.GoodsId,
                    GoodsName = g.GoodsName,
                    Unit = g.Unit,
                    SalePrice = g.SalePrice,
                    Vatrate = g.Vatrate,
                    ItemOnHand = g.ItemOnHand,
                })
                .ToListAsync(cancellationToken);
        }
    }
}