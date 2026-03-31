namespace AppBackend.Repositories.Repositories.DashboardRepo;

public class ProductStockInfo
{
    public string GoodsId { get; set; } = null!;
    public string GoodsName { get; set; } = null!;
    public string Unit { get; set; } = null!;
    public int? MinimumStock { get; set; }
    public decimal? LastPurchasePrice { get; set; }
    public decimal? FixedPurchasePrice { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal StockQuantity { get; set; }
    public decimal StockValue { get; set; }
}

public class DailyImportExportAggregate
{
    public DateOnly Date { get; set; }
    public decimal ImportValue { get; set; }
    public decimal ExportValue { get; set; }
    public int ImportQuantity { get; set; }
    public int ExportQuantity { get; set; }
}

public interface IDashboardRepository
{
    Task<int> GetActiveProductCountAsync();
    Task<int> GetLowStockCountAsync();
    Task<List<ProductStockInfo>> GetAllProductStockAsync();
    Task<List<DailyImportExportAggregate>> GetDailyImportExportAsync(DateOnly start, DateOnly end);
    Task<decimal> GetRevenueForPeriodAsync(DateOnly start, DateOnly end);
    Task<decimal> GetStockValueAsOfDateAsync(DateOnly asOfDate);
    Task<int> GetStockQuantityAsOfDateAsync(DateOnly asOfDate);
    Task<(string? SupplierId, string? SupplierName)?> GetLastSupplierForGoodsAsync(string goodsId);
}
