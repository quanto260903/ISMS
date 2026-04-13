using AppBackend.BusinessObjects.Constants;
using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.ImportRepo;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services.ApiModels;

namespace AppBackend.Services.Services.ImportServices
{
    public class ImportService : IImportServices
    {
        private readonly IImportRepository _inwardRepository;
        private readonly IItemRepository _itemRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ImportService(
            IImportRepository inwardRepository,
            IItemRepository itemRepository,
            IUnitOfWork unitOfWork)
        {
            _inwardRepository = inwardRepository;
            _itemRepository = itemRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ResultModel<int>> CreateInwardAsync(ImportOrder request, string userId)
        {
            await using var tx = await _unitOfWork.BeginTransactionAsync();
            try
            {
                var validation = await ValidateItemsAsync(request);
                if (validation != null) return validation;

                var generatedId = await _inwardRepository.GenerateVoucherIdAsync();
                var inward = new Voucher
                {
                    VoucherId = generatedId,
                    VoucherCode = request.VoucherCode,
                    CustomerId = request.CustomerId,
                    CustomerName = request.CustomerName,
                    TaxCode = request.TaxCode,
                    Address = request.Address,
                    VoucherDescription = request.VoucherDescription,
                    VoucherDate = request.VoucherDate,
                    InvoiceNumber = request.InvoiceNumber,
                    InvoiceType = request.InvoiceType,
                    InvoiceId = request.InvoiceId,
                    InvoiceDate = request.InvoiceDate,
                    BankName = request.BankName,
                    BankAccountNumber = request.BankAccountNumber,
                    VoucherDetails = request.Items.Select(MapDetail).ToList()
                };

                await _inwardRepository.AddAsync(inward);
                await _unitOfWork.SaveChangesAsync();

                foreach (var itemRequest in request.Items)
                    await ApplyStockIncreaseAsync(itemRequest.GoodsId!, itemRequest.Quantity!.Value, itemRequest.StockBucket, request.VoucherCode);

                var affectedRows = await _unitOfWork.SaveChangesAsync();
                await tx.CommitAsync();

                return Success(affectedRows, "Tạo phiếu nhập kho thành công");
            }
            catch (Exception ex)
            {
                return ExceptionResult(ex);
            }
        }

        public async Task<ResultModel<PagedResult<InwardListDto>>> GetListAsync(GetInwardListRequest request)
        {
            try
            {
                if (!request.FromDate.HasValue)
                    request.FromDate = new DateOnly(DateTime.Today.Year, DateTime.Today.Month, 1);
                if (!request.ToDate.HasValue)
                    request.ToDate = DateOnly.FromDateTime(DateTime.Today);

                var (items, total) = await _inwardRepository.GetListAsync(request);

                var dtos = items.Select(v => new InwardListDto
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
                    StockBucket = v.VoucherDetails
                        .Select(d => NormalizeStockBucket(d.StockBucket, v.VoucherCode))
                        .FirstOrDefault()
                }).ToList();

                return new ResultModel<PagedResult<InwardListDto>>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = new PagedResult<InwardListDto>
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
                return new ResultModel<PagedResult<InwardListDto>>
                {
                    IsSuccess = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode = 500,
                    Data = new PagedResult<InwardListDto>(),
                    Message = ex.Message
                };
            }
        }

