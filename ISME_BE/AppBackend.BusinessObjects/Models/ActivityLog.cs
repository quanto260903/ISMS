using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class ActivityLog
{
    public int Id { get; set; }

    public string? UserId { get; set; }

    public string? Action { get; set; }

    public string? Module { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User? User { get; set; }
}
