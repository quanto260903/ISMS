using AppBackend.Services.Services.DashboardServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppBackend.ApiCore.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var result = await _dashboardService.GetOverviewAsync();
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("finance/trend-analysis")]
    public async Task<IActionResult> GetTrendAnalysis(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var start = startDate ?? today.AddDays(-30);
        var end = endDate ?? today;

        var result = await _dashboardService.GetTrendAnalysisAsync(start, end);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("finance/period-comparison")]
    public async Task<IActionResult> GetPeriodComparison(
        [FromQuery] string periodType = "month",
        [FromQuery] int count = 6)
    {
        var result = await _dashboardService.GetPeriodComparisonAsync(periodType, count);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("finance/value-vs-quantity")]
    public async Task<IActionResult> GetValueVsQuantity()
    {
        var result = await _dashboardService.GetValueVsQuantityAsync();
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("operations/top10-structure")]
    public async Task<IActionResult> GetTop10Structure()
    {
        var result = await _dashboardService.GetTop10StructureAsync();
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("operations/warehouse-balance")]
    public async Task<IActionResult> GetWarehouseBalance()
    {
        var result = await _dashboardService.GetWarehouseBalanceAsync();
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("risk/minimum-stock-alerts")]
    public async Task<IActionResult> GetMinimumStockAlerts()
    {
        var result = await _dashboardService.GetMinimumStockAlertsAsync();
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("risk/expiry-analysis")]
    public async Task<IActionResult> GetExpiryAnalysis([FromQuery] int daysThreshold = 30)
    {
        var result = await _dashboardService.GetExpiryAnalysisAsync(daysThreshold);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("risk/dead-stock-report")]
    public async Task<IActionResult> GetDeadStockReport()
    {
        var result = await _dashboardService.GetDeadStockReportAsync();
        return StatusCode(result.StatusCode, result);
    }
}
