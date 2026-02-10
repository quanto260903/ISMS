using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class Warehouse
{
    public string WarehouseId { get; set; } = null!;

    public string WarehouseName { get; set; } = null!;

    public string? Address { get; set; }

    public bool IsInactive { get; set; }
}
