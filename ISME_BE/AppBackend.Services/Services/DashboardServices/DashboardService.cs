using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.DashboardRepo;
using AppBackend.Services.ApiModels;
using Microsoft.EntityFrameworkCore;

namespace AppBackend.Services.Services.DashboardServices;

public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _repo;

    public DashboardService(IDashboardRepository repo)
    {
        _repo = repo;
    }

    // ============================================
    // Overview
    // ============================================

    public async Task<ResultModel<DashboardOverviewDto>> GetOverviewAsync()
    {
        try
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            var monthStart = new DateOnly(today.Year, today.Month, 1);
            var prevMonthStart = monthStart.AddMonths(-1);
            var prevMonthEnd = monthStart.AddDays(-1);

            var products = await _repo.GetAllProductStockAsync();
            var totalStockValue = products.Sum(p => p.StockValue);
            var monthlyRevenue = await _repo.GetRevenueForPeriodAsync(monthStart, today);
            var prevMonthRevenue = await _repo.GetRevenueForPeriodAsync(prevMonthStart, prevMonthEnd);
            var valueGrowthRate = prevMonthRevenue != 0
                ? Math.Round((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue * 100, 2)
                : 0;

            var totalProducts = await _repo.GetActiveProductCountAsync();
            var lowStockCount = await _repo.GetLowStockCountAsync();

            return Ok(new DashboardOverviewDto
            {
                TotalStockValue = totalStockValue,
                MonthlyRevenue = monthlyRevenue,
                ValueGrowthRate = valueGrowthRate,
                TotalProducts = totalProducts,
                TotalLocations = 0,
                AverageCapacityUsage = 0,
                LowStockAlertCount = lowStockCount,
                NearExpiryCount = 0,
                ExpiredStockCount = 0,
                TotalPotentialLoss = 0
            });
        }
        catch (Exception ex)
        {
            return Error<DashboardOverviewDto>(ex.Message);
        }
    }

    // ============================================
    // Finance - Trend Analysis
    // ============================================

    public async Task<ResultModel<List<TrendAnalysisDto>>> GetTrendAnalysisAsync(DateOnly startDate, DateOnly endDate)
    {
        try
        {
            var dailyData = await _repo.GetDailyImportExportAsync(startDate, endDate);
            var baselineStockValue = await _repo.GetStockValueAsOfDateAsync(startDate.AddDays(-1));
            var baselineStockQty = await _repo.GetStockQuantityAsOfDateAsync(startDate.AddDays(-1));

            decimal runningValue = baselineStockValue;
            int runningQty = baselineStockQty;

            var result = dailyData.OrderBy(d => d.Date).Select(d =>
            {
                runningValue += d.ImportValue - d.ExportValue;
                runningQty += d.ImportQuantity - d.ExportQuantity;

                return new TrendAnalysisDto
                {
                    Date = d.Date.ToString("yyyy-MM-dd"),
                    ImportValue = d.ImportValue,
                    ExportValue = d.ExportValue,
                    StockValue = runningValue,
                    ImportQuantity = d.ImportQuantity,
                    ExportQuantity = d.ExportQuantity,
                    StockQuantity = runningQty
                };
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return Error<List<TrendAnalysisDto>>(ex.Message);
        }
    }

    // ============================================
    // Finance - Period Comparison
    // ============================================

    public async Task<ResultModel<List<PeriodComparisonDto>>> GetPeriodComparisonAsync(string periodType, int count)
    {
        try
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            var periods = new List<(string Name, DateOnly Start, DateOnly End)>();

            if (periodType == "quarter")
            {
                for (int i = count - 1; i >= 0; i--)
                {
                    var refDate = today.AddMonths(-(i * 3 + (today.Month - 1) % 3));
                    var qStart = new DateOnly(refDate.Year, ((refDate.Month - 1) / 3) * 3 + 1, 1);
                    var qEnd = qStart.AddMonths(3).AddDays(-1);
                    if (qEnd > today) qEnd = today;
                    var qNum = (qStart.Month - 1) / 3 + 1;
                    periods.Add(($"Q{qNum}/{qStart.Year}", qStart, qEnd));
                }
            }
            else
            {
                for (int i = count - 1; i >= 0; i--)
                {
                    var mStart = new DateOnly(today.Year, today.Month, 1).AddMonths(-i);
                    var mEnd = mStart.AddMonths(1).AddDays(-1);
                    if (mEnd > today) mEnd = today;
                    periods.Add(($"T{mStart.Month}/{mStart.Year}", mStart, mEnd));
                }
            }

            var result = new List<PeriodComparisonDto>();
            foreach (var (name, start, end) in periods)
            {
                var openingValue = await _repo.GetStockValueAsOfDateAsync(start.AddDays(-1));
                var closingValue = await _repo.GetStockValueAsOfDateAsync(end);
                var openingQty = await _repo.GetStockQuantityAsOfDateAsync(start.AddDays(-1));
                var closingQty = await _repo.GetStockQuantityAsOfDateAsync(end);
                var revenue = await _repo.GetRevenueForPeriodAsync(start, end);

                var valueGrowth = openingValue != 0
                    ? Math.Round((closingValue - openingValue) / openingValue * 100, 2)
                    : 0;
                var qtyGrowth = openingQty != 0
                    ? Math.Round((decimal)(closingQty - openingQty) / openingQty * 100, 2)
                    : 0;
                var isStagnation = revenue > 0 && closingValue > revenue * 2;
                string? warning = null;
                if (isStagnation)
                    warning = "Giá trị tồn kho cao gấp đôi doanh thu - cần xem xét giảm hàng tồn";
                else if (valueGrowth < -10)
                    warning = "Giá trị tồn kho giảm mạnh - kiểm tra nguồn cung";

                result.Add(new PeriodComparisonDto
                {
                    PeriodName = name,
                    StartDate = start.ToString("yyyy-MM-dd"),
                    EndDate = end.ToString("yyyy-MM-dd"),
                    OpeningStockValue = openingValue,
                    OpeningStockQuantity = openingQty,
                    ClosingStockValue = closingValue,
                    ClosingStockQuantity = closingQty,
                    ValueGrowthPercent = valueGrowth,
                    QuantityGrowthPercent = qtyGrowth,
                    Revenue = revenue,
                    IsCapitalStagnation = isStagnation,
                    Warning = warning
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return Error<List<PeriodComparisonDto>>(ex.Message);
        }
    }

    // ============================================
    // Finance - Value vs Quantity
    // ============================================

    public async Task<ResultModel<List<ValueVsQuantityDto>>> GetValueVsQuantityAsync()
    {
        try
        {
            var products = await _repo.GetAllProductStockAsync();

            var result = products
                .Where(p => p.StockQuantity > 0)
                .Select(p =>
                {
                    var qty = (int)p.StockQuantity;
                    var unitCost = p.LastPurchasePrice ?? p.FixedPurchasePrice ?? 0m;

                    return new ValueVsQuantityDto
                    {
                        ProductId = p.GoodsId,
                        ProductName = p.GoodsName,
                        SerialNumber = p.GoodsId,
                        UnitCost = unitCost,
                        TotalValue = p.StockValue,
                        AverageCost = qty > 0 ? Math.Round(p.StockValue / qty, 2) : 0,
                        TotalQuantity = qty,
                        LocationInfo = null,
                        OccupiedSpace = qty
                    };
                })
                .OrderByDescending(p => p.TotalValue)
                .ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return Error<List<ValueVsQuantityDto>>(ex.Message);
        }
    }

    // ============================================
    // Operations - Top 10 / ABC Analysis
    // ============================================

    public async Task<ResultModel<List<Top10StructureDto>>> GetTop10StructureAsync()
    {
        try
        {
            var products = await _repo.GetAllProductStockAsync();
            var withValue = products.Where(p => p.StockValue > 0).ToList();
            var totalPortfolioValue = withValue.Sum(p => p.StockValue);

            if (totalPortfolioValue == 0)
                return Ok(new List<Top10StructureDto>());

            var top10 = withValue
                .OrderByDescending(p => p.StockValue)
                .Take(10)
                .ToList();

            decimal cumulative = 0;
            var result = top10.Select(p =>
            {
                var pct = Math.Round(p.StockValue / totalPortfolioValue * 100, 2);
                cumulative += pct;
                var category = cumulative <= 70 ? "A" : cumulative <= 90 ? "B" : "C";
                var priority = category switch
                {
                    "A" => "Cao",
                    "B" => "Trung bình",
                    _ => "Thấp"
                };

                return new Top10StructureDto
                {
                    ProductId = p.GoodsId,
                    ProductName = p.GoodsName,
                    SerialNumber = p.GoodsId,
                    TotalValue = p.StockValue,
                    TotalQuantity = (int)p.StockQuantity,
                    ValuePercentage = pct,
                    CumulativePercentage = Math.Round(cumulative, 2),
                    Category = category,
                    ManagementPriority = priority
                };
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return Error<List<Top10StructureDto>>(ex.Message);
        }
    }

    // ============================================
    // Operations - Warehouse Balance
    // ============================================

    public async Task<ResultModel<List<WarehouseBalanceDto>>> GetWarehouseBalanceAsync()
    {
        return Ok(new List<WarehouseBalanceDto>());
    }

    // ============================================
    // Risk - Minimum Stock Alerts
    // ============================================

    public async Task<ResultModel<List<MinimumStockAlertDto>>> GetMinimumStockAlertsAsync()
    {
        try
        {
            var products = await _repo.GetAllProductStockAsync();
            var alerts = new List<MinimumStockAlertDto>();

            foreach (var p in products.Where(p => p.MinimumStock > 0 && p.StockQuantity < p.MinimumStock))
            {
                var current = (int)p.StockQuantity;
                var min = p.MinimumStock!.Value;
                var reorderPoint = (int)(min * 1.2m);
                var shortage = min - current;
                var suggestedQty = Math.Max(reorderPoint - current, 0);
                var price = p.LastPurchasePrice ?? p.FixedPurchasePrice ?? 0m;

                string alertLevel;
                if (current == 0)
                    alertLevel = "\U0001f534 CRITICAL";
                else if (current < min * 0.5m)
                    alertLevel = "\U0001f534 CRITICAL";
                else
                    alertLevel = "\U0001f7e1 WARNING";

                string? supplierId = null, supplierName = null;
                var supplier = await _repo.GetLastSupplierForGoodsAsync(p.GoodsId);
                if (supplier.HasValue)
                {
                    supplierId = supplier.Value.SupplierId;
                    supplierName = supplier.Value.SupplierName;
                }

                alerts.Add(new MinimumStockAlertDto
                {
                    ProductId = p.GoodsId,
                    ProductName = p.GoodsName,
                    SerialNumber = p.GoodsId,
                    CurrentStock = current,
                    MinimumStock = min,
                    ReorderPoint = reorderPoint,
                    ShortageQuantity = shortage,
                    AlertLevel = alertLevel,
                    SuggestedOrderQuantity = suggestedQty,
                    EstimatedCost = suggestedQty * price,
                    LeadTimeDays = 7,
                    SuggestedOrderDate = DateTime.Today.AddDays(7).ToString("yyyy-MM-dd"),
                    SupplierId = supplierId,
                    SupplierName = supplierName
                });
            }

            return Ok(alerts.OrderBy(a => a.CurrentStock).ToList());
        }
        catch (Exception ex)
        {
            return Error<List<MinimumStockAlertDto>>(ex.Message);
        }
    }

    // ============================================
    // Risk - Expiry Analysis (FEFO)
    // ============================================

    public async Task<ResultModel<List<ExpiryAnalysisDto>>> GetExpiryAnalysisAsync(int daysThreshold)
    {
        // No batch/expiry tracking in the current schema
        return Ok(new List<ExpiryAnalysisDto>());
    }

    // ============================================
    // Risk - Dead Stock Report
    // ============================================

    public async Task<ResultModel<List<DeadStockDto>>> GetDeadStockReportAsync()
    {
        // No batch/expiry tracking in the current schema
        return Ok(new List<DeadStockDto>());
    }

    // ============================================
    // Helpers
    // ============================================

    private static ResultModel<T> Ok<T>(T data) => new()
    {
        IsSuccess = true,
        ResponseCode = "SUCCESS",
        StatusCode = 200,
        Data = data,
        Message = "OK"
    };

    private static ResultModel<T> Error<T>(string message) => new()
    {
        IsSuccess = false,
        ResponseCode = "EXCEPTION",
        StatusCode = 500,
        Data = default,
        Message = message
    };
}
