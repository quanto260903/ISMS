using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.OpenInventoryRepo
{
    public class OpenInventoryRepository : IOpenInventoryRepository
    {
        private readonly IndividualBusinessContext _ctx;
        public OpenInventoryRepository(IndividualBusinessContext ctx) => _ctx = ctx;

        public async Task<(IEnumerable<OpenInventory> Items, int Total)> GetListAsync(
            GetOpenInventoryListRequest req)
        {
            var query = _ctx.OpenInventories
                .Join(_ctx.Goods,
                    oi => oi.GoodsId, g => g.GoodsId,
                    (oi, g) => new { oi, g })
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(req.Keyword))
            {
                var kw = req.Keyword.Trim().ToLower();
                query = query.Where(x =>
                    x.oi.GoodsId!.ToLower().Contains(kw) ||
                    x.g.GoodsName.ToLower().Contains(kw));
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderBy(x => x.oi.GoodsId)
                .Skip((req.Page - 1) * req.PageSize)
                .Take(req.PageSize)
                .Select(x => x.oi)
                .ToListAsync();

            return (items, total);
        }

        public async Task<OpenInventory?> GetByGoodsIdAsync(string goodsId)
            => await _ctx.OpenInventories.FirstOrDefaultAsync(x => x.GoodsId == goodsId);

        public async Task<OpenInventorySummaryDto> GetSummaryAsync() => new()
        {
            TotalRows = await _ctx.OpenInventories.CountAsync(),
            TotalQuantity = await _ctx.OpenInventories.SumAsync(x => (decimal)(x.Quantity ?? 0)),
            TotalValue = await _ctx.OpenInventories.SumAsync(x =>
                (decimal)(x.Quantity ?? 0) * (x.DebitAmount0 ?? 0)),
        };

        public async Task AddAsync(OpenInventory entity)
            => await _ctx.OpenInventories.AddAsync(entity);

        public async Task<int> DeleteByGoodsIdAsync(string goodsId)
        {
            var e = await GetByGoodsIdAsync(goodsId);
            if (e == null) return 0;
            _ctx.OpenInventories.Remove(e);
            return await _ctx.SaveChangesAsync();
        }

        public async Task<int> SaveChangesAsync()
            => await _ctx.SaveChangesAsync();
    }
}
