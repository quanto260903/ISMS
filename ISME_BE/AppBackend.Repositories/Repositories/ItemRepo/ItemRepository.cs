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
            var data = await _context.VoucherDetails
                .Where(vd =>
                    (
                        vd.DebitAccount1 == "156"
                        || vd.DebitAccount2 == "156"
                        || vd.CreditAccount1 == "156"
                        || vd.CreditAccount2 == "156"
                    )
                    && vd.GoodsId == goodsId)
                .Include(vd => vd.Voucher)
                .Include(vd => vd.DebitWarehouse)   // 🔥 thêm dòng này
                .ToListAsync();

            var result = data
                .GroupBy(vd =>
                    (vd.DebitAccount1 == "156" || vd.DebitAccount2 == "156")
                        ? vd.VoucherId
                        : vd.OffsetVoucher)
                .Select(g =>
                {
                    var importRow = g.FirstOrDefault(vd =>
                        vd.DebitAccount1 == "156" || vd.DebitAccount2 == "156");

                    var import = g.Sum(vd =>
                        (vd.DebitAccount1 == "156" || vd.DebitAccount2 == "156")
                            ? (decimal?)vd.Quantity ?? 0
                            : 0);

                    var export = g.Sum(vd =>
                        (vd.CreditAccount1 == "156" || vd.CreditAccount2 == "156")
                            ? (decimal?)vd.Quantity ?? 0
                            : 0);

                    return new WarehouseTransactionDto
                    {
                        OffsetVoucher = g.Key,
                        GoodsId = goodsId,

                        WarehouseId = importRow?.DebitWarehouseId,
                        WarehouseName = importRow?.DebitWarehouse?.WarehouseName,

                        VoucherDate = importRow?.Voucher?.VoucherDate,
                        WarehouseIn = import,
                        WarehouseOut = export,
                        CustomInHand = import - export,

                        Cost = g
                            .Where(vd => vd.DebitAccount1 == "156"
                                      || vd.DebitAccount2 == "156")
                            .Sum(vd => (decimal?)vd.Amount1 ?? 0)
                    };
                })
                .Where(x => x.CustomInHand > 0)
                .OrderBy(x => x.VoucherDate)
                .ToList();

            return result;
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