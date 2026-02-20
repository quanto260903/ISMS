using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class OpenInventory
{
    public DateTime CreateDate { get; set; }

    public string? VoucherNumber { get; set; }

    public string? WarehouseId { get; set; }

    public string Unit { get; set; } = null!;

    public int? Quantity { get; set; }

    public decimal? DebitAmount0 { get; set; }

    public string? Properties { get; set; }

    public string? GoodsId { get; set; }
}
