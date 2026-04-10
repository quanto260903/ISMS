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
        // Lỗi 6 đã sửa: BookQuantity lấy từ DB (Goods.ItemOnHand)
        // thay vì tin tưởng giá trị client gửi lên
        // → tránh trường hợp client gửi sai BookQuantity làm DifferenceQuantity tính sai
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
                CreatedBy = createdBy,
                CreatedDate = DateTime.UtcNow,
            };

            await _uow.StockTakeVouchers.AddAsync(voucher);

            // Lấy BookQuantity từ DB cho từng mặt hàng
            var details = new List<StockTakeDetail>();
            foreach (var d in dto.StockTakeDetails)
            {
                // Tính tồn kho theo ngày kiểm kê (StockTakeDate) thay vì ItemOnHand hiện tại
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
        // Lỗi 6 đã sửa tương tự CreateAsync — BookQuantity lấy từ DB
        public async Task<StockTakeVoucherDetailDto?> UpdateAsync(string id, UpdateStockTakeVoucherDto dto)
        {
            var voucher = await _uow.StockTakeVouchers.GetByIdAsync(id);
            if (voucher == null) return null;

            if (voucher.IsCompleted == true)
                throw new InvalidOperationException("Phiếu kiểm kê đã được xử lý, không thể chỉnh sửa.");

            voucher.VoucherDate = dto.VoucherDate;
            voucher.StockTakeDate = dto.StockTakeDate;
            voucher.Purpose = dto.Purpose;
            voucher.Member1 = dto.Member1;
            voucher.Position1 = dto.Position1;
            voucher.Member2 = dto.Member2;
            voucher.Position2 = dto.Position2;
            voucher.Member3 = dto.Member3;
            voucher.Position3 = dto.Position3;

            await _uow.StockTakeVouchers.UpdateAsync(voucher);

            // Xóa chi tiết cũ, thêm lại mới với BookQuantity từ DB
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

            if (voucher.IsCompleted == true)
                throw new InvalidOperationException("Phiếu kiểm kê đã xử lý, không thể xóa.");

            await _uow.StockTakeDetails.DeleteByVoucherIdAsync(id);
            await _uow.StockTakeVouchers.DeleteAsync(id);
            await _uow.SaveChangesAsync();
            return true;
        }

        // ===================== PROCESS =====================
        // Khoá phiếu kiểm kê (IsCompleted = true).
        // Không tự sinh phiếu nhập/xuất — người dùng tự lập phiếu NK3/XK3 ở bước tiếp theo
        // để đảm bảo xuất kho đích danh (phải chọn chứng từ nhập nguồn cho từng dòng XK3).
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
                Message = "Phiếu kiểm kê đã hoàn thành. Vui lòng lập phiếu nhập/xuất kho điều chỉnh.",
            };
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
                    GoodsId   = d.GoodsId,
                    GoodsName = d.GoodsName,
                    Unit      = d.Unit,
                    Quantity  = (int)Math.Round(d.DifferenceQuantity),
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
                    GoodsId   = d.GoodsId,
                    GoodsName = d.GoodsName,
                    Unit      = d.Unit,
                    Quantity  = (int)Math.Round(Math.Abs(d.DifferenceQuantity)),
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