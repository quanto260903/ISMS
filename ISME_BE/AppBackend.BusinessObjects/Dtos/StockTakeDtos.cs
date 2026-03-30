namespace AppBackend.BusinessObjects.Dtos
{
    // ── Danh sách phiếu kiểm kê ──────────────────────────────
    public class StockTakeVoucherListDto
    {
        public string StockTakeVoucherId { get; set; } = null!;
        public string VoucherCode { get; set; } = null!;
        // Lỗi 7: đổi DateTime → DateOnly cho nhất quán với toàn hệ thống
        // DateTime serialize thành "2026-03-21T00:00:00" → frontend parse sai ngày
        // DateOnly serialize thành "2026-03-21" → đúng
        public DateOnly VoucherDate { get; set; }
        public DateOnly StockTakeDate { get; set; }
        public string? Purpose { get; set; }
        public bool? IsCompleted { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? CreatedDate { get; set; }  // giữ DateTime vì có giờ phút giây
    }

    // ── Chi tiết 1 phiếu kiểm kê ─────────────────────────────
    public class StockTakeVoucherDetailDto
    {
        public string StockTakeVoucherId { get; set; } = null!;
        public string VoucherCode { get; set; } = null!;
        public DateOnly VoucherDate { get; set; }
        public DateOnly StockTakeDate { get; set; }
        public string? Purpose { get; set; }
        public string? Member1 { get; set; }
        public string? Position1 { get; set; }
        public string? Member2 { get; set; }
        public string? Position2 { get; set; }
        public string? Member3 { get; set; }
        public string? Position3 { get; set; }
        public bool? IsCompleted { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? CreatedDate { get; set; }
        public List<StockTakeDetailDto> StockTakeDetails { get; set; } = new();
    }

    // ── Tạo mới phiếu kiểm kê ────────────────────────────────
    public class CreateStockTakeVoucherDto
    {
        public DateOnly VoucherDate { get; set; }
        public DateOnly StockTakeDate { get; set; }
        public string? Purpose { get; set; }
        public string? Member1 { get; set; }
        public string? Position1 { get; set; }
        public string? Member2 { get; set; }
        public string? Position2 { get; set; }
        public string? Member3 { get; set; }
        public string? Position3 { get; set; }
        public string? CreatedBy { get; set; }
        // BookQuantity không cần trong DTO tạo mới
        // vì service sẽ tự lấy từ DB (Goods.ItemOnHand)
        public List<CreateStockTakeDetailDto> StockTakeDetails { get; set; } = new();
    }

    // ── Cập nhật phiếu kiểm kê ───────────────────────────────
    public class UpdateStockTakeVoucherDto
    {
        public DateOnly VoucherDate { get; set; }
        public DateOnly StockTakeDate { get; set; }
        public string? Purpose { get; set; }
        public string? Member1 { get; set; }
        public string? Position1 { get; set; }
        public string? Member2 { get; set; }
        public string? Position2 { get; set; }
        public string? Member3 { get; set; }
        public string? Position3 { get; set; }
        public List<CreateStockTakeDetailDto> StockTakeDetails { get; set; } = new();
    }

    // ── Chi tiết dòng hàng hóa (read) ────────────────────────
    public class StockTakeDetailDto
    {
        public int StockTakeDetailId { get; set; }
        public string GoodsId { get; set; } = null!;
        public string GoodsName { get; set; } = null!;
        public string? Unit { get; set; }
        public decimal BookQuantity { get; set; }
        public decimal ActualQuantity { get; set; }
        public decimal DifferenceQuantity { get; set; }
    }

    // ── Tạo mới dòng hàng hóa (write) ───────────────────────
    // BookQuantity không nhận từ client — service tự lấy từ DB
    public class CreateStockTakeDetailDto
    {
        public string GoodsId { get; set; } = null!;
        public string GoodsName { get; set; } = null!;
        public string? Unit { get; set; }
        public decimal ActualQuantity { get; set; }
        // BookQuantity đã xóa — tránh client gửi sai làm DifferenceQuantity tính lệch
    }

    // ── Hàng hóa kèm tồn kho theo ngày ──────────────────────
    public class GoodsStockDto
    {
        public string GoodsId { get; set; } = null!;
        public string GoodsName { get; set; } = null!;
        public string? Unit { get; set; }
        public decimal StockQuantity { get; set; }
    }

    // ── Kết quả xử lý phiếu kiểm kê ─────────────────────────
    public class ProcessStockTakeResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = null!;
        public string? ImportVoucherId { get; set; }  // phiếu nhập NK3 nếu có hàng thừa
        public string? ExportVoucherId { get; set; }  // phiếu xuất XK3 nếu có hàng thiếu
    }
}