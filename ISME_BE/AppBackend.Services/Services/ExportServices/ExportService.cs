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

        // ── Validate dùng chung cho Create và Update ──────────────────────
        private async Task<ResultModel<int>?> ValidateItems(
            List<CreateExportItemRequest> items, bool checkWarehouse = true)
        {
            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.GoodsId))
                    return Fail(400, "INVALID_ITEM", "Mã hàng hóa không được để trống");

                var goods = await _itemRepository.GetByIdAsync(item.GoodsId);
                if (goods == null)
                    return Fail(404, "ITEM_NOT_FOUND", $"Không tìm thấy hàng hóa: {item.GoodsId}");

                if (item.Quantity is null || item.Quantity <= 0)
                    return Fail(400, "INVALID_QUANTITY", $"Số lượng không hợp lệ cho {goods.GoodsName}");

                if (item.UnitPrice is null || item.UnitPrice < 0)
                    return Fail(400, "INVALID_PRICE", $"Đơn giá không hợp lệ cho {goods.GoodsName}");

                if (checkWarehouse && string.IsNullOrWhiteSpace(item.CreditWarehouseId))
                    return Fail(400, "MISSING_WAREHOUSE", $"Chưa chọn kho xuất cho {goods.GoodsName}");
            }
            return null;
        }

        // ── Tạo mới phiếu xuất kho ────────────────────────────────────────
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
                    VoucherDetails = new List<VoucherDetail>()
                };

                foreach (var item in request.Items)
                {
                    export.VoucherDetails.Add(new VoucherDetail
                    {
                        GoodsId = item.GoodsId,
                        GoodsName = item.GoodsName,
                        Unit = item.Unit,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        Amount1 = item.Amount1,
                        DebitAccount1 = item.DebitAccount1,
                        CreditAccount1 = item.CreditAccount1,
                        CreditWarehouseId = item.CreditWarehouseId,  // Kho xuất
                        DebitAccount2 = item.DebitAccount2,
                        CreditAccount2 = item.CreditAccount2,
                        Promotion = item.Promotion,
                        Vat = item.Vat,
                        UserId = item.UserId,
                        CreatedDateTime = item.CreatedDateTime,
                        OffsetVoucher = item.OffsetVoucher,   // Phiếu nhập gốc → tracking lô
                    });
                }

                await _exportRepository.AddAsync(export);
                var rows = await _unitOfWork.SaveChangesAsync();

                return Ok(rows, "Tạo phiếu xuất kho thành công");
            }
            catch (Exception ex) { return Error(ex); }
        }

        // ── Cập nhật phiếu xuất kho ───────────────────────────────────────
        public async Task<ResultModel<int>> UpdateExportAsync(ExportOrder request, string userId)
        {
            try
            {
                var validErr = await ValidateItems(request.Items);
                if (validErr != null) return validErr;

                var voucher = await _exportRepository.GetByIdAsync(request.VoucherId);
                if (voucher == null)
                    return Fail(404, "NOT_FOUND", $"Không tìm thấy phiếu xuất: {request.VoucherId}");

                // Cập nhật header
                voucher.VoucherCode = request.VoucherCode;
                voucher.CustomerId = request.CustomerId;
                voucher.CustomerName = request.CustomerName;
                voucher.TaxCode = request.TaxCode;
                voucher.Address = request.Address;
                voucher.VoucherDescription = request.VoucherDescription;
                voucher.VoucherDate = request.VoucherDate;
                voucher.BankName = request.BankName;
                voucher.BankAccountNumber = request.BankAccountNumber;

                // Xóa items cũ → thêm lại items mới
                voucher.VoucherDetails.Clear();

                foreach (var item in request.Items)
                {
                    voucher.VoucherDetails.Add(new VoucherDetail
                    {
                        GoodsId = item.GoodsId,
                        GoodsName = item.GoodsName,
                        Unit = item.Unit,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        Amount1 = item.Amount1,
                        DebitAccount1 = item.DebitAccount1,
                        CreditAccount1 = item.CreditAccount1,
                        CreditWarehouseId = item.CreditWarehouseId,
                        DebitAccount2 = item.DebitAccount2,
                        CreditAccount2 = item.CreditAccount2,
                        Promotion = item.Promotion,
                        Vat = item.Vat,
                        UserId = item.UserId,
                        CreatedDateTime = item.CreatedDateTime,
                        OffsetVoucher = item.OffsetVoucher,   // Phiếu nhập gốc → tracking lô
                    });
                }

                await _exportRepository.UpdateAsync(voucher);
                var rows = await _unitOfWork.SaveChangesAsync();

                return Ok(rows, "Cập nhật phiếu xuất kho thành công");
            }
            catch (Exception ex) { return Error(ex); }
        }

        // ── Lấy chi tiết 1 phiếu xuất ────────────────────────────────────
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
                    }).ToList(),
                };

                return new ResultModel<ExportOrder>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = dto,
                    Message = "OK"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<ExportOrder>
                {
                    IsSuccess = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode = 500,
                    Data = null,
                    Message = ex.Message
                };
            }
        }

        // ── Danh sách phiếu xuất ─────────────────────────────────────────
        public async Task<ResultModel<PagedResult<ExportListDto>>> GetListAsync(
            GetExportListRequest request)
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
                    TotalAmount = v.VoucherDetails
                                     .Where(d => d.Amount1.HasValue)
                                     .Sum(d => d.Amount1!.Value),
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

        // ── Result helpers ────────────────────────────────────────────────
        private static ResultModel<int> Ok(int data, string msg) => new()
        { IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200, Data = data, Message = msg };

        private static ResultModel<int> Fail(int code, string rc, string msg) => new()
        { IsSuccess = false, ResponseCode = rc, StatusCode = code, Data = 0, Message = msg };

        private static ResultModel<int> Error(Exception ex) => new()
        { IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500, Data = 0, Message = ex.Message };
    }
}