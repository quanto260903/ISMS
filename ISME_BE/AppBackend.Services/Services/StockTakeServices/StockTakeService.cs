using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.UnitOfWork;

namespace AppBackend.Services.Services.StockTakeServices
{
    public class StockTakeService : IStockTakeService
    {
        private readonly IUnitOfWork _uow;

        public StockTakeService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        // ===================== GET ALL =====================
        public async Task<IEnumerable<StockTakeVoucherListDto>> GetAllAsync()
        {
            var vouchers = await _uow.StockTakeVouchers.GetAllAsync();
            return vouchers.Select(v => new StockTakeVoucherListDto
            {
                StockTakeVoucherId = v.StockTakeVoucherId,
                VoucherCode = v.VoucherCode,
                VoucherDate = v.VoucherDate,
                StockTakeDate = v.StockTakeDate,
                Purpose = v.Purpose,
                IsCompleted = v.IsCompleted,
                Nk3Created = v.Nk3Created,
                Xk3Created = v.Xk3Created,
                CreatedBy = v.CreatedBy,
                CreatedDate = v.CreatedDate,
            });
        }

        // ===================== GET BY ID =====================
        public async Task<StockTakeVoucherDetailDto?> GetByIdAsync(string id)
        {
            var voucher = await _uow.StockTakeVouchers.GetByIdAsync(id);
            if (voucher == null) return null;
            return MapToDetailDto(voucher);
        }

        // ===================== CREATE =====================
        public async Task<StockTakeVoucherDetailDto> CreateAsync(CreateStockTakeVoucherDto dto, string createdBy)
        {
            var voucherId = await _uow.StockTakeVouchers.GenerateVoucherIdAsync();

            var voucher = new StockTakeVoucher
            {
                StockTakeVoucherId = voucherId,
                VoucherCode = "KK1",
                VoucherDate = dto.VoucherDate,
                StockTakeDate = dto.StockTakeDate,
                Purpose = dto.Purpose,
                Member1 = dto.Member1,
                Position1 = dto.Position1,
                Member2 = dto.Member2,
                Position2 = dto.Position2,
                Member3 = dto.Member3,
                Position3 = dto.Position3,
                IsCompleted = false,
                Nk3Created = false,
                Xk3Created = false,
                CreatedBy = createdBy,
                CreatedDate = DateTime.UtcNow,
            };

            await _uow.StockTakeVouchers.AddAsync(voucher);

            var details = new List<StockTakeDetail>();
            foreach (var d in dto.StockTakeDetails)
            {
                var bookQty = await _uow.Goods.GetStockAsOfDateAsync(d.GoodsId, dto.StockTakeDate);
                details.Add(new StockTakeDetail
                {
                    StockTakeVoucherId = voucher.StockTakeVoucherId,
                    GoodsId = d.GoodsId,
                    GoodsName = d.GoodsName,
                    Unit = d.Unit,
                    BookQuantity = bookQty,
                    ActualQuantity = d.ActualQuantity,
                    DifferenceQuantity = d.ActualQuantity - bookQty,
                });
            }

            await _uow.StockTakeDetails.AddRangeAsync(details);
            await _uow.SaveChangesAsync();

            voucher.StockTakeDetails = details;
            return MapToDetailDto(voucher);
        }

