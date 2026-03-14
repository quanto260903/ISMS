using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class StockTakeDetail
{
    public int StockTakeDetailId { get; set; }

    public string StockTakeVoucherId { get; set; } = null!;

    public string GoodsId { get; set; } = null!;

    public string GoodsName { get; set; } = null!;

    public string? Unit { get; set; }

    public decimal BookQuantity { get; set; }

    public decimal ActualQuantity { get; set; }

    public decimal DifferenceQuantity { get; set; }

    public virtual StockTakeVoucher StockTakeVoucher { get; set; } = null!;
}
