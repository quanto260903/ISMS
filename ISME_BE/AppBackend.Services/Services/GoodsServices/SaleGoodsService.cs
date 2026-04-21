using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.GoodsRepo;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.GoodsServices
{
    public class SaleGoodsService : ISaleGoodsService
    {
        private readonly ISaleGoodsRepository _saleRepository;
        private readonly IItemRepository _itemRepository;
        private readonly IUnitOfWork _unitOfWork;

        public SaleGoodsService(
            ISaleGoodsRepository saleRepository,
            IItemRepository itemRepository,
            IUnitOfWork unitOfWork)
        {
            _saleRepository = saleRepository;
            _itemRepository = itemRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ResultModel<int>> CreateSaleAsync(CreateSaleRequest request, string userId)
        {
            try
            {
                var sale = new Voucher
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

                foreach (var itemRequest in request.Items)
                {
                    var item = await _itemRepository.GetByIdAsync(itemRequest.GoodsId);

                    if (item == null)
                    {
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "ITEM_NOT_FOUND",
                            StatusCode = 404,
                            Data = 0,
                            Message = "Item not found"
                        };
                    }

                    int currentOnHand = item.ItemOnHand ?? 0;

                    if (currentOnHand <= 0)
                    {
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "OUT_OF_STOCK",
                            StatusCode = 400,
                            Data = 0,
                            Message = $"Item {item.GoodsName} is out of stock"
                        };
                    }

                    if (currentOnHand < itemRequest.Quantity)
                    {
                        return new ResultModel<int>
                        {
                            IsSuccess = false,
                            ResponseCode = "NOT_ENOUGH_STOCK",
                            StatusCode = 400,
                            Data = 0,
                            Message = $"Not enough stock for {item.GoodsName}"
                        };
                    }

                    sale.VoucherDetails.Add(new VoucherDetail
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
                        Amount2 = itemRequest.Amount2,
                        Promotion = itemRequest.Promotion,
                        OffsetVoucher = itemRequest.OffsetVoucher,
                        UserId = itemRequest.UserId,
                        CreatedDateTime = itemRequest.CreatedDateTime,
                    });
                }

                await _saleRepository.AddAsync(sale);
                var affectedRows = await _unitOfWork.SaveChangesAsync();

                return new ResultModel<int>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = affectedRows,
                    Message = "Sale created successfully"
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

        public async Task<ResultModel<SaleVoucherLookupDto>> GetByVoucherIdAsync(string voucherId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(voucherId))
                    return new ResultModel<SaleVoucherLookupDto>
                    {
                        IsSuccess = false,
                        ResponseCode = "INVALID_ID",
                        StatusCode = 400,
                        Data = null,
                        Message = "Số phiếu không được để trống"
                    };

                var voucher = await _saleRepository.GetByVoucherIdAsync(voucherId.Trim());

                if (voucher == null)
                    return new ResultModel<SaleVoucherLookupDto>
                    {
                        IsSuccess = false,
                        ResponseCode = "NOT_FOUND",
                        StatusCode = 404,
                        Data = null,
                        Message = $"Không tìm thấy phiếu bán: {voucherId}"
                    };

                var dto = new SaleVoucherLookupDto
                {
                    VoucherId = voucher.VoucherId,
                    CustomerName = voucher.CustomerName,
                    VoucherDate = voucher.VoucherDate,
                    Items = voucher.VoucherDetails.Select(d => new SaleVoucherDetailDto
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
                    }).ToList()
                };

                return new ResultModel<SaleVoucherLookupDto>
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
                return new ResultModel<SaleVoucherLookupDto>
                {
                    IsSuccess = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode = 500,
                    Data = null,
                    Message = ex.Message
                };
            }
        }

        public async Task<bool> CheckSaleUsedForReturnAsync(string saleVoucherId)
        {
            return await _saleRepository.IsUsedForNk2ReturnAsync(saleVoucherId);
        }

        public async Task<ResultModel<List<SaleSearchResult>>> SearchSaleVouchersAsync(string keyword, int limit)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(keyword))
                    return new ResultModel<List<SaleSearchResult>>
                    {
                        IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200,
                        Data = new List<SaleSearchResult>(), Message = "OK"
                    };

                var results = await _saleRepository.SearchAsync(keyword, limit);
                return new ResultModel<List<SaleSearchResult>>
                {
                    IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200,
                    Data = results, Message = "OK"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<List<SaleSearchResult>>
                {
                    IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500,
                    Data = new List<SaleSearchResult>(), Message = ex.Message
                };
            }
        }
    }
}