        public async Task<ResultModel<ImportOrder>> GetByIdAsync(string voucherId)
        {
            try
            {
                var voucher = await _inwardRepository.GetByIdAsync(voucherId);

                if (voucher == null)
                    return new ResultModel<ImportOrder>
                    {
                        IsSuccess = false,
                        ResponseCode = "NOT_FOUND",
                        StatusCode = 404,
                        Data = null,
                        Message = $"Không tìm thấy phiếu nhập: {voucherId}"
                    };

                var dto = new ImportOrder
                {
                    VoucherId = voucher.VoucherId,
                    VoucherCode = voucher.VoucherCode,
                    CustomerId = voucher.CustomerId,
                    CustomerName = voucher.CustomerName,
                    TaxCode = voucher.TaxCode,
                    Address = voucher.Address,
                    VoucherDescription = voucher.VoucherDescription,
                    VoucherDate = voucher.VoucherDate,
                    InvoiceNumber = voucher.InvoiceNumber,
                    InvoiceType = voucher.InvoiceType,
                    InvoiceId = voucher.InvoiceId,
                    InvoiceDate = voucher.InvoiceDate,
                    BankName = voucher.BankName,
                    BankAccountNumber = voucher.BankAccountNumber,
                    Items = voucher.VoucherDetails.Select(d => new CreateInwardItemRequest
                    {
                        GoodsId = d.GoodsId,
                        GoodsName = d.GoodsName,
                        Unit = d.Unit,
                        Quantity = d.Quantity,
                        UnitPrice = d.UnitPrice,
                        Amount1 = d.Amount1,
                        Promotion = d.Promotion,
                        OffsetVoucher = d.OffsetVoucher,
                        StockBucket = NormalizeStockBucket(d.StockBucket, voucher.VoucherCode),
                        SourceVoucherId = d.SourceVoucherId ?? d.OffsetVoucher,
                        SourceVoucherDetailId = d.SourceVoucherDetailId,
                        ReturnReason = d.ReturnReason,
                        RootCause = d.RootCause,
                        ExpiryDate = d.ExpiryDate,
                        DebitAccount1 = d.DebitAccount1,
                        CreditAccount1 = d.CreditAccount1,
                        DebitAccount2 = d.DebitAccount2,
                        CreditAccount2 = d.CreditAccount2,
                        UserId = d.UserId,
                        CreatedDateTime = d.CreatedDateTime,
                    }).ToList(),
                };

                return new ResultModel<ImportOrder>
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
                return new ResultModel<ImportOrder>
                {
                    IsSuccess = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode = 500,
                    Data = null,
                    Message = ex.Message
                };
            }
        }

        public async Task<ResultModel<int>> UpdateInwardAsync(ImportOrder request, string userId)
        {
            await using var tx = await _unitOfWork.BeginTransactionAsync();
            try
            {
                var validation = await ValidateItemsAsync(request, request.VoucherId);
                if (validation != null) return validation;

                var voucher = await _inwardRepository.GetByIdAsync(request.VoucherId);

                if (voucher == null)
                    return new ResultModel<int>
                    {
                        IsSuccess = false,
                        ResponseCode = "NOT_FOUND",
                        StatusCode = 404,
                        Data = 0,
                        Message = $"Không tìm thấy phiếu nhập: {request.VoucherId}"
                    };

                voucher.VoucherCode = request.VoucherCode;
                voucher.CustomerId = request.CustomerId;
                voucher.CustomerName = request.CustomerName;
                voucher.TaxCode = request.TaxCode;
                voucher.Address = request.Address;
                voucher.VoucherDescription = request.VoucherDescription;
                voucher.VoucherDate = request.VoucherDate;
                voucher.InvoiceNumber = request.InvoiceNumber;
                voucher.InvoiceType = request.InvoiceType;
                voucher.InvoiceId = request.InvoiceId;
                voucher.InvoiceDate = request.InvoiceDate;

                foreach (var old in voucher.VoucherDetails)
                {
                    if (!string.IsNullOrWhiteSpace(old.GoodsId) && (old.Quantity ?? 0) > 0)
                        await ApplyStockDecreaseAsync(old.GoodsId, old.Quantity!.Value, old.StockBucket, voucher.VoucherCode);
                }

                voucher.VoucherDetails.Clear();

                foreach (var itemRequest in request.Items)
                {
                    voucher.VoucherDetails.Add(MapDetail(itemRequest));
                }

                await _inwardRepository.UpdateAsync(voucher);
                await _unitOfWork.SaveChangesAsync();

                foreach (var itemRequest in request.Items)
                    await ApplyStockIncreaseAsync(itemRequest.GoodsId!, itemRequest.Quantity!.Value, itemRequest.StockBucket, request.VoucherCode);

                var affectedRows = await _unitOfWork.SaveChangesAsync();
                await tx.CommitAsync();

                return Success(affectedRows, "Cập nhật phiếu nhập kho thành công");
            }
            catch (Exception ex)
            {
                return ExceptionResult(ex);
            }
        }

        public async Task<string> GetNextVoucherIdAsync()
            => await _inwardRepository.GenerateVoucherIdAsync();

