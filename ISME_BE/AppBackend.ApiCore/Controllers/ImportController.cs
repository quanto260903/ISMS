using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.ActivityLogServices;
using AppBackend.Services.Services.ImportServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Globalization;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImportController : ControllerBase
    {
        private const int ActivityDescriptionMaxLength = 500;

        private readonly IImportServices _importService;
        private readonly IActivityLogService _actLog;

        public ImportController(IImportServices importService, IActivityLogService actLog)
        {
            _importService = importService;
            _actLog        = actLog;
        }

        private string? CurrentUserId => User.FindFirstValue("userId");
        /// <summary>
        /// Xem trước mã phiếu nhập kho tiếp theo (không tiêu thụ số thứ tự)
        /// GET /api/Import/next-id
        /// </summary>
        [HttpGet("next-id")]
        public async Task<IActionResult> GetNextId()
        {
            var nextId = await _importService.GetNextVoucherIdAsync();
            return Ok(new { voucherId = nextId });
        }

        /// <summary>
        /// Thêm mới phiếu nhập kho
        /// </summary>
        [HttpPost("add-inward")]
        public async Task<IActionResult> AddInward([FromBody] ImportOrder request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "INVALID_MODEL",
                    StatusCode = 400,
                    Data = 0,
                    Message = "Dữ liệu không hợp lệ"
                });

            var result = await _importService.CreateInwardAsync(request, CurrentUserId);
            if (result.IsSuccess)
                await _actLog.LogAsync(CurrentUserId, "TAO_PHIEU",
                    $"Tạo phiếu nhập kho {request.VoucherId} ({request.VoucherCode})",
                    ActivityModule.Import);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Danh sách phiếu nhập kho — có lọc và phân trang
        /// GET /api/Inward/list?fromDate=2026-03-01&toDate=2026-03-31&keyword=NK&page=1&pageSize=50
        /// </summary>
        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] GetInwardListRequest request)
        {
            var result = await _importService.GetListAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Lấy chi tiết phiếu nhập kho theo ID
        /// GET /api/Import/{voucherId}
        /// </summary>
        [HttpGet("{voucherId}")]
        public async Task<IActionResult> GetById(string voucherId)
        {
            var result = await _importService.GetByIdAsync(voucherId);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Cập nhật phiếu nhập kho
        /// PUT /api/Import/{voucherId}
        /// </summary>
        [HttpPut("{voucherId}")]
        public async Task<IActionResult> UpdateInward(string voucherId, [FromBody] ImportOrder request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "INVALID_MODEL",
                    StatusCode = 400,
                    Data = 0,
                    Message = "Dữ liệu không hợp lệ"
                });

            if (voucherId != request.VoucherId)
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "ID_MISMATCH",
                    StatusCode = 400,
                    Data = 0,
                    Message = "VoucherId trong URL và body không khớp"
                });

            var beforeResult = await _importService.GetByIdAsync(voucherId);
            var beforeData = beforeResult.IsSuccess ? beforeResult.Data : null;

            var result = await _importService.UpdateInwardAsync(request, CurrentUserId);
            if (result.IsSuccess)
                await _actLog.LogAsync(CurrentUserId, "CAP_NHAT_PHIEU",
                    BuildUpdateActivityDescription(beforeData, request),
                    ActivityModule.Import);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Xóa phiếu nhập kho
        /// DELETE /api/Import/{voucherId}
        /// </summary>
        [HttpDelete("{voucherId}")]
        public async Task<IActionResult> DeleteInward(string voucherId)
        {
            var result = await _importService.DeleteAsync(voucherId);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Tìm kiếm phiếu nhập kho theo từ khóa (dùng cho dropdown gợi ý)
        /// GET /api/Import/search?keyword=NK&amp;limit=10
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string keyword = "",
            [FromQuery] int limit = 10)
        {
            var result = await _importService.SearchInwardVouchersAsync(keyword, limit);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Kiểm tra phiếu nhập đã được xuất trả hàng (XK1) chưa
        /// GET /api/Import/check-return/{inwardVoucherId}
        /// </summary>
        [HttpGet("check-return/{inwardVoucherId}")]
        public async Task<IActionResult> CheckReturn(string inwardVoucherId)
        {
            var isUsed = await _importService.CheckInwardUsedForReturnAsync(inwardVoucherId);
            return Ok(new { isUsed });
        }

        private static string BuildUpdateActivityDescription(ImportOrder? before, ImportOrder after)
        {
            var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
            if (before == null)
            {
                return TruncateActivityDescription(
                    $"Cập nhật phiếu nhập kho {after.VoucherId} ({after.VoucherCode}) lúc {timestamp}");
            }

            var changes = new List<string>();

            AddStringChange(changes, "Mã loại phiếu", before.VoucherCode, after.VoucherCode);
            AddStringChange(changes, "Mã đối tượng", before.CustomerId, after.CustomerId);
            AddStringChange(changes, "Tên đối tượng", before.CustomerName, after.CustomerName);
            AddStringChange(changes, "Mã số thuế", before.TaxCode, after.TaxCode);
            AddStringChange(changes, "Địa chỉ", before.Address, after.Address);
            AddStringChange(changes, "Diễn giải", before.VoucherDescription, after.VoucherDescription);
            AddDateChange(changes, "Ngày phiếu", before.VoucherDate, after.VoucherDate);
            AddStringChange(changes, "Số hóa đơn", before.InvoiceNumber, after.InvoiceNumber);
            AddStringChange(changes, "Loại hóa đơn", before.InvoiceType, after.InvoiceType);
            AddStringChange(changes, "Mẫu hóa đơn", before.InvoiceId, after.InvoiceId);
            AddDateChange(changes, "Ngày hóa đơn", before.InvoiceDate, after.InvoiceDate);

            var beforeItemCount = before.Items.Count;
            var afterItemCount = after.Items.Count;
            if (beforeItemCount != afterItemCount)
                changes.Add($"Số dòng hàng: {beforeItemCount} -> {afterItemCount}");

            var beforeQuantity = before.Items.Sum(item => item.Quantity ?? 0);
            var afterQuantity = after.Items.Sum(item => item.Quantity ?? 0);
            if (beforeQuantity != afterQuantity)
                changes.Add(
                    $"Tổng SL: {beforeQuantity} -> {afterQuantity} ({FormatSignedNumber(afterQuantity - beforeQuantity)})");

            var beforeAmount = before.Items.Sum(item => item.Amount1 ?? ((item.Quantity ?? 0) * (item.UnitPrice ?? 0)));
            var afterAmount = after.Items.Sum(item => item.Amount1 ?? ((item.Quantity ?? 0) * (item.UnitPrice ?? 0)));
            if (beforeAmount != afterAmount)
                changes.Add(
                    $"Tổng tiền: {FormatDecimal(beforeAmount)} -> {FormatDecimal(afterAmount)} ({FormatSignedDecimal(afterAmount - beforeAmount)})");

            var itemChanges = BuildItemChangeSummary(before.Items, after.Items);
            if (!string.IsNullOrWhiteSpace(itemChanges))
                changes.Add(itemChanges);

            if (changes.Count == 0)
                changes.Add("Không thay đổi dữ liệu");

            return TruncateActivityDescription(
                $"Cập nhật phiếu nhập kho {after.VoucherId} ({after.VoucherCode}) lúc {timestamp}: {string.Join("; ", changes)}");
        }

        private static string BuildItemChangeSummary(
            IEnumerable<CreateInwardItemRequest> beforeItems,
            IEnumerable<CreateInwardItemRequest> afterItems)
        {
            var beforeMap = BuildItemMap(beforeItems);
            var afterMap = BuildItemMap(afterItems);
            var messages = new List<string>();
            var hiddenChanges = 0;

            foreach (var key in afterMap.Keys.Except(beforeMap.Keys).OrderBy(key => key))
            {
                if (messages.Count < 3)
                    messages.Add($"thêm {afterMap[key].Label} (SL {afterMap[key].Quantity}, tiền {FormatDecimal(afterMap[key].Amount)})");
                else
                    hiddenChanges++;
            }

            foreach (var key in beforeMap.Keys.Except(afterMap.Keys).OrderBy(key => key))
            {
                if (messages.Count < 3)
                    messages.Add($"xóa {beforeMap[key].Label} (SL {beforeMap[key].Quantity}, tiền {FormatDecimal(beforeMap[key].Amount)})");
                else
                    hiddenChanges++;
            }

            foreach (var key in beforeMap.Keys.Intersect(afterMap.Keys).OrderBy(key => key))
            {
                var beforeItem = beforeMap[key];
                var afterItem = afterMap[key];
                var itemDiffs = new List<string>();

                if (beforeItem.Quantity != afterItem.Quantity)
                    itemDiffs.Add($"SL {beforeItem.Quantity}->{afterItem.Quantity}");

                if (beforeItem.UnitPrice != afterItem.UnitPrice)
                    itemDiffs.Add($"ĐG {FormatDecimal(beforeItem.UnitPrice)}->{FormatDecimal(afterItem.UnitPrice)}");

                if (beforeItem.Amount != afterItem.Amount)
                    itemDiffs.Add($"tiền {FormatDecimal(beforeItem.Amount)}->{FormatDecimal(afterItem.Amount)}");

                if (itemDiffs.Count == 0)
                    continue;

                if (messages.Count < 3)
                    messages.Add($"sửa {afterItem.Label} ({string.Join(", ", itemDiffs)})");
                else
                    hiddenChanges++;
            }

            if (messages.Count == 0 && hiddenChanges == 0)
                return string.Empty;

            if (hiddenChanges > 0)
                messages.Add($"+{hiddenChanges} thay đổi hàng hóa khác");

            return $"Hàng hóa: {string.Join("; ", messages)}";
        }

        private static Dictionary<string, ItemSnapshot> BuildItemMap(IEnumerable<CreateInwardItemRequest> items)
        {
            var map = new Dictionary<string, ItemSnapshot>(StringComparer.OrdinalIgnoreCase);

            foreach (var item in items)
            {
                var key = BuildItemKey(item);
                if (!map.TryGetValue(key, out var snapshot))
                {
                    snapshot = new ItemSnapshot
                    {
                        Label = BuildItemLabel(item),
                    };
                    map[key] = snapshot;
                }

                snapshot.Quantity += item.Quantity ?? 0;
                snapshot.Amount += item.Amount1 ?? ((item.Quantity ?? 0) * (item.UnitPrice ?? 0));
                snapshot.UnitPrice = item.UnitPrice ?? snapshot.UnitPrice;
            }

            return map;
        }

        private static string BuildItemKey(CreateInwardItemRequest item)
        {
            if (!string.IsNullOrWhiteSpace(item.GoodsId))
                return item.GoodsId.Trim();

            if (!string.IsNullOrWhiteSpace(item.GoodsName))
                return $"NAME:{item.GoodsName.Trim()}";

            return $"ROW:{Guid.NewGuid():N}";
        }

        private static string BuildItemLabel(CreateInwardItemRequest item)
        {
            var goodsId = string.IsNullOrWhiteSpace(item.GoodsId) ? null : item.GoodsId.Trim();
            var goodsName = string.IsNullOrWhiteSpace(item.GoodsName) ? null : item.GoodsName.Trim();

            if (!string.IsNullOrWhiteSpace(goodsId) && !string.IsNullOrWhiteSpace(goodsName))
                return $"{goodsId}/{goodsName}";

            return goodsId ?? goodsName ?? "không xác định";
        }

        private static void AddStringChange(List<string> changes, string fieldName, string? before, string? after)
        {
            var normalizedBefore = Normalize(before);
            var normalizedAfter = Normalize(after);
            if (normalizedBefore == normalizedAfter)
                return;

            changes.Add($"{fieldName}: {Display(before)} -> {Display(after)}");
        }

        private static void AddDateChange(List<string> changes, string fieldName, DateOnly? before, DateOnly? after)
        {
            if (before == after)
                return;

            changes.Add($"{fieldName}: {Display(before)} -> {Display(after)}");
        }

        private static string Normalize(string? value)
            => string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

        private static string Display(string? value)
            => string.IsNullOrWhiteSpace(value) ? "(trống)" : value.Trim();

        private static string Display(DateOnly? value)
            => value?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "(trống)";

        private static string FormatDecimal(decimal value)
            => value.ToString("0.##", CultureInfo.InvariantCulture);

        private static string FormatSignedDecimal(decimal value)
            => value > 0
                ? $"+{FormatDecimal(value)}"
                : FormatDecimal(value);

        private static string FormatSignedNumber(int value)
            => value > 0 ? $"+{value}" : value.ToString(CultureInfo.InvariantCulture);

        private static string TruncateActivityDescription(string description)
        {
            if (description.Length <= ActivityDescriptionMaxLength)
                return description;

            return $"{description[..(ActivityDescriptionMaxLength - 3)]}...";
        }

        private sealed class ItemSnapshot
        {
            public string Label { get; set; } = string.Empty;
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal Amount { get; set; }
        }
    }
}
