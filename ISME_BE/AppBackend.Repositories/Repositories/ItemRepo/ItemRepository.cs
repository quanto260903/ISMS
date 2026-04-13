using AppBackend.BusinessObjects.Constants;
using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;

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
        /// - Phiếu NK2 / bucket QUARANTINE không được xem là tồn bán được
        /// </summary>
        public async Task<List<WarehouseTransactionDto>> GetWarehouseTransactionsAsync(
            string goodsId,
            DateOnly? asOfDate = null)
        {
            var data = await _context.VoucherDetails
                .Where(vd =>
                    vd.GoodsId == goodsId &&
                    (
                        vd.DebitAccount1 == "156" ||
                        vd.DebitAccount2 == "156" ||
                        vd.CreditAccount1 == "156" ||
                        vd.CreditAccount2 == "156"
                    ))
                .Include(vd => vd.Voucher)
                .ToListAsync();

            var inboundRows = data
                .Where(vd =>
                    (vd.DebitAccount1 == "156" || vd.DebitAccount2 == "156") &&
                    vd.StockBucket != StockBucketConstants.Quarantine &&
                    vd.Voucher?.VoucherCode != "NK2")
                .ToList();

            var outboundRows = data
                .Where(vd => vd.CreditAccount1 == "156" || vd.CreditAccount2 == "156")
                .ToList();

            var eligibleInbounds = asOfDate.HasValue
                ? inboundRows.Where(vd =>
                    vd.Voucher?.VoucherDate != null &&
                    vd.Voucher.VoucherDate.Value <= asOfDate.Value)
                  .ToList()
                : inboundRows;

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

            var outboundByInbound = outboundRows
                .Where(vd => vd.OffsetVoucher != null)
                .GroupBy(vd => vd.OffsetVoucher!)
                .ToDictionary(
                    g => g.Key,
                    g => g.Sum(vd => (decimal?)vd.Quantity ?? 0)
                );

            return inboundGroups
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
                .Where(x => x.CustomInHand > 0)
                .OrderBy(x => x.VoucherDate)
                .ToList();
        }

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
                    QuarantineOnHand = g.QuarantineOnHand,
                })
                .ToListAsync(cancellationToken);
        }
    }
}
