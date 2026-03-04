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

                    if (string.IsNullOrWhiteSpace(itemRequest.DebitWarehouseId))
                    {
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "MISSING_WAREHOUSE",
                            StatusCode = 400,
                            Data = 0,
                            Message = $"Chưa chọn kho nhập cho {goods.GoodsName}"
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
    }
}
