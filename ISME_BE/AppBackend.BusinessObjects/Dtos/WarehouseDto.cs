using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    public class WarehouseTransactionDto
    {
        public DateOnly? VoucherDate { get; set; }
        public string VoucherId { get; set; } = null!;
        public string? WarehouseId { get; set; }
        public string? GoodsId { get; set; }
        public string? Unit { get; set; }

        public decimal WarehouseIn { get; set; }
        public decimal WarehouseOut { get; set; }
        public decimal CustomInHand { get; set; }

        public decimal Cost { get; set; }
        public string? OffsetVoucher { get; set; }
    }

}