        // ===================== UPDATE =====================
        public async Task<StockTakeVoucherDetailDto?> UpdateAsync(string id, UpdateStockTakeVoucherDto dto)
        {
            var voucher = await _uow.StockTakeVouchers.GetByIdAsync(id);
            if (voucher == null) return null;

            voucher.VoucherDate = dto.VoucherDate;
            voucher.StockTakeDate = dto.StockTakeDate;
            voucher.Purpose = dto.Purpose;
            voucher.Member1 = dto.Member1;
            voucher.Position1 = dto.Position1;
            voucher.Member2 = dto.Member2;
            voucher.Position2 = dto.Position2;
            voucher.Member3 = dto.Member3;
            voucher.Position3 = dto.Position3;
            // Không reset Nk3Created / Xk3Created / IsCompleted khi update header

            await _uow.StockTakeVouchers.UpdateAsync(voucher);

            await _uow.StockTakeDetails.DeleteByVoucherIdAsync(id);

            var details = new List<StockTakeDetail>();
            foreach (var d in dto.StockTakeDetails)
            {
                var bookQty = await _uow.Goods.GetStockAsOfDateAsync(d.GoodsId, dto.StockTakeDate);
                details.Add(new StockTakeDetail
                {
                    StockTakeVoucherId = id,
                    GoodsId = d.GoodsId,
                    GoodsName = d.GoodsName,
                    Unit = d.Unit,
                    BookQuantity = bookQty,
                    ActualQuantity = d.ActualQuantity,
                    DifferenceQuantity = d.ActualQuantity - bookQty,
                });
            }

            await _uow.StockTakeDetails.AddRangeAsync(details);
            await _uow.SaveChangesAsync();

            voucher.StockTakeDetails = details;
            return MapToDetailDto(voucher);
        }

        // ===================== DELETE =====================
        public async Task<bool> DeleteAsync(string id)
        {
            var voucher = await _uow.StockTakeVouchers.GetByIdAsync(id);
            if (voucher == null) return false;

            await _uow.StockTakeDetails.DeleteByVoucherIdAsync(id);
            await _uow.StockTakeVouchers.DeleteAsync(id);
            await _uow.SaveChangesAsync();
            return true;
        }

        // ===================== PROCESS =====================
        // Chỉ được gọi nội bộ (từ MarkNk3/Xk3) khi cả 2 phiếu đã được lập.
        // Vẫn giữ endpoint POST /process để đánh dấu thủ công nếu cần.
        public async Task<ProcessStockTakeResultDto> ProcessAsync(string id, string userId)
        {
            var voucher = await _uow.StockTakeVouchers.GetByIdAsync(id);
            if (voucher == null)
                return Fail("Không tìm thấy phiếu kiểm kê.");
            if (voucher.IsCompleted == true)
                return Fail("Phiếu kiểm kê đã được xử lý trước đó.");
            if (!voucher.StockTakeDetails.Any())
                return Fail("Phiếu kiểm kê chưa có hàng hóa.");

            voucher.IsCompleted = true;
            await _uow.StockTakeVouchers.UpdateAsync(voucher);
            await _uow.SaveChangesAsync();

            return new ProcessStockTakeResultDto
            {
                Success = true,
                Message = "Phiếu kiểm kê đã hoàn thành.",
            };
        }

        // ===================== MARK NK3 CREATED =====================
        /// <summary>
        /// Đánh dấu đã lập phiếu nhập NK3.
        /// Nếu phiếu cũng cần XK3 và XK3 đã được lập rồi → tự động set IsCompleted = true.
        /// Nếu phiếu không có hàng thiếu (không cần XK3) → cũng set IsCompleted = true luôn.
        /// </summary>
        public async Task<StockTakeVoucherDetailDto?> MarkNk3CreatedAsync(string id)
        {
            var voucher = await _uow.StockTakeVouchers.GetByIdAsync(id);
            if (voucher == null) return null;
            if (voucher.Nk3Created)
                return MapToDetailDto(voucher); // idempotent — đã đánh dấu rồi thì bỏ qua

            voucher.Nk3Created = true;

            // Kiểm tra xem phiếu có cần XK3 không
            bool needsXk3 = voucher.StockTakeDetails.Any(d => d.DifferenceQuantity < 0);

            // Tự động hoàn thành nếu không cần XK3, hoặc XK3 đã được lập
            if (!needsXk3 || voucher.Xk3Created)
                voucher.IsCompleted = true;

            await _uow.StockTakeVouchers.UpdateAsync(voucher);
            await _uow.SaveChangesAsync();
            return MapToDetailDto(voucher);
        }