        public async Task<ResultModel<int>> DeleteAsync(string voucherId)
        {
            await using var tx = await _unitOfWork.BeginTransactionAsync();
            try
            {
                var voucher = await _inwardRepository.GetByIdAsync(voucherId);
                if (voucher == null)
                    return new ResultModel<int>
                    {
                        IsSuccess = false,
                        ResponseCode = "NOT_FOUND",
                        StatusCode = 404,
                        Data = 0,
                        Message = $"Không tìm thấy phiếu nhập: {voucherId}"
                    };

                var hasExports = await _inwardRepository.HasDependentExportsAsync(voucherId);
                if (hasExports)
                    return new ResultModel<int>
                    {
                        IsSuccess = false,
                        ResponseCode = "HAS_DEPENDENT_EXPORTS",
                        StatusCode = 400,
                        Data = 0,
                        Message = "Phiếu nhập đã có phiếu xuất kho đối trừ, không thể xóa"
                    };

                foreach (var detail in voucher.VoucherDetails)
                {
                    if (!string.IsNullOrWhiteSpace(detail.GoodsId) && (detail.Quantity ?? 0) > 0)
                        await ApplyStockDecreaseAsync(detail.GoodsId, detail.Quantity!.Value, detail.StockBucket, voucher.VoucherCode);
                }
                await _unitOfWork.SaveChangesAsync();

                await _inwardRepository.DeleteAsync(voucherId);
                var affected = await _unitOfWork.SaveChangesAsync();
                await tx.CommitAsync();

                return Success(affected, "Xóa phiếu nhập kho thành công");
            }
            catch (Exception ex)
            {
                return ExceptionResult(ex);
            }
        }

        private async Task<ResultModel<int>?> ValidateItemsAsync(
            ImportOrder request,
            string? excludeVoucherId = null)
        {
            if (request.Items == null || request.Items.Count == 0)
                return Failure(400, "EMPTY_ITEMS", "Phiếu nhập phải có ít nhất một dòng hàng hóa");

            foreach (var itemRequest in request.Items)
            {
                if (string.IsNullOrWhiteSpace(itemRequest.GoodsId))
                    return Failure(400, "INVALID_ITEM", "Mã hàng hóa không được để trống");

                var goods = await TryGetGoodsAsync(itemRequest.GoodsId);
                if (goods == null)
                    return Failure(404, "ITEM_NOT_FOUND", $"Không tìm thấy hàng hóa: {itemRequest.GoodsId}");

                if (itemRequest.Quantity is null || itemRequest.Quantity <= 0)
                    return Failure(400, "INVALID_QUANTITY", $"Số lượng không hợp lệ cho {goods.GoodsName}");

                if (itemRequest.UnitPrice is null || itemRequest.UnitPrice < 0)
                    return Failure(400, "INVALID_PRICE", $"Đơn giá không hợp lệ cho {goods.GoodsName}");

                itemRequest.StockBucket = NormalizeStockBucket(itemRequest.StockBucket, request.VoucherCode);

                if (request.VoucherCode == "NK2")
                {
                    var saleVoucherId = itemRequest.SourceVoucherId ?? itemRequest.OffsetVoucher;
                    if (string.IsNullOrWhiteSpace(saleVoucherId))
                        return Failure(400, "MISSING_SOURCE_VOUCHER", $"'{goods.GoodsName}': thiếu phiếu bán nguồn");

                    if (string.IsNullOrWhiteSpace(itemRequest.ReturnReason))
                        return Failure(400, "MISSING_RETURN_REASON", $"'{goods.GoodsName}': bắt buộc nhập lý do trả hàng");

                    if (string.IsNullOrWhiteSpace(itemRequest.RootCause))
                        return Failure(400, "MISSING_ROOT_CAUSE", $"'{goods.GoodsName}': bắt buộc nhập nguyên nhân lỗi");

                    var saleSource = await _inwardRepository.GetSaleSourceDetailAsync(
                        saleVoucherId,
                        itemRequest.GoodsId!,
                        itemRequest.SourceVoucherDetailId);

                    if (saleSource == null)
                        return Failure(404, "SALE_SOURCE_NOT_FOUND",
                            $"'{goods.GoodsName}': không tìm thấy dòng bán gốc trong phiếu {saleVoucherId}");

                    var returnedQty = await _inwardRepository.GetReturnedQuantityForSaleLineAsync(
                        saleSource.Value.SaleVoucherDetailId,
                        saleVoucherId,
                        itemRequest.GoodsId!,
                        excludeVoucherId);

                    var remainingQty = saleSource.Value.SoldQty - returnedQty;
                    if (itemRequest.Quantity.Value > remainingQty)
                        return Failure(400, "EXCEEDS_SOLD_QTY",
                            $"'{goods.GoodsName}': số lượng nhận lại ({itemRequest.Quantity:N0}) vượt quá số còn có thể trả ({Math.Max(0, remainingQty):N0})");

                    itemRequest.SourceVoucherId = saleVoucherId;
                    itemRequest.OffsetVoucher = saleVoucherId;
                    itemRequest.SourceVoucherDetailId = saleSource.Value.SaleVoucherDetailId;
                    itemRequest.StockBucket = StockBucketConstants.Quarantine;
                }
            }

            return null;
        }

