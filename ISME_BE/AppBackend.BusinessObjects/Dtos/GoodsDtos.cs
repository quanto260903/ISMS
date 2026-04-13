using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    public class GoodsListDto
    {
        public string GoodsId { get; set; } = null!;
        public string GoodsName { get; set; } = null!;
        public string? GoodsGroupId { get; set; }
        public string? GoodsGroupName { get; set; }
        public string Unit { get; set; } = null!;
        public decimal? SalePrice { get; set; }
        public decimal? FixedPurchasePrice { get; set; }
        public string Vatrate { get; set; } = null!;
        public bool IsIncludeVat { get; set; }
        public bool IsPromotion { get; set; }
        public bool IsInactive { get; set; }
        public int? ItemOnHand { get; set; }
        public int? QuarantineOnHand { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class GoodsDetailDto
    {
        public string GoodsId { get; set; } = null!;
        public string GoodsName { get; set; } = null!;
        public string? GoodsGroupId { get; set; }
        public string? GoodsGroupName { get; set; }
        public string Unit { get; set; } = null!;
        public int? MinimumStock { get; set; }
        public decimal? FixedPurchasePrice { get; set; }
        public decimal? LastPurchasePrice { get; set; }
        public decimal? SalePrice { get; set; }
        public string Vatrate { get; set; } = null!;
        public bool IsIncludeVat { get; set; }
        public bool IsPromotion { get; set; }
        public bool IsInactive { get; set; }
        public int? ItemOnHand { get; set; }
        public int? QuarantineOnHand { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class GoodsSearchResult
    {
        public string GoodsId { get; set; } = null!;
        public string GoodsName { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public decimal? SalePrice { get; set; }
        public int? ItemOnHand { get; set; }
        public int? QuarantineOnHand { get; set; }
    }

    public class CreateGoodsRequest
    {
        public string GoodsId { get; set; } = null!;
        public string GoodsName { get; set; } = null!;
        public string? GoodsGroupId { get; set; }
        public string Unit { get; set; } = null!;
        public int? MinimumStock { get; set; }
        public decimal? FixedPurchasePrice { get; set; }
        public decimal? SalePrice { get; set; }
        public string Vatrate { get; set; } = "0%";
        public bool IsIncludeVat { get; set; } = false;
        public bool IsPromotion { get; set; } = false;
    }

    public class UpdateGoodsRequest
    {
        public string GoodsName { get; set; } = null!;
        public string? GoodsGroupId { get; set; }
        public string Unit { get; set; } = null!;
        public int? MinimumStock { get; set; }
        public decimal? FixedPurchasePrice { get; set; }
        public decimal? SalePrice { get; set; }
        public string Vatrate { get; set; } = "0%";
        public bool IsIncludeVat { get; set; }
        public bool IsPromotion { get; set; }
    }

    public class GetGoodsListRequest
    {
        public string? Keyword { get; set; }
        public string? GoodsGroupId { get; set; }
        public bool? IsInactive { get; set; }
        public bool? IsPromotion { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
}
