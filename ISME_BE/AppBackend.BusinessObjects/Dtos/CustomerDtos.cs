using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    public class CustomerListDto
    {
        public string CustomerId { get; set; } = null!;
        public string? CustomerName { get; set; }
        public string? Phone { get; set; }
        public string? TaxId { get; set; }
        public string? Address { get; set; }
        public bool IsEnterprise { get; set; }
        public bool IsInactive { get; set; }
    }

    public class CustomerDetailDto
    {
        public string CustomerId { get; set; } = null!;
        public string? CustomerName { get; set; }
        public string? Phone { get; set; }
        public string? TaxId { get; set; }
        public string? Address { get; set; }
        public bool IsEnterprise { get; set; }
        public bool IsInactive { get; set; }
    }

    public class CustomerSearchResult
    {
        public string CustomerId { get; set; } = null!;
        public string? CustomerName { get; set; }
        public string? Phone { get; set; }
        public string? TaxId { get; set; }
    }

    public class CreateCustomerRequest
    {
        public string CustomerId { get; set; } = null!;
        public string CustomerName { get; set; } = null!;
        public string? Phone { get; set; }
        public string? TaxId { get; set; }
        public string? Address { get; set; }
        public bool IsEnterprise { get; set; } = false;
    }

    public class UpdateCustomerRequest
    {
        public string CustomerName { get; set; } = null!;
        public string? Phone { get; set; }
        public string? TaxId { get; set; }
        public string? Address { get; set; }
        public bool IsEnterprise { get; set; }
    }

    public class GetCustomerListRequest
    {
        public string? Keyword { get; set; }
        public bool? IsInactive { get; set; }
        public bool? IsEnterprise { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
}
