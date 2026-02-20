using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    public class GoodsSearchDto
    {
        public string GoodsId { get; set; } = string.Empty;
        public string GoodsName { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal? SalePrice { get; set; }
        public string Vatrate { get; set; } = null!;
        public int? ItemOnHand { get; set; }
    }
}
