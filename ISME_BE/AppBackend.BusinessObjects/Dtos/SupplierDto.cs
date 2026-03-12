using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    public class SupplierSearchResult
    {
        public string SupplierId { get; set; } = null!;
        public string? SupplierName { get; set; }
        public string? TaxId { get; set; }
        public string? Address { get; set; }
        public string? Phone { get; set; }
    }

    public class CreateSupplierRequest
    {
        public string SupplierId { get; set; } = null!;
        public string SupplierName { get; set; } = null!;
        public string? TaxId { get; set; }
        public string? Address { get; set; }
        public string? Phone { get; set; }
    }
}
