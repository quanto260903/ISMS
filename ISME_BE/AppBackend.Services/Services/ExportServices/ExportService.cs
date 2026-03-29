// ============================================================
//  ExportService.cs
//  Nghiệp vụ xuất kho:
//  - User BẮT BUỘC chọn chứng từ nhập kho đối trừ (offsetVoucher) cho từng dòng.
//  - Validate số lượng xuất không vượt tồn còn lại của từng phiếu nhập.
//  - Toàn bộ thao tác Create/Update bọc trong transaction để đảm bảo toàn vẹn dữ liệu.
//  - Update: validate trước → hoàn tồn kho cũ → trừ tồn kho mới → lưu.
// ============================================================
using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.ExportRepo;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services.ApiModels;

namespace AppBackend.Services.Services.ExportServices
{
    public class ExportService : IExportServices
    {
        private readonly IExportRepository _exportRepository;
        private readonly IItemRepository _itemRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ExportService(
            IExportRepository exportRepository,
            IItemRepository itemRepository,
            IUnitOfWork unitOfWork)
        {
            _exportRepository = exportRepository;
            _itemRepository = itemRepository;
            _unitOfWork = unitOfWork;
        }

        // ════════════════════════════════════════════════════════
        // VALIDATE
        //
        // Quy tắc:
        //   1. GoodsId, Quantity, UnitPrice hợp lệ.
        //   2. [ERROR 1] offsetVoucher BẮT BUỘC — user phải chọn chứng từ nhập kho.
        //   3. [ERROR 2] Tổng số lượng xuất từ mỗi (GoodsId, offsetVoucher) không được
        //      vượt quá tồn còn lại trong phiếu nhập đó.
        //      Hỗ trợ nhiều dòng cùng trỏ vào một phiếu nhập: tổng hợp trước khi check.
        //
        // excludeVoucherId: dùng khi Update — loại trừ phiếu xuất đang sửa khỏi
        //   phép tính "đã xuất", tránh tự block chính mình.
        // ════════════════════════════════════════════════════════
        private async Task<ResultModel<int>?> ValidateItems(
            List<CreateExportItemRequest> items,
            string? voucherCode = null,
            string? excludeVoucherId = null)
        {
            if (items == null || items.Count == 0)
                return Fail(400, "EMPTY_ITEMS", "Phiếu xuất phải có ít nhất một dòng hàng hóa");

            // XK3 = xuất kiểm kê — bỏ qua OffsetVoucher và kiểm tra FIFO
            // vì đây là phiếu điều chỉnh tồn kho, không phải xuất bán hàng thông thường
            bool isStockTakeExport = voucherCode == "XK3";

            // Gom tổng số lượng theo (GoodsId, OffsetVoucher) để kiểm tra aggregate
            var inboundTotals = new Dictionary<(string goodsId, string offsetVoucher), int>();

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.GoodsId))
                    return Fail(400, "INVALID_ITEM", "Mã hàng hóa không được để trống");

                var goods = await _itemRepository.GetByIdAsync(item.GoodsId);
                if (goods == null)
                    return Fail(404, "ITEM_NOT_FOUND", $"Không tìm thấy hàng hóa: {item.GoodsId}");

                if (item.Quantity is null || item.Quantity <= 0)
                    return Fail(400, "INVALID_QUANTITY",
                        $"Số lượng không hợp lệ cho '{goods.GoodsName}'");

                if (item.UnitPrice is null || item.UnitPrice < 0)
                    return Fail(400, "INVALID_PRICE",
                        $"Đơn giá không hợp lệ cho '{goods.GoodsName}'");

                // [ERROR 1] offsetVoucher bắt buộc — trừ XK3 (xuất kiểm kê không trỏ vào phiếu nhập)
                if (!isStockTakeExport && string.IsNullOrWhiteSpace(item.OffsetVoucher))
                    return Fail(400, "MISSING_OFFSET_VOUCHER",
                        $"'{goods.GoodsName}': phải chọn chứng từ nhập kho đối trừ");

