namespace AppBackend.BusinessObjects.Dtos;

// ============================================
// 1. Overview
// ============================================

public class DashboardOverviewDto
{
    public decimal TotalStockValue { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public decimal ValueGrowthRate { get; set; }
    public int TotalProducts { get; set; }
    public int TotalLocations { get; set; }
    public decimal AverageCapacityUsage { get; set; }
    public int LowStockAlertCount { get; set; }
    public int NearExpiryCount { get; set; }
    public int ExpiredStockCount { get; set; }
    public decimal TotalPotentialLoss { get; set; }
}

// ============================================
// 2. Finance & Performance
// ============================================

public class TrendAnalysisDto
{
    public string Date { get; set; } = null!;
    public decimal ImportValue { get; set; }
    public decimal ExportValue { get; set; }
    public decimal StockValue { get; set; }
    public int ImportQuantity { get; set; }
    public int ExportQuantity { get; set; }
    public int StockQuantity { get; set; }
}

public class PeriodComparisonDto
{
    public string PeriodName { get; set; } = null!;
    public string StartDate { get; set; } = null!;
    public string EndDate { get; set; } = null!;
    public decimal OpeningStockValue { get; set; }
    public int OpeningStockQuantity { get; set; }
    public decimal ClosingStockValue { get; set; }
    public int ClosingStockQuantity { get; set; }
    public decimal ValueGrowthPercent { get; set; }
    public decimal QuantityGrowthPercent { get; set; }
    public decimal Revenue { get; set; }
    public bool IsCapitalStagnation { get; set; }
    public string? Warning { get; set; }
}

public class ValueVsQuantityDto
{
    public string ProductId { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string SerialNumber { get; set; } = null!;
    public decimal UnitCost { get; set; }
    public decimal TotalValue { get; set; }
    public decimal AverageCost { get; set; }
    public int TotalQuantity { get; set; }
    public string? LocationInfo { get; set; }
    public decimal OccupiedSpace { get; set; }
}

// ============================================
// 3. Operations & Optimization
// ============================================

public class Top10StructureDto
{
    public string ProductId { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string SerialNumber { get; set; } = null!;
    public decimal TotalValue { get; set; }
    public int TotalQuantity { get; set; }
    public decimal ValuePercentage { get; set; }
    public decimal CumulativePercentage { get; set; }
    public string Category { get; set; } = null!;
    public string ManagementPriority { get; set; } = null!;
}

public class WarehouseBalanceDto
{
    public string LocationId { get; set; } = null!;
    public string LocationName { get; set; } = null!;
    public string? ShelfId { get; set; }
    public int TotalProducts { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalValue { get; set; }
    public decimal CapacityUsed { get; set; }
    public bool IsOverloaded { get; set; }
    public bool IsUnderUtilized { get; set; }
    public List<string> TransferSuggestions { get; set; } = new();
}

// ============================================
// 4. Risk Management
// ============================================

public class MinimumStockAlertDto
{
    public string ProductId { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string SerialNumber { get; set; } = null!;
    public int CurrentStock { get; set; }
    public int MinimumStock { get; set; }
    public int ReorderPoint { get; set; }
    public int ShortageQuantity { get; set; }
    public string AlertLevel { get; set; } = null!;
    public int SuggestedOrderQuantity { get; set; }
    public decimal EstimatedCost { get; set; }
    public int LeadTimeDays { get; set; }
    public string? SuggestedOrderDate { get; set; }
    public string? SupplierId { get; set; }
    public string? SupplierName { get; set; }
}

public class ExpiryAnalysisDto
{
    public string ProductId { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string SerialNumber { get; set; } = null!;
    public string? BatchNumber { get; set; }
    public string? ExpiryDate { get; set; }
    public int DaysUntilExpiry { get; set; }
    public int Quantity { get; set; }
    public decimal Value { get; set; }
    public string? LocationInfo { get; set; }
    public string ExpiryStatus { get; set; } = null!;
    public string FefoPriority { get; set; } = null!;
    public List<string> ActionSuggestions { get; set; } = new();
}

public class DeadStockDto
{
    public string ProductId { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string SerialNumber { get; set; } = null!;
    public string? BatchNumber { get; set; }
    public string? ExpiryDate { get; set; }
    public int DaysOverdue { get; set; }
    public int Quantity { get; set; }
    public decimal OriginalValue { get; set; }
    public decimal LiquidationValue { get; set; }
    public decimal TotalLoss { get; set; }
    public string? LocationInfo { get; set; }
    public string? ResponsibleUserId { get; set; }
    public string? ResponsibleUserName { get; set; }
    public string? ResponsibleRole { get; set; }
    public string? ImportDate { get; set; }
    public string? ImportOrderId { get; set; }
    public string? DisposalStatus { get; set; }
    public string? DisposalMethod { get; set; }
}
