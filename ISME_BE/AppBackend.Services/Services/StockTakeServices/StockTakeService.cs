using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.StockTakeRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.ExportServices;
using AppBackend.Services.Services.ImportServices;

namespace AppBackend.Services.Services.StockTakeServices
{
    public class StockTakeService : IStockTakeService
    {
        private readonly IUnitOfWork _uow;
        private readonly IImportServices _inwardService;
        private readonly IExportServices _exportService;

        public StockTakeService(
            IUnitOfWork uow,
            IImportServices inwardService,
            IExportServices exportService)
        {
            _uow = uow;
            _inwardService = inwardService;
            _exportService = exportService;
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
            var voucherCode = await _uow.StockTakeVouchers.GenerateVoucherCodeAsync();

            var voucher = new StockTakeVoucher
            {
                VoucherCode = voucherCode,
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
                // Lấy tồn kho thực tế từ DB — không tin tưởng client
                var goods = await _uow.Goods.GetByIdAsync(d.GoodsId);
                var bookQty = (decimal)(goods?.ItemOnHand ?? 0);

                details.Add(new StockTakeDetail
                {
                    StockTakeVoucherId = voucher.StockTakeVoucherId,
                    GoodsId = d.GoodsId,
                    GoodsName = d.GoodsName,
                    Unit = d.Unit,
                    BookQuantity = bookQty,                    // ← từ DB
                    ActualQuantity = d.ActualQuantity,
                    DifferenceQuantity = d.ActualQuantity - bookQty, // ← tính đúng
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
                var goods = await _uow.Goods.GetByIdAsync(d.GoodsId);
                var bookQty = (decimal)(goods?.ItemOnHand ?? 0);

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
        public async Task<ProcessStockTakeResultDto> ProcessAsync(string id, string userId)
        {
            // ── 1. Load phiếu kiểm kê ────────────────────────────
            var voucher = await _uow.StockTakeVouchers.GetByIdAsync(id);
            if (voucher == null)
                return Fail("Không tìm thấy phiếu kiểm kê.");
            if (voucher.IsCompleted == true)
                return Fail("Phiếu kiểm kê đã được xử lý trước đó.");

            var details = voucher.StockTakeDetails.ToList();
            if (!details.Any())
                return Fail("Phiếu kiểm kê chưa có hàng hóa.");

            var now = DateTime.Now;
            var dateOnly = DateOnly.FromDateTime(now);

            // Mã phiếu nhập/xuất dựa vào VoucherCode — unique, không trùng
            var importVoucherId = $"NK{voucher.VoucherCode}";
            var exportVoucherId = $"XK{voucher.VoucherCode}";

            // Làm tròn chênh lệch về int, bỏ qua dòng có chênh lệch = 0 sau làm tròn
            var surplusItems = details
                .Where(d => d.DifferenceQuantity > 0)
                .Select(d => (detail: d, qty: (int)Math.Round(d.DifferenceQuantity)))
                .Where(x => x.qty > 0).ToList();
            var shortageItems = details
                .Where(d => d.DifferenceQuantity < 0)
                .Select(d => (detail: d, qty: (int)Math.Round(Math.Abs(d.DifferenceQuantity))))
                .Where(x => x.qty > 0).ToList();

            // Lưu ý: KHÔNG bọc outer transaction ở đây.
            // _inwardService và _exportService mỗi hàm đã tự quản lý transaction nội bộ,
            // và tất cả chia sẻ cùng một DbContext (scoped DI) → không thể nest transactions.
            // Nếu NK3 thành công nhưng XK3 thất bại, ta dùng compensating transaction (xóa NK3).
            try
            {
                // ── 3. Hàng THỪA → Nhập kho NK3 ─────────────────
                string? createdImportId = null;
                if (surplusItems.Any())
                {
                    var inwardRequest = new ImportOrder
                    {
                        VoucherId = importVoucherId,
                        VoucherCode = "NK3",
                        VoucherDescription = $"Nhập kho từ kiểm kê {voucher.VoucherCode} — hàng thừa",
                        VoucherDate = dateOnly,
                        Items = surplusItems.Select(x => new CreateInwardItemRequest
                        {
                            GoodsId = x.detail.GoodsId,
                            GoodsName = x.detail.GoodsName,
                            Unit = x.detail.Unit,
                            Quantity = x.qty,
                            UnitPrice = 0,
                            Amount1 = 0,
                            DebitAccount1 = "156",
                            CreditAccount1 = "3381",
                            UserId = userId,
                            CreatedDateTime = now,
                        }).ToList(),
                    };

                    var inwardResult = await _inwardService.CreateInwardAsync(inwardRequest, userId);
                    if (!inwardResult.IsSuccess)
                        return Fail($"Lỗi tạo phiếu nhập: {inwardResult.Message}");

                    createdImportId = importVoucherId;
                }

                // ── 4. Hàng THIẾU → Xuất kho XK3 ────────────────
                // OffsetVoucher = null vì XK3 bỏ qua FIFO (phiếu điều chỉnh, không phải xuất bán)
                string? createdExportId = null;
                if (shortageItems.Any())
                {
                    var exportRequest = new ExportOrder
                    {
                        VoucherId = exportVoucherId,
                        VoucherCode = "XK3",
                        VoucherDescription = $"Xuất kho từ kiểm kê {voucher.VoucherCode} — hàng thiếu",
                        VoucherDate = dateOnly,
                        Items = shortageItems.Select(x => new CreateExportItemRequest
                        {
                            GoodsId = x.detail.GoodsId,
                            GoodsName = x.detail.GoodsName,
                            Unit = x.detail.Unit,
                            Quantity = x.qty,
                            UnitPrice = 0,
                            Amount1 = 0,
                            DebitAccount1 = "1381",
                            CreditAccount1 = "156",
                            OffsetVoucher = null,   // XK3 không đối trừ phiếu nhập cụ thể
                            UserId = userId,
                            CreatedDateTime = now,
                        }).ToList(),
                    };

                    var exportResult = await _exportService.CreateExportAsync(exportRequest, userId);
                    if (!exportResult.IsSuccess)
                    {
                        // Bù trừ: hủy NK3 đã tạo trước đó (nếu có)
                        if (createdImportId != null)
                            await _inwardService.DeleteAsync(createdImportId);
                        return Fail($"Lỗi tạo phiếu xuất: {exportResult.Message}");
                    }

                    createdExportId = exportVoucherId;
                }

                // ── 5. Đánh dấu phiếu hoàn thành ─────────────────
                voucher.IsCompleted = true;
                await _uow.StockTakeVouchers.UpdateAsync(voucher);
                await _uow.SaveChangesAsync();

                // ── 6. Trả kết quả ────────────────────────────────
                var messages = new List<string>();
                if (createdImportId != null)
                    messages.Add($"Đã tạo phiếu nhập kho {createdImportId} ({surplusItems.Count} mặt hàng thừa)");
                if (createdExportId != null)
                    messages.Add($"Đã tạo phiếu xuất kho {createdExportId} ({shortageItems.Count} mặt hàng thiếu)");
                if (!messages.Any())
                    messages.Add("Không có chênh lệch — phiếu kiểm kê đã hoàn thành");

                return new ProcessStockTakeResultDto
                {
                    Success = true,
                    Message = string.Join(". ", messages),
                    ImportVoucherId = createdImportId,
                    ExportVoucherId = createdExportId,
                };
            }
            catch (Exception ex)
            {
                return Fail($"Lỗi xử lý kiểm kê: {ex.Message}");
            }
        }

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