        private async Task<Good?> TryGetGoodsAsync(string goodsId)
        {
            try
            {
                return await _itemRepository.GetByIdAsync(goodsId);
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        private static VoucherDetail MapDetail(CreateInwardItemRequest itemRequest) => new()
        {
            GoodsId = itemRequest.GoodsId,
            GoodsName = itemRequest.GoodsName,
            Unit = itemRequest.Unit,
            Quantity = itemRequest.Quantity,
            UnitPrice = itemRequest.UnitPrice,
            Amount1 = itemRequest.Amount1,
            DebitAccount1 = itemRequest.DebitAccount1,
            CreditAccount1 = itemRequest.CreditAccount1,
            DebitAccount2 = itemRequest.DebitAccount2,
            CreditAccount2 = itemRequest.CreditAccount2,
            Promotion = itemRequest.Promotion,
            OffsetVoucher = itemRequest.OffsetVoucher,
            StockBucket = itemRequest.StockBucket,
            SourceVoucherId = itemRequest.SourceVoucherId,
            SourceVoucherDetailId = itemRequest.SourceVoucherDetailId,
            ReturnReason = itemRequest.ReturnReason,
            RootCause = itemRequest.RootCause,
            ExpiryDate = itemRequest.ExpiryDate,
            UserId = itemRequest.UserId,
            CreatedDateTime = itemRequest.CreatedDateTime,
        };

        private async Task ApplyStockIncreaseAsync(
            string goodsId,
            int quantity,
            string? stockBucket,
            string? voucherCode)
        {
            if (NormalizeStockBucket(stockBucket, voucherCode) == StockBucketConstants.Quarantine)
            {
                await _inwardRepository.AddQuarantineStockAsync(goodsId, quantity);
                return;
            }

            await _inwardRepository.AddSellableStockAsync(goodsId, quantity);
        }

        private async Task ApplyStockDecreaseAsync(
            string goodsId,
            int quantity,
            string? stockBucket,
            string? voucherCode)
        {
            if (NormalizeStockBucket(stockBucket, voucherCode) == StockBucketConstants.Quarantine)
            {
                await _inwardRepository.DeductQuarantineStockAsync(goodsId, quantity);
                return;
            }

            await _inwardRepository.DeductSellableStockAsync(goodsId, quantity);
        }

        private static string NormalizeStockBucket(string? stockBucket, string? voucherCode)
        {
            var bucket = stockBucket?.Trim().ToUpperInvariant();
            if (bucket == StockBucketConstants.Quarantine)
                return StockBucketConstants.Quarantine;

            return voucherCode == "NK2"
                ? StockBucketConstants.Quarantine
                : StockBucketConstants.Sellable;
        }

        private static ResultModel<int> Success(int data, string message) => new()
        {
            IsSuccess = true,
            ResponseCode = "SUCCESS",
            StatusCode = 200,
            Data = data,
            Message = message
        };

        private static ResultModel<int> Failure(int code, string responseCode, string message) => new()
        {
            IsSuccess = false,
            ResponseCode = responseCode,
            StatusCode = code,
            Data = 0,
            Message = message
        };

        private static ResultModel<int> ExceptionResult(Exception ex) => new()
        {
            IsSuccess = false,
            ResponseCode = "EXCEPTION",
            StatusCode = 500,
            Data = 0,
            Message = ex.Message
        };
    }
}
