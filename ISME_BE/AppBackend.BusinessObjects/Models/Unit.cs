using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class Unit
{
    public int Id { get; set; }

    public string? Unit1 { get; set; }

    public bool IsInactive { get; set; }
}
