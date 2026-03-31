using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;

namespace AppBackend.Repositories.Repositories.DashboardRepo;

public class DashboardRepository : IDashboardRepository
{
    private readonly IndividualBusinessContext _context;

    public DashboardRepository(IndividualBusinessContext context) => _context = context;

    public async Task<int> GetActiveProductCountAsync()
        => await _context.Goods.CountAsync(g => !g.IsInactive);

    public async Task<int> GetLowStockCountAsync()
        => await _context.Goods.CountAsync(g =>
            !g.IsInactive
            && g.MinimumStock != null && g.MinimumStock > 0
            && g.ItemOnHand != null
            && g.ItemOnHand < g.MinimumStock);

    public async Task<List<ProductStockInfo>> GetAllProductStockAsync()
    {
        var goods = await _context.Goods
            .Where(g => !g.IsInactive)
            .ToListAsync();

        return goods.Select(g =>
        {
            var stock = (int)(g.ItemOnHand ?? 0);
            var price = g.LastPurchasePrice ?? g.FixedPurchasePrice ?? 0m;

            return new ProductStockInfo
            {
                GoodsId = g.GoodsId,
                GoodsName = g.GoodsName,
                Unit = g.Unit,
                MinimumStock = g.MinimumStock,
                LastPurchasePrice = g.LastPurchasePrice,
                FixedPurchasePrice = g.FixedPurchasePrice,
                SalePrice = g.SalePrice,
                StockQuantity = stock,
                StockValue = stock * price
            };
        }).ToList();
    }

    public async Task<List<DailyImportExportAggregate>> GetDailyImportExportAsync(DateOnly start, DateOnly end)
    {
        var voucherDetails = await _context.VoucherDetails
            .Join(_context.Vouchers,
                vd => vd.VoucherId,
                v => v.VoucherId,
                (vd, v) => new
                {
                    vd.Quantity,
                    vd.Amount1,
                    vd.DebitAccount1,
                    vd.DebitAccount2,
                    vd.CreditAccount1,
                    vd.CreditAccount2,
                    v.VoucherDate
                })
            .Where(x => x.VoucherDate != null && x.VoucherDate >= start && x.VoucherDate <= end)
            .ToListAsync();

        var grouped = Enumerable.Range(0, end.DayNumber - start.DayNumber + 1)
            .Select(offset => start.AddDays(offset))
            .Select(date =>
            {
                var dayItems = voucherDetails.Where(x => x.VoucherDate == date).ToList();
                var imports = dayItems.Where(x => x.DebitAccount1 == "156" || x.DebitAccount2 == "156");
                var exports = dayItems.Where(x => x.CreditAccount1 == "156" || x.CreditAccount2 == "156");

                return new DailyImportExportAggregate
                {
                    Date = date,
                    ImportValue = imports.Sum(x => x.Amount1 ?? 0m),
                    ExportValue = exports.Sum(x => x.Amount1 ?? 0m),
                    ImportQuantity = (int)imports.Sum(x => (decimal)(x.Quantity ?? 0)),
                    ExportQuantity = (int)exports.Sum(x => (decimal)(x.Quantity ?? 0))
                };
            })
            .ToList();

        return grouped;
    }

    public async Task<decimal> GetRevenueForPeriodAsync(DateOnly start, DateOnly end)
    {
        return await _context.VoucherDetails
            .Join(_context.Vouchers,
                vd => vd.VoucherId,
                v => v.VoucherId,
                (vd, v) => new { vd.Amount1, v.VoucherCode, v.VoucherDate })
            .Where(x => x.VoucherCode != null
                     && x.VoucherCode.StartsWith("XH")
                     && x.VoucherDate != null
                     && x.VoucherDate >= start && x.VoucherDate <= end)
            .SumAsync(x => x.Amount1 ?? 0m);
    }

