using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class Customer
{
    public string CustomerId { get; set; } = null!;

    public string? CustomerName { get; set; }

    public string? Address { get; set; }

    public string? TaxId { get; set; }

    public string? Phone { get; set; }

    public bool? IsCustomer { get; set; }

    public bool? IsVendor { get; set; }

    public bool? IsEnterprise { get; set; }

    public bool IsInactive { get; set; }
}
