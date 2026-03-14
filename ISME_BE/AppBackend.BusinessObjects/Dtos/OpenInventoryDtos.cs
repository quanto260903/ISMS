using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    public class OpenInventoryRowDto
    {
        public string GoodsId { get; set; } = null!;
        public string GoodsName { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal DebitAmount0 { get; set; }
        public decimal TotalValue { get; set; }
        public string? Properties { get; set; }
        public DateTime CreateDate { get; set; }
    }

    public class OpenInventorySummaryDto
    {
        public decimal TotalQuantity { get; set; }
        public decimal TotalValue { get; set; }
        public int TotalRows { get; set; }
    }

    public class UpsertOpenInventoryRequest
    {
        public string GoodsId { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal DebitAmount0 { get; set; }
        public string? Properties { get; set; }
    }

    public class GetOpenInventoryListRequest
    {
        public string? Keyword { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
}
