// ============================================================
//  ExportRepository.cs
// ============================================================
using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;

namespace AppBackend.Repositories.Repositories.ExportRepo
{
    public class ExportRepository : IExportRepository
    {
        private readonly IndividualBusinessContext _context;

        public ExportRepository(IndividualBusinessContext context)
        {
            _context = context;
        }

        // ── CRUD cơ bản ──────────────────────────────────────────────────
        public async Task AddAsync(Voucher voucher)
        {
            if (voucher == null) throw new ArgumentNullException(nameof(voucher));
            await _context.Vouchers.AddAsync(voucher);
        }

        public async Task UpdateAsync(Voucher voucher)
        {
            _context.Vouchers.Update(voucher);
        }

        public async Task<Voucher?> GetByIdAsync(string voucherId)
        {
            return await _context.Vouchers
                .Include(v => v.VoucherDetails)
                .FirstOrDefaultAsync(v =>
                    v.VoucherId == voucherId &&
                    v.VoucherCode != null &&
                    v.VoucherCode.StartsWith("XH"));
        }

        public async Task<(IEnumerable<Voucher> Items, int Total)> GetListAsync(
            GetExportListRequest request)
        {
            var query = _context.Vouchers
                .Include(v => v.VoucherDetails)
                .Where(v => v.VoucherCode != null && v.VoucherCode.StartsWith("XH"))
                .AsQueryable();

            if (request.FromDate.HasValue)
                query = query.Where(v => v.VoucherDate >= request.FromDate);
            if (request.ToDate.HasValue)
                query = query.Where(v => v.VoucherDate <= request.ToDate);

            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                var kw = request.Keyword.Trim().ToLower();
                query = query.Where(v =>
                    v.VoucherId.ToLower().Contains(kw) ||
                    (v.CustomerName != null && v.CustomerName.ToLower().Contains(kw)));
            }

            if (!string.IsNullOrWhiteSpace(request.VoucherCode))
                query = query.Where(v => v.VoucherCode == request.VoucherCode);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(v => v.VoucherDate)
                .ThenByDescending(v => v.VoucherId)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return (items, total);
        }

        // ── Tồn kho hiện tại ─────────────────────────────────────────────
        public async Task<int> GetCurrentStockAsync(string goodsId)
        {
            var goods = await _context.Goods
                .AsNoTracking()
                .FirstOrDefaultAsync(g => g.GoodsId == goodsId);
            return goods?.ItemOnHand ?? 0;
        }

        // ── FIFO nâng cấp — trả về danh sách phân bổ ────────────────────
        // Thuật toán:
        //   1. Lấy tất cả dòng nhập (NK*) của goodsId, ORDER BY VoucherDate ASC
        //   2. Tính đã xuất bao nhiêu từ mỗi phiếu nhập (qua OffsetVoucher)
        //   3. Duyệt FIFO: lấy từng phiếu nhập còn hàng cho đến khi đủ requiredQty
        //   4. Trả về danh sách { InboundVoucherCode, AllocatedQty, WarehouseId }
        //
        // Ví dụ: Cần xuất 15 bánh A
        //   NK001: nhập 10, đã xuất 0  → còn 10  → lấy 10
        //   NK002: nhập 20, đã xuất 5  → còn 15  → lấy 5 (đủ 15)
        //   Kết quả: [{NK001, 10}, {NK002, 5}]
        public async Task<List<FifoAllocation>> GetFifoAllocationsAsync(
            string goodsId, int requiredQty)
        {
            // Bước 1: Danh sách phiếu nhập FIFO
            var inboundDetails = await _context.VoucherDetails
                .Include(d => d.Voucher)
                .Where(d =>
                    d.GoodsId == goodsId &&
                    d.Voucher != null &&
                    d.Voucher.VoucherCode != null &&
                    d.Voucher.VoucherCode.StartsWith("NK"))
                .OrderBy(d => d.Voucher!.VoucherDate)
                .ThenBy(d => d.Voucher!.VoucherCode)
                .AsNoTracking()
                .ToListAsync();

            // Bước 2: Tổng đã xuất theo mỗi phiếu nhập
            var exportedByVoucher = await _context.VoucherDetails
                .Include(d => d.Voucher)
                .Where(d =>
                    d.GoodsId == goodsId &&
                    d.Voucher != null &&
                    d.Voucher.VoucherCode != null &&
                    d.Voucher.VoucherCode.StartsWith("XH") &&
                    d.OffsetVoucher != null)
                .GroupBy(d => d.OffsetVoucher!)
                .Select(g => new { InboundCode = g.Key, ExportedQty = g.Sum(x => x.Quantity ?? 0) })
                .AsNoTracking()
                .ToDictionaryAsync(x => x.InboundCode, x => x.ExportedQty);

            // Bước 3: Phân bổ FIFO
            var allocations = new List<FifoAllocation>();
            var remaining   = requiredQty;

            foreach (var detail in inboundDetails)
            {
                if (remaining <= 0) break;

                var inboundCode = detail.Voucher!.VoucherCode!;
                var inboundQty  = detail.Quantity ?? 0;

                exportedByVoucher.TryGetValue(inboundCode, out var alreadyExported);
                var availableQty = inboundQty - alreadyExported;

                if (availableQty <= 0) continue; // phiếu này đã xuất hết

                var take = Math.Min(availableQty, remaining);

                allocations.Add(new FifoAllocation
                {
                    InboundVoucherCode = inboundCode,
                    AllocatedQty       = take,
                    WarehouseId        = detail.DebitWarehouseId, // kho nhập → kho xuất
                });

                remaining -= take;
            }

            // Nếu tồn kho không đủ → trả list rỗng (service sẽ bắt lỗi từ validate)
            return remaining > 0 ? new List<FifoAllocation>() : allocations;
        }

        // ── Cộng / trừ tồn kho ───────────────────────────────────────────
        public async Task DeductStockAsync(string goodsId, int quantity)
        {
            var goods = await _context.Goods.FirstOrDefaultAsync(g => g.GoodsId == goodsId);
            if (goods == null) throw new InvalidOperationException($"Không tìm thấy hàng hóa: {goodsId}");
            goods.ItemOnHand = (goods.ItemOnHand ?? 0) - quantity;
        }

        public async Task AddStockAsync(string goodsId, int quantity)
        {
            var goods = await _context.Goods.FirstOrDefaultAsync(g => g.GoodsId == goodsId);
            if (goods == null) throw new InvalidOperationException($"Không tìm thấy hàng hóa: {goodsId}");
            goods.ItemOnHand = (goods.ItemOnHand ?? 0) + quantity;
        }
    }
}