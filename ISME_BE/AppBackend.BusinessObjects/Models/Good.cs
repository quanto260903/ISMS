using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class Good
{
    public string GoodsId { get; set; } = null!;

    public string GoodsName { get; set; } = null!;

    public string? GoodsGroupId { get; set; }

    public string Unit { get; set; } = null!;

    public int? MinimumStock { get; set; }

    public decimal? FixedPurchasePrice { get; set; }

    public decimal? LastPurchasePrice { get; set; }

    public decimal? SalePrice { get; set; }

    public string Vatrate { get; set; } = null!;

    public bool IsIncludeVat { get; set; }

    public bool IsPromotion { get; set; }

    public bool IsInactive { get; set; }

    public DateTime CreatedDate { get; set; }

    public virtual GoodsCategory? GoodsGroup { get; set; }
}
