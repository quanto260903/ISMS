using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    // ── Request tạo mới / cập nhật ──
    public class CreateAuditRequest
    {   // ── Request tạo mới / cập nhật ──
            public string VoucherId { get; set; } = null!;   // KK...
            public string? WarehouseId { get; set; }            // Kho kiểm kê
            public string? AuditType { get; set; }            // "FULL" | "PARTIAL"
            public string? Description { get; set; }
            public DateTime? AuditDate { get; set; }
            // CreatedBy không nhận từ client — lấy từ JWT trong controller

            public List<CreateAuditItemRequest> Items { get; set; } = new();
        }

        public class CreateAuditItemRequest
        {
            public string? GoodsId { get; set; }
            public string? GoodsName { get; set; }
            public string? Unit { get; set; }
            public decimal? StockQuantity { get; set; }   // SL tồn kho  → Quantity
            public decimal? ActualQuantity { get; set; }   // SL thực tế  → UnitPrice
            public decimal? Difference { get; set; }   // Chênh lệch  → Amount1 (bỏ qua — tính lại ở service)
            public string? Reason { get; set; }   // Bỏ qua — tính lại ở service
            public string? Action { get; set; }   // Bỏ qua — tính lại ở service
                                                  // UserId không nhận từ client — service tự điền từ userId JWT
        }

        // ── Response chi tiết 1 phiếu ──
        public class AuditVoucherDto
        {
            public string VoucherId { get; set; } = null!;
            public string? WarehouseId { get; set; }
            public string? AuditType { get; set; }
            public string? Description { get; set; }
            public DateTime? AuditDate { get; set; }
            public string? CreatedBy { get; set; }
            public List<AuditItemDto> Items { get; set; } = new();
        }

        public class AuditItemDto
        {
            public string? GoodsId { get; set; }
            public string? GoodsName { get; set; }
            public string? Unit { get; set; }
            public decimal? StockQuantity { get; set; }
            public decimal? ActualQuantity { get; set; }
            public decimal? Difference { get; set; }
            public string? Reason { get; set; }
            public string? Action { get; set; }
        }

        // ── Response danh sách ──
        public class AuditListDto
        {
            public string VoucherId { get; set; } = null!;
            public string? AuditType { get; set; }
            public string? Description { get; set; }
            public DateTime? AuditDate { get; set; }
            public string? CreatedBy { get; set; }
            public string? WarehouseId { get; set; }
            public int ItemCount { get; set; }
            public int MatchCount { get; set; }   // Khớp
            public int SurplusCount { get; set; }   // Thừa
            public int DeficitCount { get; set; }   // Thiếu
        }

        public class GetAuditListRequest
        {
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public string? Keyword { get; set; }
            public string? WarehouseId { get; set; }
            public int Page { get; set; } = 1;
            public int PageSize { get; set; } = 50;
        }
    }
