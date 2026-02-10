using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class GoodsCategory
{
    public string GoodsGroupId { get; set; } = null!;

    public string GoodsGroupName { get; set; } = null!;

    public bool IsInactive { get; set; }

    public virtual ICollection<Good> Goods { get; set; } = new List<Good>();
}