        // ===================== MARK XK3 CREATED =====================
        /// <summary>
        /// Đánh dấu đã lập phiếu xuất XK3.
        /// Nếu phiếu cũng cần NK3 và NK3 đã được lập rồi → tự động set IsCompleted = true.
        /// Nếu phiếu không có hàng thừa (không cần NK3) → cũng set IsCompleted = true luôn.
        /// </summary>
        public async Task<StockTakeVoucherDetailDto?> MarkXk3CreatedAsync(string id)
        {
            var voucher = await _uow.StockTakeVouchers.GetByIdAsync(id);
            if (voucher == null) return null;
            if (voucher.Xk3Created)
                return MapToDetailDto(voucher); // idempotent

            voucher.Xk3Created = true;

            bool needsNk3 = voucher.StockTakeDetails.Any(d => d.DifferenceQuantity > 0);

            if (!needsNk3 || voucher.Nk3Created)
                voucher.IsCompleted = true;

            await _uow.StockTakeVouchers.UpdateAsync(voucher);
            await _uow.SaveChangesAsync();
            return MapToDetailDto(voucher);
        }

        // ===================== SURPLUS / SHORTAGE ITEMS =====================
        public async Task<IEnumerable<SurplusItemDto>> GetSurplusItemsAsync(string id)
        {
            var voucher = await _uow.StockTakeVouchers.GetByIdAsync(id);
            if (voucher == null) return Enumerable.Empty<SurplusItemDto>();

            return voucher.StockTakeDetails
                .Where(d => d.DifferenceQuantity > 0)
                .Select(d => new SurplusItemDto
                {
                    GoodsId = d.GoodsId,
                    GoodsName = d.GoodsName,
                    Unit = d.Unit,
                    Quantity = (int)Math.Round(d.DifferenceQuantity),
                })
                .Where(x => x.Quantity > 0);
        }

        public async Task<IEnumerable<ShortageItemDto>> GetShortageItemsAsync(string id)
        {
            var voucher = await _uow.StockTakeVouchers.GetByIdAsync(id);
            if (voucher == null) return Enumerable.Empty<ShortageItemDto>();

            return voucher.StockTakeDetails
                .Where(d => d.DifferenceQuantity < 0)
                .Select(d => new ShortageItemDto
                {
                    GoodsId = d.GoodsId,
                    GoodsName = d.GoodsName,
                    Unit = d.Unit,
                    Quantity = (int)Math.Round(Math.Abs(d.DifferenceQuantity)),
                })
                .Where(x => x.Quantity > 0);
        }

        // ===================== PREVIEW VOUCHER ID =====================
        public Task<string> PreviewNextVoucherCodeAsync()
            => _uow.StockTakeVouchers.GenerateVoucherIdAsync();

        // ===================== GOODS STOCK AS OF DATE =====================
        public async Task<IEnumerable<GoodsStockDto>> GetGoodsStockAsOfDateAsync(DateOnly asOfDate)
            => await _uow.Goods.GetAllGoodsStockAsOfDateAsync(asOfDate);

        // ── Helpers ───────────────────────────────────────────────
        private static ProcessStockTakeResultDto Fail(string msg) =>
            new() { Success = false, Message = msg };

        private static StockTakeVoucherDetailDto MapToDetailDto(StockTakeVoucher v) => new()
        {
            StockTakeVoucherId = v.StockTakeVoucherId,
            VoucherCode = v.VoucherCode,
            VoucherDate = v.VoucherDate,
            StockTakeDate = v.StockTakeDate,
            Purpose = v.Purpose,
            Member1 = v.Member1,
            Position1 = v.Position1,
            Member2 = v.Member2,
            Position2 = v.Position2,
            Member3 = v.Member3,
            Position3 = v.Position3,
            IsCompleted = v.IsCompleted,
            Nk3Created = v.Nk3Created,
            Xk3Created = v.Xk3Created,
            CreatedBy = v.CreatedBy,
            CreatedDate = v.CreatedDate,
            StockTakeDetails = v.StockTakeDetails.Select(d => new StockTakeDetailDto
            {
                StockTakeDetailId = d.StockTakeDetailId,
                GoodsId = d.GoodsId,
                GoodsName = d.GoodsName,
                Unit = d.Unit,
                BookQuantity = d.BookQuantity,
                ActualQuantity = d.ActualQuantity,
                DifferenceQuantity = d.DifferenceQuantity,
            }).ToList(),
        };
    }
}