                if (!isStockTakeExport && !string.IsNullOrWhiteSpace(item.OffsetVoucher))
                {
                    var key = (item.GoodsId!, item.OffsetVoucher!);
                    inboundTotals[key] = inboundTotals.GetValueOrDefault(key) + item.Quantity.Value;
                }
            }

            // [ERROR 2] Kiểm tra tồn còn lại theo từng phiếu nhập (aggregate) — bỏ qua cho XK3
            foreach (var ((goodsId, offsetVoucher), totalQty) in inboundTotals)
            {
                var remaining = await _exportRepository
                    .GetRemainingQtyForInboundAsync(goodsId, offsetVoucher, excludeVoucherId);

                if (totalQty > remaining)
                {
                    var goods = await _itemRepository.GetByIdAsync(goodsId);
                    return Fail(400, "EXCEEDS_INBOUND_STOCK",
                        $"'{goods?.GoodsName ?? goodsId}': " +
                        $"số lượng xuất từ phiếu '{offsetVoucher}' ({totalQty:N0}) " +
                        $"vượt quá tồn còn lại ({remaining:N0})");
                }
            }

            return null;
        }

        // ════════════════════════════════════════════════════════
        // BUILD DETAILS
        //
        // Mỗi item request → 1 VoucherDetail.
        // offsetVoucher đã được validate là không rỗng trước khi vào đây.
        // Tồn kho được trừ thủ công bằng DeductStockAsync (trigger đã bị xóa).
        // ════════════════════════════════════════════════════════
        private static List<VoucherDetail> BuildDetails(
            string voucherId, List<CreateExportItemRequest> items)
        {
            var result = new List<VoucherDetail>();

            foreach (var item in items)
            {
                result.Add(MapDetail(voucherId, item, item.Quantity!.Value,
                    item.OffsetVoucher!));
            }

            return result;
        }

        // ── Mapper: 1 request item → 1 VoucherDetail ─────────────────────
        private static VoucherDetail MapDetail(
            string voucherId, CreateExportItemRequest item,
            int qty, string? offsetVoucher) => new()
            {
                VoucherId = voucherId,
                GoodsId = item.GoodsId,
                GoodsName = item.GoodsName,
                Unit = item.Unit,
                Quantity = qty,
                UnitPrice = item.UnitPrice,
                // Amount1: frontend tính sẵn (inboundCost / inboundQty × exportQty)
                //          nếu không có thì fallback về UnitPrice × qty
                // Amount2: null — chỉ dùng trong luồng bán hàng
                Amount1 = item.Amount1 ?? (item.UnitPrice ?? 0) * qty,
                DebitAccount1 = item.DebitAccount1,
                CreditAccount1 = item.CreditAccount1,
                DebitAccount2 = item.DebitAccount2,
                CreditAccount2 = item.CreditAccount2,
                Promotion = item.Promotion,
                UserId = item.UserId,
                CreatedDateTime = item.CreatedDateTime ?? DateTime.UtcNow,
                OffsetVoucher = offsetVoucher,
            };

        // ════════════════════════════════════════════════════════
        // CREATE
        // Bọc transaction: validate → build → save → trừ tồn kho → commit.
        // ════════════════════════════════════════════════════════
        public async Task<ResultModel<int>> CreateExportAsync(ExportOrder request, string userId)
        {
            await using var tx = await _unitOfWork.BeginTransactionAsync();
            try
            {
                var validErr = await ValidateItems(request.Items, voucherCode: request.VoucherCode);
                if (validErr != null) return validErr;

                var generatedId = await _exportRepository.GenerateVoucherIdAsync();
                var export = new Voucher
                {
                    VoucherId = generatedId,
                    VoucherCode = request.VoucherCode,
                    CustomerId = request.CustomerId,
                    CustomerName = request.CustomerName,
                    TaxCode = request.TaxCode,
                    Address = request.Address,
                    VoucherDescription = request.VoucherDescription,
                    VoucherDate = request.VoucherDate,
                    BankName = request.BankName,
                    BankAccountNumber = request.BankAccountNumber,
                    VoucherDetails = new List<VoucherDetail>(),
                };

                var details = BuildDetails(export.VoucherId, request.Items);
                export.VoucherDetails = details;

                await _exportRepository.AddAsync(export);
                await _unitOfWork.SaveChangesAsync();

                foreach (var item in request.Items)
                    await _exportRepository.DeductStockAsync(item.GoodsId!, item.Quantity!.Value);

                var rows = await _unitOfWork.SaveChangesAsync();
                await tx.CommitAsync();
                return Ok(rows, "Tạo phiếu xuất kho thành công");
            }
            catch (Exception ex) { return Error(ex); }
        }

        // ════════════════════════════════════════════════════════
        // UPDATE
        // Thứ tự quan trọng:
        //   1. Validate (excludeVoucherId để bỏ qua export hiện tại khi tính đã xuất).
        //   2. Zero-out details cũ: set Quantity = 0 (GIỮ LẠI để báo cáo),
        //      đồng thời cộng lại tồn kho thủ công bằng AddStockAsync.
        //   3. INSERT details mới + trừ tồn kho thủ công bằng DeductStockAsync.
        //   4. SaveChanges + Commit.
        // ════════════════════════════════════════════════════════
        public async Task<ResultModel<int>> UpdateExportAsync(ExportOrder request, string userId)
        {
            await using var tx = await _unitOfWork.BeginTransactionAsync();
            try
            {
                var voucher = await _exportRepository.GetByIdAsync(request.VoucherId);
                if (voucher == null)
                    return Fail(404, "NOT_FOUND", $"Không tìm thấy phiếu xuất: {request.VoucherId}");

                // ── 1. Validate với excludeVoucherId ──────────────
                var validErr = await ValidateItems(request.Items, voucherCode: request.VoucherCode, excludeVoucherId: request.VoucherId);
                if (validErr != null) return validErr;

                // ── 2. Zero-out details cũ: GIỮ LẠI dòng (dùng cho báo cáo),
                //       set Quantity = 0 + hoàn tồn kho thủ công ──────────────
                foreach (var oldDetail in voucher.VoucherDetails)
                {
                    var oldQty = oldDetail.Quantity ?? 0;
                    if (!string.IsNullOrWhiteSpace(oldDetail.GoodsId) && oldQty > 0)
                    {
                        await _exportRepository.AddStockAsync(oldDetail.GoodsId, oldQty);
                        oldDetail.Quantity = 0;
                        oldDetail.Amount1   = 0;
                    }
                }

                // ── 3. Cập nhật header ────────────────────────────
                voucher.VoucherCode = request.VoucherCode;
                voucher.CustomerId = request.CustomerId;
                voucher.CustomerName = request.CustomerName;
                voucher.TaxCode = request.TaxCode;
                voucher.Address = request.Address;
                voucher.VoucherDescription = request.VoucherDescription;
                voucher.VoucherDate = request.VoucherDate;
                voucher.BankName = request.BankName;
                voucher.BankAccountNumber = request.BankAccountNumber;

                // ── 4. INSERT details mới + trừ tồn kho thủ công ────────────
                var newDetails = BuildDetails(voucher.VoucherId, request.Items);
                foreach (var d in newDetails) voucher.VoucherDetails.Add(d);

                await _exportRepository.UpdateAsync(voucher);
                await _unitOfWork.SaveChangesAsync();

                foreach (var item in request.Items)
                    await _exportRepository.DeductStockAsync(item.GoodsId!, item.Quantity!.Value);

                var rows = await _unitOfWork.SaveChangesAsync();
                await tx.CommitAsync();
                return Ok(rows, "Cập nhật phiếu xuất kho thành công");
            }
            catch (Exception ex) { return Error(ex); }
        }

        // ════════════════════════════════════════════════════════
        // GET BY ID
        // ════════════════════════════════════════════════════════
        public async Task<ResultModel<ExportOrder>> GetByIdAsync(string voucherId)
        {
            try
            {
                var voucher = await _exportRepository.GetByIdAsync(voucherId);
                if (voucher == null)
                    return new ResultModel<ExportOrder>
                    {
                        IsSuccess = false,
                        ResponseCode = "NOT_FOUND",
                        StatusCode = 404,
                        Data = null,
                        Message = $"Không tìm thấy phiếu xuất: {voucherId}"
                    };

                var dto = new ExportOrder
                {
                    VoucherId = voucher.VoucherId,
                    VoucherCode = voucher.VoucherCode,
                    CustomerId = voucher.CustomerId,
                    CustomerName = voucher.CustomerName,
                    TaxCode = voucher.TaxCode,
                    Address = voucher.Address,
                    VoucherDescription = voucher.VoucherDescription,
                    VoucherDate = voucher.VoucherDate,
                    BankName = voucher.BankName,
                    BankAccountNumber = voucher.BankAccountNumber,
                    Items = voucher.VoucherDetails
                        .Where(d => (d.Quantity ?? 0) > 0)
                        .Select(d => new CreateExportItemRequest
                    {
                        GoodsId = d.GoodsId,
                        GoodsName = d.GoodsName,
                        Unit = d.Unit,
                        Quantity = d.Quantity,
                        UnitPrice = d.UnitPrice,
                        Amount1 = d.Amount1,
                        Promotion = d.Promotion,
                        DebitAccount1 = d.DebitAccount1,
                        CreditAccount1 = d.CreditAccount1,
                        DebitAccount2 = d.DebitAccount2,
                        CreditAccount2 = d.CreditAccount2,
                        UserId = d.UserId,
                        CreatedDateTime = d.CreatedDateTime,
                        OffsetVoucher = d.OffsetVoucher,
                    }).ToList(),
                };

                return new ResultModel<ExportOrder>
                { IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200, Data = dto, Message = "OK" };
            }
            catch (Exception ex)
            {
                return new ResultModel<ExportOrder>
                { IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500, Data = null, Message = ex.Message };
            }
        }

        // ════════════════════════════════════════════════════════
        // GET LIST
        // ════════════════════════════════════════════════════════
        public async Task<ResultModel<PagedResult<ExportListDto>>> GetListAsync(GetExportListRequest request)
        {
            try
            {
                if (!request.FromDate.HasValue)
                    request.FromDate = new DateOnly(DateTime.Today.Year, DateTime.Today.Month, 1);
                if (!request.ToDate.HasValue)
                    request.ToDate = DateOnly.FromDateTime(DateTime.Today);

                var (items, total) = await _exportRepository.GetListAsync(request);
                var dtos = items.Select(v => new ExportListDto
                {
                    VoucherId = v.VoucherId,
                    VoucherCode = v.VoucherCode,
                    InvoiceNumber = v.InvoiceNumber,
                    VoucherDate = v.VoucherDate,
                    CustomerName = v.CustomerName,
                    TotalAmount = v.VoucherDetails.Where(d => d.Amount1.HasValue).Sum(d => d.Amount1!.Value),
                    ItemCount = v.VoucherDetails.Count,
                }).ToList();

                return new ResultModel<PagedResult<ExportListDto>>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = new PagedResult<ExportListDto>
                    {
                        Items = dtos,
                        Total = total,
                        Page = request.Page,
                        PageSize = request.PageSize,
                        GrandTotal = dtos.Sum(d => d.TotalAmount),
                    },
                    Message = "OK"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<PagedResult<ExportListDto>>
                {
                    IsSuccess = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode = 500,
                    Data = new PagedResult<ExportListDto>(),
                    Message = ex.Message
                };
            }
        }
        public async Task<string> GetNextVoucherIdAsync()
            => await _exportRepository.GenerateVoucherIdAsync();

        public async Task<IEnumerable<FifoAllocationDto>> GetFifoPreviewAsync(
    string goodsId, int quantity)
        {
            // Gọi repository — đúng layer
            var allocations = await _exportRepository
                .GetFifoAllocationsAsync(goodsId, quantity);

            return allocations.Select(a => new FifoAllocationDto
            {
                InboundVoucherCode = a.InboundVoucherCode,
                AllocatedQty = a.AllocatedQty,
                WarehouseId = a.WarehouseId,
            });
        }

        private static ResultModel<int> Ok(int data, string msg) => new()
        { IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200, Data = data, Message = msg };
        private static ResultModel<int> Fail(int code, string rc, string msg) => new()
        { IsSuccess = false, ResponseCode = rc, StatusCode = code, Data = 0, Message = msg };
        private static ResultModel<int> Error(Exception ex) => new()
        { IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500, Data = 0, Message = ex.Message };
    }
}