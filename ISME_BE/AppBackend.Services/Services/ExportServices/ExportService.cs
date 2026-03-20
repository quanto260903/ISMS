// ============================================================
//  ExportService.cs
//  Xử lý đầy đủ:
//  1. Validate tồn kho
//  2. FIFO tự động — tách thành NHIỀU VoucherDetail nếu cần nhiều phiếu nhập
//  3. User chọn thủ công offsetVoucher — vẫn hỗ trợ
//  4. Update: hoàn tồn kho cũ trước khi trừ mới
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
        // VALIDATE — tồn tại hàng, số lượng hợp lệ, tồn kho đủ
        // ════════════════════════════════════════════════════════
        private async Task<ResultModel<int>?> ValidateItems(List<CreateExportItemRequest> items)
        {
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

                var currentStock = await _exportRepository.GetCurrentStockAsync(item.GoodsId);
                if (item.Quantity > currentStock)
                    return Fail(400, "INSUFFICIENT_STOCK",
                        $"'{goods.GoodsName}': số lượng xuất ({item.Quantity}) " +
                        $"vượt quá tồn kho hiện tại ({currentStock})");
            }
            return null;
        }

        // ════════════════════════════════════════════════════════
        // BUILD DETAILS — core logic xử lý FIFO + thủ công
        //
        // Với mỗi item trong request, sinh ra 1 hoặc NHIỀU VoucherDetail:
        //
        // TH1: User đã chọn offsetVoucher thủ công (từ modal Kho)
        //      → 1 VoucherDetail với offsetVoucher = user chọn
        //
        // TH2: User KHÔNG chọn → FIFO tự động
        //      → Gọi GetFifoAllocationsAsync → nhận danh sách phân bổ
        //      → Sinh N VoucherDetail, mỗi cái ứng với 1 phiếu nhập
        //
        // Ví dụ TH2: Xuất 15 bánh A
        //   FIFO trả về: [{NK001, 10}, {NK002, 5}]
        //   → Sinh 2 VoucherDetail:
        //     VoucherDetail(qty=10, offsetVoucher=NK001)
        //     VoucherDetail(qty=5,  offsetVoucher=NK002)
        // ════════════════════════════════════════════════════════
        private async Task<List<VoucherDetail>> BuildDetailsAsync(
            string voucherId, List<CreateExportItemRequest> items)
        {
            var result = new List<VoucherDetail>();

            foreach (var item in items)
            {
                if (!string.IsNullOrWhiteSpace(item.OffsetVoucher))
                {
                    // ── TH1: User đã chọn thủ công ──────────────
                    result.Add(MapDetail(voucherId, item, item.Quantity!.Value,
                        item.OffsetVoucher, item.CreditWarehouseId));
                }
                else
                {
                    // ── TH2: FIFO tự động ────────────────────────
                    var allocations = await _exportRepository
                        .GetFifoAllocationsAsync(item.GoodsId, item.Quantity!.Value);

                    if (!allocations.Any())
                    {
                        // Fallback: tồn kho đủ (đã validate) nhưng không tìm được
                        // phiếu nhập nào có OffsetVoucher → lưu với offsetVoucher = null
                        result.Add(MapDetail(voucherId, item, item.Quantity!.Value,
                            null, item.CreditWarehouseId));
                    }
                    else if (allocations.Count == 1)
                    {
                        // Chỉ cần 1 phiếu nhập → giữ nguyên 1 VoucherDetail
                        result.Add(MapDetail(voucherId, item, allocations[0].AllocatedQty,
                            allocations[0].InboundVoucherCode,
                            allocations[0].WarehouseId ?? item.CreditWarehouseId));
                    }
                    else
                    {
                        // Cần nhiều phiếu nhập → tách thành N VoucherDetail
                        // Tính đơn giá theo tỉ lệ số lượng
                        foreach (var alloc in allocations)
                        {
                            result.Add(MapDetail(voucherId, item, alloc.AllocatedQty,
                                alloc.InboundVoucherCode,
                                alloc.WarehouseId ?? item.CreditWarehouseId));
                        }
                    }
                }

                // Trừ tồn kho cho dòng này
                await _exportRepository.DeductStockAsync(item.GoodsId, item.Quantity!.Value);
            }

            return result;
        }

        // ── Mapper: 1 request item → 1 VoucherDetail ─────────────────────
        private static VoucherDetail MapDetail(
            string voucherId, CreateExportItemRequest item,
            int qty, string? offsetVoucher, string? warehouseId) => new()
            {
                VoucherId = voucherId,
                GoodsId = item.GoodsId,
                GoodsName = item.GoodsName,
                Unit = item.Unit,
                Quantity = qty,
                UnitPrice = item.UnitPrice,
                // Amount tính theo qty thực tế của từng dòng phân bổ
                Amount1 = (item.UnitPrice ?? 0) * qty * (1 - (item.Promotion ?? 0) / 100),
                DebitAccount1 = item.DebitAccount1,
                CreditAccount1 = item.CreditAccount1,
                CreditWarehouseId = warehouseId,
                DebitAccount2 = item.DebitAccount2,
                CreditAccount2 = item.CreditAccount2,
                Promotion = item.Promotion,
                Vat = item.Vat,
                UserId = item.UserId,
                CreatedDateTime = item.CreatedDateTime ?? DateTime.UtcNow,
                OffsetVoucher = offsetVoucher,
            };

        // ════════════════════════════════════════════════════════
        // CREATE
        // ════════════════════════════════════════════════════════
        public async Task<ResultModel<int>> CreateExportAsync(ExportOrder request, string userId)
        {
            try
            {
                var validErr = await ValidateItems(request.Items);
                if (validErr != null) return validErr;

                var export = new Voucher
                {
                    VoucherId = request.VoucherId,
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

                var details = await BuildDetailsAsync(export.VoucherId, request.Items);
                export.VoucherDetails = details;

                await _exportRepository.AddAsync(export);
                var rows = await _unitOfWork.SaveChangesAsync();
                return Ok(rows, "Tạo phiếu xuất kho thành công");
            }
            catch (Exception ex) { return Error(ex); }
        }

        // ════════════════════════════════════════════════════════
        // UPDATE
        // Quan trọng: hoàn tồn kho từ phiếu CŨ trước, rồi trừ lại từ phiếu MỚI
        // ════════════════════════════════════════════════════════
        public async Task<ResultModel<int>> UpdateExportAsync(ExportOrder request, string userId)
        {
            try
            {
                var voucher = await _exportRepository.GetByIdAsync(request.VoucherId);
                if (voucher == null)
                    return Fail(404, "NOT_FOUND", $"Không tìm thấy phiếu xuất: {request.VoucherId}");

                var validErr = await ValidateItems(request.Items);
                if (validErr != null) return validErr;

                // ── Hoàn tồn kho từ các dòng CŨ ─────────────────
                foreach (var oldDetail in voucher.VoucherDetails)
                {
                    if (!string.IsNullOrWhiteSpace(oldDetail.GoodsId) && oldDetail.Quantity > 0)
                        await _exportRepository.AddStockAsync(
                            oldDetail.GoodsId, oldDetail.Quantity!.Value);
                }

                // ── Cập nhật header ───────────────────────────────
                voucher.VoucherCode = request.VoucherCode;
                voucher.CustomerId = request.CustomerId;
                voucher.CustomerName = request.CustomerName;
                voucher.TaxCode = request.TaxCode;
                voucher.Address = request.Address;
                voucher.VoucherDescription = request.VoucherDescription;
                voucher.VoucherDate = request.VoucherDate;
                voucher.BankName = request.BankName;
                voucher.BankAccountNumber = request.BankAccountNumber;

                // ── Xóa details cũ, build lại từ request mới ─────
                voucher.VoucherDetails.Clear();
                var newDetails = await BuildDetailsAsync(voucher.VoucherId, request.Items);
                foreach (var d in newDetails) voucher.VoucherDetails.Add(d);

                await _exportRepository.UpdateAsync(voucher);
                var rows = await _unitOfWork.SaveChangesAsync();
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
                    Items = voucher.VoucherDetails.Select(d => new CreateExportItemRequest
                    {
                        GoodsId = d.GoodsId,
                        GoodsName = d.GoodsName,
                        Unit = d.Unit,
                        Quantity = d.Quantity,
                        UnitPrice = d.UnitPrice,
                        Amount1 = d.Amount1,
                        Vat = d.Vat,
                        Promotion = d.Promotion,
                        DebitAccount1 = d.DebitAccount1,
                        CreditAccount1 = d.CreditAccount1,
                        CreditWarehouseId = d.CreditWarehouseId,
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