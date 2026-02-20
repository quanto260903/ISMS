using AppBackend.BusinessObjects.Dtos.PayOs;
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
                        CreditWarehouseId = itemRequest.CreditWarehouseId,
                        DebitAccount2 = itemRequest.DebitAccount2,
                        CreditAccount2 = itemRequest.CreditAccount2,
                        Amount2 = itemRequest.Amount2,
                        Promotion = itemRequest.Promotion,
                        Vat = itemRequest.Vat,
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
    }
}