    public async Task<decimal> GetStockValueAsOfDateAsync(DateOnly asOfDate)
    {
        var goods = await _context.Goods
            .Where(g => !g.IsInactive)
            .Select(g => new { g.GoodsId, g.LastPurchasePrice, g.FixedPurchasePrice })
            .ToListAsync();

        var openInventories = await _context.OpenInventories
            .Where(oi => oi.GoodsId != null)
            .ToDictionaryAsync(oi => oi.GoodsId!, oi => (decimal)(oi.Quantity ?? 0));

        var inbounds = await _context.VoucherDetails
            .Join(_context.Vouchers,
                vd => vd.VoucherId, v => v.VoucherId,
                (vd, v) => new { vd.GoodsId, vd.Quantity, vd.DebitAccount1, vd.DebitAccount2, v.VoucherDate })
            .Where(x => x.GoodsId != null
                     && (x.DebitAccount1 == "156" || x.DebitAccount2 == "156")
                     && x.VoucherDate != null && x.VoucherDate <= asOfDate)
            .GroupBy(x => x.GoodsId!)
            .Select(g => new { GoodsId = g.Key, Total = g.Sum(x => (decimal)(x.Quantity ?? 0)) })
            .ToDictionaryAsync(x => x.GoodsId, x => x.Total);

        var outbounds = await _context.VoucherDetails
            .Join(_context.Vouchers,
                vd => vd.VoucherId, v => v.VoucherId,
                (vd, v) => new { vd.GoodsId, vd.Quantity, vd.CreditAccount1, vd.CreditAccount2, v.VoucherDate })
            .Where(x => x.GoodsId != null
                     && (x.CreditAccount1 == "156" || x.CreditAccount2 == "156")
                     && x.VoucherDate != null && x.VoucherDate <= asOfDate)
            .GroupBy(x => x.GoodsId!)
            .Select(g => new { GoodsId = g.Key, Total = g.Sum(x => (decimal)(x.Quantity ?? 0)) })
            .ToDictionaryAsync(x => x.GoodsId, x => x.Total);

        decimal totalValue = 0;
        foreach (var g in goods)
        {
            var open = openInventories.TryGetValue(g.GoodsId, out var oi) ? oi : 0;
            var inQty = inbounds.TryGetValue(g.GoodsId, out var i) ? i : 0;
            var outQty = outbounds.TryGetValue(g.GoodsId, out var o) ? o : 0;
            var stock = open + inQty - outQty;
            var price = g.LastPurchasePrice ?? g.FixedPurchasePrice ?? 0m;
            totalValue += stock * price;
        }

        return totalValue;
    }

    public async Task<int> GetStockQuantityAsOfDateAsync(DateOnly asOfDate)
    {
        var openTotal = await _context.OpenInventories
            .SumAsync(oi => (int)(oi.Quantity ?? 0));

        var inTotal = await _context.VoucherDetails
            .Join(_context.Vouchers,
                vd => vd.VoucherId, v => v.VoucherId,
                (vd, v) => new { vd.Quantity, vd.DebitAccount1, vd.DebitAccount2, v.VoucherDate })
            .Where(x => (x.DebitAccount1 == "156" || x.DebitAccount2 == "156")
                     && x.VoucherDate != null && x.VoucherDate <= asOfDate)
            .SumAsync(x => (int)(x.Quantity ?? 0));

        var outTotal = await _context.VoucherDetails
            .Join(_context.Vouchers,
                vd => vd.VoucherId, v => v.VoucherId,
                (vd, v) => new { vd.Quantity, vd.CreditAccount1, vd.CreditAccount2, v.VoucherDate })
            .Where(x => (x.CreditAccount1 == "156" || x.CreditAccount2 == "156")
                     && x.VoucherDate != null && x.VoucherDate <= asOfDate)
            .SumAsync(x => (int)(x.Quantity ?? 0));

        return openTotal + inTotal - outTotal;
    }

    public async Task<(string? SupplierId, string? SupplierName)?> GetLastSupplierForGoodsAsync(string goodsId)
    {
        var lastImport = await _context.VoucherDetails
            .Join(_context.Vouchers,
                vd => vd.VoucherId, v => v.VoucherId,
                (vd, v) => new { vd.GoodsId, v.CustomerId, v.CustomerName, v.VoucherCode, v.VoucherDate })
            .Where(x => x.GoodsId == goodsId
                     && x.VoucherCode != null && x.VoucherCode.StartsWith("NK"))
            .OrderByDescending(x => x.VoucherDate)
            .FirstOrDefaultAsync();

        if (lastImport == null) return null;
        return (lastImport.CustomerId, lastImport.CustomerName);
    }
}
