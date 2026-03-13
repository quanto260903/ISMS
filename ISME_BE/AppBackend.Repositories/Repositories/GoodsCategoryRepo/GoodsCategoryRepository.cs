using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.GoodsCategoryRepo
{
    public class GoodsCategoryRepository : IGoodsCategoryRepository
    {
        private readonly IndividualBusinessContext _context;
    public GoodsCategoryRepository(IndividualBusinessContext context)
        => _context = context;

    public async Task<(IEnumerable<GoodsCategory> Items, int Total)> GetListAsync(
        GetGoodsCategoryListRequest request)
    {
        var query = _context.GoodsCategories.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var kw = request.Keyword.Trim().ToLower();
            query = query.Where(g =>
                g.GoodsGroupId.ToLower().Contains(kw) ||
                g.GoodsGroupName.ToLower().Contains(kw));
        }

        if (request.IsInactive.HasValue)
            query = query.Where(g => g.IsInactive == request.IsInactive.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(g => g.GoodsGroupId)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<GoodsCategory?> GetByIdAsync(string id)
        => await _context.GoodsCategories
            .FirstOrDefaultAsync(g => g.GoodsGroupId == id);

    public async Task<bool> ExistsAsync(string id)
        => await _context.GoodsCategories.AnyAsync(g => g.GoodsGroupId == id);

    public async Task<int> CountGoodsAsync(string id)
        => await _context.Goods.CountAsync(g => g.GoodsGroupId == id);

    public async Task AddAsync(GoodsCategory entity)
        => await _context.GoodsCategories.AddAsync(entity);

    public async Task<int> SaveChangesAsync()
        => await _context.SaveChangesAsync();

    public async Task<int> DeleteAsync(string id)
    {
        var entity = await _context.GoodsCategories
            .FirstOrDefaultAsync(g => g.GoodsGroupId == id);
        if (entity == null) return 0;
        _context.GoodsCategories.Remove(entity);
        return await _context.SaveChangesAsync();
    }
}
}
