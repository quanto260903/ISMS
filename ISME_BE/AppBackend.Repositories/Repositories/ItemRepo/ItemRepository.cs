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
        public async Task<List<WarehouseTransactionDto>> GetWarehouseTransactionsAsync(string goodsId)
        {
            var query = await _context.VoucherDetails
                .Where(vd => (vd.DebitAccount1 == "156"
                          || vd.CreditAccount1 == "156")
                 && vd.GoodsId == goodsId)
                .Select(vd => new
                {
                    vd,
                    v = vd.Voucher
                })
                .GroupBy(x => new
                {
                    x.v.VoucherDate,
                    x.v.VoucherId,

                    WarehouseId = x.vd.DebitAccount1 == "156"
                        ? x.vd.DebitWarehouseId
                        : x.vd.CreditWarehouseId,

                    x.vd.GoodsId,
                    x.vd.Unit,
                    x.vd.OffsetVoucher
                })
                .Select(g => new WarehouseTransactionDto
                {
                    VoucherDate = g.Key.VoucherDate,
                    VoucherId = g.Key.VoucherId,
                    WarehouseId = g.Key.WarehouseId,
                    GoodsId = g.Key.GoodsId,
                    Unit = g.Key.Unit,
                    OffsetVoucher = g.Key.OffsetVoucher,

                    WarehouseIn = g.Sum(x =>
                        x.vd.DebitAccount1 == "156"
                            ? (decimal?)x.vd.Quantity ?? 0
                            : 0),

                    WarehouseOut = g.Sum(x =>
                        x.vd.CreditAccount1 == "156"
                            ? (decimal?)x.vd.Quantity ?? 0
                            : 0),

                    CustomInHand =
                        g.Sum(x =>
                            x.vd.DebitAccount1 == "156"
                                ? (decimal?)x.vd.Quantity ?? 0
                                : 0)
                        -
                        g.Sum(x =>
                            x.vd.CreditAccount1 == "156"
                                ? (decimal?)x.vd.Quantity ?? 0
                                : 0),

                    Cost = g.Sum(x => (decimal?)x.vd.Amount1 ?? 0)
                })
                .OrderBy(x => x.GoodsId)
                .ThenBy(x => x.VoucherDate)
                .ToListAsync();

            return query;
        }
        /// <inheritdoc/>
        public async Task<IEnumerable<GoodsSearchDto>> SearchByIdAsync(
            string keyword,
            int limit = 10,
            CancellationToken cancellationToken = default)
        {
            // Chuẩn hoá keyword: bỏ khoảng trắng 2 đầu, không phân biệt hoa thường
            var normalizedKeyword = keyword.Trim().ToLower();

            return await _context.Goods
                .AsNoTracking()                              // chỉ đọc → nhanh hơn
                .Where(g =>
                    !g.IsInactive &&                            // chỉ hàng đang hoạt động
                    g.GoodsId.ToLower()
                              .Contains(normalizedKeyword))  // GoodsId chứa keyword
                .OrderBy(g => g.GoodsId)                    // sắp xếp để dropdown dễ đọc
                .Take(limit)                                 // giới hạn số kết quả
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