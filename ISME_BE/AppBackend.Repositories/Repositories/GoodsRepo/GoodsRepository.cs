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
    }
}
