using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Dtos
{
    // Một dòng hàng hóa trong báo cáo tổng hợp tồn kho
    public class InventorySummaryItemDto
    {
        public string GoodsId { get; set; } = null!;
        public string GoodsName { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public decimal Opening { get; set; }    // tồn đầu kỳ
        public decimal Inbound { get; set; }    // nhập trong kỳ
        public decimal Outbound { get; set; }   // xuất trong kỳ
        public decimal Closing { get; set; }    // tồn cuối kỳ = Opening + Inbound – Outbound
    }

    // Một nhóm hàng hóa (có danh sách items con)
    public class InventorySummaryGroupDto
    {
        public string? GroupId { get; set; }
        public string GroupName { get; set; } = null!;
        public decimal SubOpening { get; set; }
        public decimal SubInbound { get; set; }
        public decimal SubOutbound { get; set; }
        public decimal SubClosing { get; set; }
        public List<InventorySummaryItemDto> Items { get; set; } = new();
    }

    // Tổng cộng toàn báo cáo
    public class InventorySummaryTotalsDto
    {
        public int TotalItems { get; set; }
        public decimal TotalOpening { get; set; }
        public decimal TotalInbound { get; set; }
        public decimal TotalOutbound { get; set; }
        public decimal TotalClosing { get; set; }
    }

    // Toàn bộ báo cáo
    public class InventorySummaryDto
    {
        public DateOnly FromDate { get; set; }
        public DateOnly ToDate { get; set; }
        public DateTime GeneratedAt { get; set; }
        public InventorySummaryTotalsDto Totals { get; set; } = null!;
        public List<InventorySummaryGroupDto> Groups { get; set; } = new();
    }

    // Query params
    public class GetInventorySummaryRequest
    {
        public DateOnly FromDate { get; set; }
        public DateOnly ToDate { get; set; }
        public string? Keyword { get; set; }
    }
}
