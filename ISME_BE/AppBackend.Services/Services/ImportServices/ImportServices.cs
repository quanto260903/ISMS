using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.ImportRepo;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
            try
            {
                // ── 1. Validate từng dòng hàng hóa trước khi insert ──
                foreach (var itemRequest in request.Items)
                {
                    if (string.IsNullOrWhiteSpace(itemRequest.GoodsId))
                    {
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "INVALID_ITEM",
                            StatusCode = 400,
                            Data = 0,
                            Message = "Mã hàng hóa không được để trống"
                        };
                    }

                    var goods = await _itemRepository.GetByIdAsync(itemRequest.GoodsId);

                    if (goods == null)
                    {
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "ITEM_NOT_FOUND",
                            StatusCode = 404,
                            Data = 0,
                            Message = $"Không tìm thấy hàng hóa: {itemRequest.GoodsId}"
                        };
                    }

                    if (itemRequest.Quantity is null || itemRequest.Quantity <= 0)
                    {
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "INVALID_QUANTITY",
                            StatusCode = 400,
                            Data = 0,
                            Message = $"Số lượng không hợp lệ cho {goods.GoodsName}"
                        };
                    }

                    if (itemRequest.UnitPrice is null || itemRequest.UnitPrice < 0)
                    {
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "INVALID_PRICE",
                            StatusCode = 400,
                            Data = 0,
                            Message = $"Đơn giá không hợp lệ cho {goods.GoodsName}"
                        };
                    }
                }

                // ── 2. Tạo Voucher header ──
                var inward = new Voucher
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

                // ── 3. Tạo từng dòng VoucherDetail ──
                foreach (var itemRequest in request.Items)
                {
                    var goods = await _itemRepository.GetByIdAsync(itemRequest.GoodsId!);

                    inward.VoucherDetails.Add(new VoucherDetail
                    {
                        GoodsId = itemRequest.GoodsId,
                        GoodsName = itemRequest.GoodsName,
                        Unit = itemRequest.Unit,
                        Quantity = itemRequest.Quantity,
                        UnitPrice = itemRequest.UnitPrice,
                        Amount1 = itemRequest.Amount1,
                        DebitAccount1 = itemRequest.DebitAccount1,
                        CreditAccount1 = itemRequest.CreditAccount1,
                        DebitWarehouseId = itemRequest.DebitWarehouseId,
                        DebitAccount2 = itemRequest.DebitAccount2,
                        CreditAccount2 = itemRequest.CreditAccount2,
                        Promotion = itemRequest.Promotion,
                        Vat = itemRequest.Vat,
                        UserId = itemRequest.UserId, 
                        CreatedDateTime = itemRequest.CreatedDateTime,
                    });
                }

                // ── 4. Lưu vào DB ──
                await _inwardRepository.AddAsync(inward);
                var affectedRows = await _unitOfWork.SaveChangesAsync();

                return new ResultModel<int>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = affectedRows,
                    Message = "Tạo phiếu nhập kho thành công"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode = 500,
                    Data = 0,
                    Message = ex.Message
                };
            }
        }

        public async Task<ResultModel<PagedResult<InwardListDto>>> GetListAsync(
    GetInwardListRequest request)
        {
            try
            {
                // Mặc định lọc theo tháng hiện tại nếu không truyền ngày
                if (!request.FromDate.HasValue)
                    request.FromDate = new DateOnly(DateTime.Today.Year, DateTime.Today.Month, 1);
                if (!request.ToDate.HasValue)
                    request.ToDate = DateOnly.FromDateTime(DateTime.Today);

                var (items, total) = await _inwardRepository.GetListAsync(request);

                var dtos = items.Select(v => new InwardListDto
                {
                    VoucherId = v.VoucherId,
                    VoucherCode = v.VoucherCode,
                    InvoiceNumber = v.InvoiceNumber,        // null → hiển thị "--"
                    VoucherDate = v.VoucherDate,
                    CustomerName = v.CustomerName,
                    TotalAmount = v.VoucherDetails
                                     .Where(d => d.Amount1.HasValue)
                                     .Sum(d => d.Amount1!.Value),
                    ItemCount = v.VoucherDetails.Count,
                }).ToList();

                var grandTotal = dtos.Sum(d => d.TotalAmount);

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
                        GrandTotal = grandTotal,
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

                // Map Voucher entity → ImportOrder DTO (khớp shape frontend expect)
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
                        Vat = d.Vat,
                        Promotion = d.Promotion,
                        DebitAccount1 = d.DebitAccount1,
                        CreditAccount1 = d.CreditAccount1,
                        DebitWarehouseId = d.DebitWarehouseId,
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
            try
            {
                // ── 1. Validate từng dòng hàng hóa (giữ đúng pattern CreateInwardAsync) ──
                foreach (var itemRequest in request.Items)
                {
                    if (string.IsNullOrWhiteSpace(itemRequest.GoodsId))
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "INVALID_ITEM",
                            StatusCode = 400,
                            Data = 0,
                            Message = "Mã hàng hóa không được để trống"
                        };

                    var goods = await _itemRepository.GetByIdAsync(itemRequest.GoodsId);

                    if (goods == null)
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "ITEM_NOT_FOUND",
                            StatusCode = 404,
                            Data = 0,
                            Message = $"Không tìm thấy hàng hóa: {itemRequest.GoodsId}"
                        };

                    if (itemRequest.Quantity is null || itemRequest.Quantity <= 0)
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "INVALID_QUANTITY",
                            StatusCode = 400,
                            Data = 0,
                            Message = $"Số lượng không hợp lệ cho {goods.GoodsName}"
                        };

                    if (itemRequest.UnitPrice is null || itemRequest.UnitPrice < 0)
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "INVALID_PRICE",
                            StatusCode = 400,
                            Data = 0,
                            Message = $"Đơn giá không hợp lệ cho {goods.GoodsName}"
                        };

                    if (string.IsNullOrWhiteSpace(itemRequest.DebitWarehouseId))
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "MISSING_WAREHOUSE",
                            StatusCode = 400,
                            Data = 0,
                            Message = $"Chưa chọn kho nhập cho {goods.GoodsName}"
                        };
                }

                // ── 2. Lấy voucher gốc từ DB ──
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

                // ── 3. Cập nhật header ──
                voucher.VoucherCode = request.VoucherCode;
                voucher.CustomerId = request.CustomerId;
                voucher.CustomerName = request.CustomerName;
                voucher.TaxCode = request.TaxCode;
                voucher.Address = request.Address;
                voucher.VoucherDescription = request.VoucherDescription;
                voucher.VoucherDate = request.VoucherDate;
                voucher.BankName = request.BankName;
                voucher.BankAccountNumber = request.BankAccountNumber;

                // ── 4. Xóa items cũ → thêm lại items mới ──
                voucher.VoucherDetails.Clear();

                foreach (var itemRequest in request.Items)
                {
                    voucher.VoucherDetails.Add(new VoucherDetail
                    {
                        GoodsId = itemRequest.GoodsId,
                        GoodsName = itemRequest.GoodsName,
                        Unit = itemRequest.Unit,
                        Quantity = itemRequest.Quantity,
                        UnitPrice = itemRequest.UnitPrice,
                        Amount1 = itemRequest.Amount1,
                        Vat = itemRequest.Vat,
                        Promotion = itemRequest.Promotion,
                        DebitAccount1 = itemRequest.DebitAccount1,
                        CreditAccount1 = itemRequest.CreditAccount1,
                        DebitWarehouseId = itemRequest.DebitWarehouseId,
                        DebitAccount2 = itemRequest.DebitAccount2,
                        CreditAccount2 = itemRequest.CreditAccount2,
                        UserId = itemRequest.UserId,
                        CreatedDateTime = itemRequest.CreatedDateTime,
                    });
                }

                // ── 5. Lưu ──
                await _inwardRepository.UpdateAsync(voucher);
                var affectedRows = await _unitOfWork.SaveChangesAsync();

                return new ResultModel<int>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = affectedRows,
                    Message = "Cập nhật phiếu nhập kho thành công"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode = 500,
                    Data = 0,
                    Message = ex.Message
                };
            }
        }

    }
}
