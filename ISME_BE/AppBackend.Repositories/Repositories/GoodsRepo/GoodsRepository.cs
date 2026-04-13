using AppBackend.BusinessObjects.Constants;
using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;

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
                    QuarantineOnHand = g.QuarantineOnHand,
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

            var openInventories = await _context.OpenInventories
                .ToDictionaryAsync(oi => oi.GoodsId!, oi => (decimal)(oi.Quantity ?? 0));

            var inbounds = await _context.VoucherDetails
                .Join(_context.Vouchers,
                    vd => vd.VoucherId,
                    v => v.VoucherId,
                    (vd, v) => new
                    {
                        vd.GoodsId,
                        vd.Quantity,
                        vd.DebitAccount1,
                        vd.DebitAccount2,
                        vd.StockBucket,
                        v.VoucherDate,
                        v.VoucherCode
                    })
                .Where(x => x.GoodsId != null
                         && (x.DebitAccount1 == "156" || x.DebitAccount2 == "156")
                         && x.StockBucket != StockBucketConstants.Quarantine
                         && x.VoucherCode != "NK2"
                         && x.VoucherDate != null && x.VoucherDate <= asOfDate)
                .GroupBy(x => x.GoodsId!)
                .Select(g => new { GoodsId = g.Key, Total = g.Sum(x => (decimal)(x.Quantity ?? 0)) })
                .ToDictionaryAsync(x => x.GoodsId, x => x.Total);

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

        public async Task<decimal> GetStockAsOfDateAsync(string goodsId, DateOnly asOfDate)
        {
            var openQty = (decimal?)((await _context.OpenInventories
                .FirstOrDefaultAsync(oi => oi.GoodsId == goodsId))?.Quantity ?? 0) ?? 0;

            var inQty = await _context.VoucherDetails
                .Join(_context.Vouchers,
                    vd => vd.VoucherId,
                    v => v.VoucherId,
                    (vd, v) => new
                    {
                        vd.GoodsId,
                        vd.Quantity,
                        vd.DebitAccount1,
                        vd.DebitAccount2,
                        vd.StockBucket,
                        v.VoucherDate,
                        v.VoucherCode
                    })
                .Where(x => x.GoodsId == goodsId
                         && (x.DebitAccount1 == "156" || x.DebitAccount2 == "156")
                         && x.StockBucket != StockBucketConstants.Quarantine
                         && x.VoucherCode != "NK2"
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
