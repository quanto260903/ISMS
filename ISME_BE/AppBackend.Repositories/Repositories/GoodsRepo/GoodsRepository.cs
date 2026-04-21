using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.GoodsRepo
{
    public class GoodsRepository : IGoodsRepository
    {
        private readonly IndividualBusinessContext _context;
        public GoodsRepository(IndividualBusinessContext context) => _context = context;

        public async Task<(IEnumerable<Good> Items, int Total)> GetListAsync(
            GetGoodsListRequest request)
        {
            var query = _context.Goods
                .Include(g => g.GoodsGroup)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                var kw = request.Keyword.Trim().ToLower();
                query = query.Where(g =>
                    g.GoodsId.ToLower().Contains(kw) ||
                    g.GoodsName.ToLower().Contains(kw));
            }

            if (!string.IsNullOrWhiteSpace(request.GoodsGroupId))
                query = query.Where(g => g.GoodsGroupId == request.GoodsGroupId);

            if (request.IsInactive.HasValue)
                query = query.Where(g => g.IsInactive == request.IsInactive.Value);

            if (request.IsPromotion.HasValue)
                query = query.Where(g => g.IsPromotion == request.IsPromotion.Value);

            var total = await query.CountAsync();
            var items = await query
                .OrderBy(g => g.GoodsGroupId)
                .ThenBy(g => g.GoodsName)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return (items, total);
        }

        public async Task<Good?> GetByIdAsync(string id)
            => await _context.Goods
                .Include(g => g.GoodsGroup)
                .FirstOrDefaultAsync(g => g.GoodsId == id);

        public async Task<bool> ExistsAsync(string id)
            => await _context.Goods.AnyAsync(g => g.GoodsId == id);

        public async Task<List<GoodsSearchResult>> SearchAsync(string keyword, int limit = 10)
        {
            var kw = keyword.Trim().ToLower();
            return await _context.Goods
                .Where(g =>
                    g.IsInactive == false &&
                    (g.GoodsId.ToLower().Contains(kw) ||
                     g.GoodsName.ToLower().Contains(kw)))
                .OrderBy(g => g.GoodsName)
                .Take(limit)
                .Select(g => new GoodsSearchResult
                {
                    GoodsId = g.GoodsId,
                    GoodsName = g.GoodsName,
                    Unit = g.Unit,
                    SalePrice = g.SalePrice,
                    ItemOnHand = g.ItemOnHand,
                })
                .ToListAsync();
        }

        public async Task AddAsync(Good entity)
            => await _context.Goods.AddAsync(entity);

        public async Task<int> SaveChangesAsync()
            => await _context.SaveChangesAsync();

        public async Task<int> DeleteAsync(string id)
        {
            var entity = await _context.Goods.FirstOrDefaultAsync(g => g.GoodsId == id);
            if (entity == null) return 0;
            _context.Goods.Remove(entity);
            return await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<GoodsStockDto>> GetAllGoodsStockAsOfDateAsync(DateOnly asOfDate)
        {
            var goods = await _context.Goods
                .Where(g => g.IsInactive == false)
                .OrderBy(g => g.GoodsName)
                .ToListAsync();

            // Tồn đầu kỳ từ OpenInventory
            var openInventories = await _context.OpenInventories
                .ToDictionaryAsync(oi => oi.GoodsId!, oi => (decimal)(oi.Quantity ?? 0));

            // Tổng nhập kho (Debit 156) đến ngày asOfDate
            var inbounds = await _context.VoucherDetails
                .Join(_context.Vouchers,
                    vd => vd.VoucherId,
                    v => v.VoucherId,
                    (vd, v) => new { vd.GoodsId, vd.Quantity, vd.DebitAccount1, vd.DebitAccount2, v.VoucherDate })
                .Where(x => x.GoodsId != null
                         && (x.DebitAccount1 == "156" || x.DebitAccount2 == "156")
                         && x.VoucherDate != null && x.VoucherDate <= asOfDate)
                .GroupBy(x => x.GoodsId!)
                .Select(g => new { GoodsId = g.Key, Total = g.Sum(x => (decimal)(x.Quantity ?? 0)) })
                .ToDictionaryAsync(x => x.GoodsId, x => x.Total);

            // Tổng xuất kho (Credit 156) đến ngày asOfDate
            var outbounds = await _context.VoucherDetails
                .Join(_context.Vouchers,
                    vd => vd.VoucherId,
                    v => v.VoucherId,
                    (vd, v) => new { vd.GoodsId, vd.Quantity, vd.CreditAccount1, vd.CreditAccount2, v.VoucherDate })
                .Where(x => x.GoodsId != null
                         && (x.CreditAccount1 == "156" || x.CreditAccount2 == "156")
                         && x.VoucherDate != null && x.VoucherDate <= asOfDate)
                .GroupBy(x => x.GoodsId!)
                .Select(g => new { GoodsId = g.Key, Total = g.Sum(x => (decimal)(x.Quantity ?? 0)) })
                .ToDictionaryAsync(x => x.GoodsId, x => x.Total);

            return goods.Select(g => new GoodsStockDto
            {
                GoodsId = g.GoodsId,
                GoodsName = g.GoodsName,
                Unit = g.Unit,
                StockQuantity = (openInventories.TryGetValue(g.GoodsId, out var oi) ? oi : 0)
                               + (inbounds.TryGetValue(g.GoodsId, out var inQty) ? inQty : 0)
                               - (outbounds.TryGetValue(g.GoodsId, out var outQty) ? outQty : 0),
            });
        }

        public async Task<InventorySummaryDto> GetInventorySummaryAsync(
            DateOnly fromDate, DateOnly toDate, string? keyword = null)
        {
            var prevDate = fromDate.AddDays(-1);  // ngày trước kỳ để tính tồn đầu kỳ

            // Danh sách hàng hóa
            var goodsQuery = _context.Goods
                .Include(g => g.GoodsGroup)
                .Where(g => g.IsInactive == false);

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToLower();
                goodsQuery = goodsQuery.Where(g =>
                    g.GoodsId.ToLower().Contains(kw) ||
                    g.GoodsName.ToLower().Contains(kw));
            }

            var goods = await goodsQuery
                .OrderBy(g => g.GoodsGroupId)
                .ThenBy(g => g.GoodsName)
                .ToListAsync();

            // Tồn kho ban đầu (OpenInventory)
            var openInventories = await _context.OpenInventories
                .ToDictionaryAsync(oi => oi.GoodsId!, oi => (decimal)(oi.Quantity ?? 0));

            // ── Nhập trước kỳ (Debit 156, date < fromDate) ────────────
            var openingInbounds = await _context.VoucherDetails
                .Join(_context.Vouchers, vd => vd.VoucherId, v => v.VoucherId,
                    (vd, v) => new { vd.GoodsId, vd.Quantity, vd.DebitAccount1, vd.DebitAccount2, v.VoucherDate })
                .Where(x => x.GoodsId != null
                         && (x.DebitAccount1 == "156" || x.DebitAccount2 == "156")
                         && x.VoucherDate != null && x.VoucherDate <= prevDate)
                .GroupBy(x => x.GoodsId!)
                .Select(g => new { GoodsId = g.Key, Total = g.Sum(x => (decimal)(x.Quantity ?? 0)) })
                .ToDictionaryAsync(x => x.GoodsId, x => x.Total);

            // ── Xuất trước kỳ (Credit 156, date < fromDate) ───────────
            var openingOutbounds = await _context.VoucherDetails
                .Join(_context.Vouchers, vd => vd.VoucherId, v => v.VoucherId,
                    (vd, v) => new { vd.GoodsId, vd.Quantity, vd.CreditAccount1, vd.CreditAccount2, v.VoucherDate })
                .Where(x => x.GoodsId != null
                         && (x.CreditAccount1 == "156" || x.CreditAccount2 == "156")
                         && x.VoucherDate != null && x.VoucherDate <= prevDate)
                .GroupBy(x => x.GoodsId!)
                .Select(g => new { GoodsId = g.Key, Total = g.Sum(x => (decimal)(x.Quantity ?? 0)) })
                .ToDictionaryAsync(x => x.GoodsId, x => x.Total);

            // ── Nhập trong kỳ (Debit 156, fromDate <= date <= toDate) ──
            var periodInbounds = await _context.VoucherDetails
                .Join(_context.Vouchers, vd => vd.VoucherId, v => v.VoucherId,
                    (vd, v) => new { vd.GoodsId, vd.Quantity, vd.DebitAccount1, vd.DebitAccount2, v.VoucherDate })
                .Where(x => x.GoodsId != null
                         && (x.DebitAccount1 == "156" || x.DebitAccount2 == "156")
                         && x.VoucherDate != null
                         && x.VoucherDate >= fromDate && x.VoucherDate <= toDate)
                .GroupBy(x => x.GoodsId!)
                .Select(g => new { GoodsId = g.Key, Total = g.Sum(x => (decimal)(x.Quantity ?? 0)) })
                .ToDictionaryAsync(x => x.GoodsId, x => x.Total);

            // ── Xuất trong kỳ (Credit 156, fromDate <= date <= toDate) ─
            var periodOutbounds = await _context.VoucherDetails
                .Join(_context.Vouchers, vd => vd.VoucherId, v => v.VoucherId,
                    (vd, v) => new { vd.GoodsId, vd.Quantity, vd.CreditAccount1, vd.CreditAccount2, v.VoucherDate })
                .Where(x => x.GoodsId != null
                         && (x.CreditAccount1 == "156" || x.CreditAccount2 == "156")
                         && x.VoucherDate != null
                         && x.VoucherDate >= fromDate && x.VoucherDate <= toDate)
                .GroupBy(x => x.GoodsId!)
                .Select(g => new { GoodsId = g.Key, Total = g.Sum(x => (decimal)(x.Quantity ?? 0)) })
                .ToDictionaryAsync(x => x.GoodsId, x => x.Total);

            // ── Tính toán từng mặt hàng ────────────────────────────────
            var items = goods.Select(g =>
            {
                var opening  = (openInventories.TryGetValue(g.GoodsId, out var oi)  ? oi : 0)
                             + (openingInbounds.TryGetValue(g.GoodsId, out var oin) ? oin : 0)
                             - (openingOutbounds.TryGetValue(g.GoodsId, out var oout) ? oout : 0);
                var inbound  = periodInbounds.TryGetValue(g.GoodsId, out var pIn)   ? pIn  : 0;
                var outbound = periodOutbounds.TryGetValue(g.GoodsId, out var pOut) ? pOut : 0;

                return new
                {
                    Good     = g,
                    GroupId  = g.GoodsGroupId,
                    GroupName= g.GoodsGroup?.GoodsGroupName ?? "Chưa phân nhóm",
                    Item     = new InventorySummaryItemDto
                    {
                        GoodsId  = g.GoodsId,
                        GoodsName= g.GoodsName,
                        Unit     = g.Unit,
                        Opening  = opening,
                        Inbound  = inbound,
                        Outbound = outbound,
                        Closing  = opening + inbound - outbound,
                    },
                };
            }).ToList();

            // ── Gom nhóm ──────────────────────────────────────────────
            var groups = items
                .GroupBy(x => new { x.GroupId, x.GroupName })
                .OrderBy(g => g.Key.GroupId)
                .Select(g =>
                {
                    var groupItems = g.Select(x => x.Item).ToList();
                    return new InventorySummaryGroupDto
                    {
                        GroupId     = g.Key.GroupId,
                        GroupName   = g.Key.GroupName,
                        SubOpening  = groupItems.Sum(i => i.Opening),
                        SubInbound  = groupItems.Sum(i => i.Inbound),
                        SubOutbound = groupItems.Sum(i => i.Outbound),
                        SubClosing  = groupItems.Sum(i => i.Closing),
                        Items       = groupItems,
                    };
                })
                .ToList();

            var totals = new InventorySummaryTotalsDto
            {
                TotalItems   = items.Count,
                TotalOpening = items.Sum(x => x.Item.Opening),
                TotalInbound = items.Sum(x => x.Item.Inbound),
                TotalOutbound= items.Sum(x => x.Item.Outbound),
                TotalClosing = items.Sum(x => x.Item.Closing),
            };

            return new InventorySummaryDto
            {
                FromDate    = fromDate,
                ToDate      = toDate,
                GeneratedAt = DateTime.Now,
                Groups      = groups,
                Totals      = totals,
            };
        }

        public async Task<decimal> GetStockAsOfDateAsync(string goodsId, DateOnly asOfDate)
        {
            var openQty = (decimal?)((await _context.OpenInventories
                .FirstOrDefaultAsync(oi => oi.GoodsId == goodsId))?.Quantity ?? 0) ?? 0;

            var inQty = await _context.VoucherDetails
                .Join(_context.Vouchers,
                    vd => vd.VoucherId,
                    v => v.VoucherId,
                    (vd, v) => new { vd.GoodsId, vd.Quantity, vd.DebitAccount1, vd.DebitAccount2, v.VoucherDate })
                .Where(x => x.GoodsId == goodsId
                         && (x.DebitAccount1 == "156" || x.DebitAccount2 == "156")
                         && x.VoucherDate != null && x.VoucherDate <= asOfDate)
                .SumAsync(x => (decimal)(x.Quantity ?? 0));

            var outQty = await _context.VoucherDetails
                .Join(_context.Vouchers,
                    vd => vd.VoucherId,
                    v => v.VoucherId,
                    (vd, v) => new { vd.GoodsId, vd.Quantity, vd.CreditAccount1, vd.CreditAccount2, v.VoucherDate })
                .Where(x => x.GoodsId == goodsId
                         && (x.CreditAccount1 == "156" || x.CreditAccount2 == "156")
                         && x.VoucherDate != null && x.VoucherDate <= asOfDate)
                .SumAsync(x => (decimal)(x.Quantity ?? 0));

            return openQty + inQty - outQty;
        }
    }
}
