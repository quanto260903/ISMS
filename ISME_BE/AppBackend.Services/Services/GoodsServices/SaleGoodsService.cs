using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.ExportRepo;
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
        private readonly IExportRepository _exportRepository;
        private readonly IUnitOfWork _unitOfWork;

        public SaleGoodsService(
            ISaleGoodsRepository saleRepository,
            IItemRepository itemRepository,
            IExportRepository exportRepository,
            IUnitOfWork unitOfWork)
        {
            _saleRepository = saleRepository;
            _itemRepository = itemRepository;
            _exportRepository = exportRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ResultModel<int>> CreateSaleAsync(CreateSaleRequest request, string userId)
        {
            await using var tx = await _unitOfWork.BeginTransactionAsync();
            try
            {
                // ── 1. Validate tồn kho ──────────────────────────────────
                foreach (var itemRequest in request.Items)
                {
                    var item = await _itemRepository.GetByIdAsync(itemRequest.GoodsId);
                    if (item == null)
                        return new ResultModel<int> { IsSuccess = false, ResponseCode = "ITEM_NOT_FOUND", StatusCode = 404, Data = 0, Message = "Item not found" };

                    int currentOnHand = item.ItemOnHand ?? 0;
                    if (currentOnHand <= 0)
                        return new ResultModel<int> { IsSuccess = false, ResponseCode = "OUT_OF_STOCK", StatusCode = 400, Data = 0, Message = $"Item {item.GoodsName} is out of stock" };

                    if (currentOnHand < itemRequest.Quantity)
                        return new ResultModel<int> { IsSuccess = false, ResponseCode = "NOT_ENOUGH_STOCK", StatusCode = 400, Data = 0, Message = $"Not enough stock for {item.GoodsName}" };
                }

                // ── 2. Tạo phiếu bán hàng (BH) ──────────────────────────
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
                await _unitOfWork.SaveChangesAsync();

                // ── 3. Tạo phiếu xuất kho tự động (XK4) ─────────────────
                // XK4 = xuất kho phát sinh từ bán hàng (hệ thống tự sinh)
                var exportId = await _exportRepository.GenerateVoucherIdAsync();
                var exportVoucher = new Voucher
                {
                    VoucherId = exportId,
                    VoucherCode = "XK4",
                    CustomerId = request.CustomerId,
                    CustomerName = request.CustomerName,
                    TaxCode = request.TaxCode,
                    Address = request.Address,
                    VoucherDescription = $"Xuất kho theo phiếu bán {request.VoucherId}",
                    VoucherDate = request.VoucherDate,
                    VoucherDetails = new List<VoucherDetail>()
                };

                foreach (var itemRequest in request.Items)
                {
                    exportVoucher.VoucherDetails.Add(new VoucherDetail
                    {
                        VoucherId = exportId,
                        GoodsId = itemRequest.GoodsId,
                        GoodsName = itemRequest.GoodsName,
                        Unit = itemRequest.Unit,
                        Quantity = itemRequest.Quantity,
                        UnitPrice = itemRequest.UnitPrice,
                        // Amount1 = giá vốn (Amount2 từ phiếu bán)
                        Amount1 = itemRequest.Amount2,
                        // Tài khoản giá vốn: Nợ 632 / Có 156
                        DebitAccount1 = itemRequest.DebitAccount2,
                        CreditAccount1 = itemRequest.CreditAccount2,
                        // OffsetVoucher = phiếu nhập kho nguồn (NK...) — giống XK1/XK2
                        OffsetVoucher = itemRequest.OffsetVoucher,
                        UserId = userId,
                        CreatedDateTime = DateTime.UtcNow,
                    });
                }

                await _exportRepository.AddAsync(exportVoucher);
                await _unitOfWork.SaveChangesAsync();

                // ── 4. Trừ tồn kho ───────────────────────────────────────
                foreach (var itemRequest in request.Items)
                    await _exportRepository.DeductStockAsync(itemRequest.GoodsId!, itemRequest.Quantity!.Value);

                var affectedRows = await _unitOfWork.SaveChangesAsync();
                await tx.CommitAsync();

                return new ResultModel<int>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = affectedRows,
                    Message = $"Tạo phiếu bán thành công. Phiếu xuất kho {exportId} đã được tạo tự động."
                };
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
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
                    VoucherCode = voucher.VoucherCode,
                    CustomerId = voucher.CustomerId,
                    CustomerName = voucher.CustomerName,
                    TaxCode = voucher.TaxCode,
                    Address = voucher.Address,
                    VoucherDescription = voucher.VoucherDescription,
                    VoucherDate = voucher.VoucherDate,
                    BankName = voucher.BankName,
                    BankAccountNumber = voucher.BankAccountNumber,
                    Items = voucher.VoucherDetails.Select(d => new SaleVoucherDetailDto
                    {
                        GoodsId = d.GoodsId,
                        GoodsName = d.GoodsName,
                        Unit = d.Unit,
                        Quantity = d.Quantity,
                        UnitPrice = d.UnitPrice,
                        Amount1 = d.Amount1,
                        Amount2 = d.Amount2,
                        Promotion = d.Promotion,
                        DebitAccount1 = d.DebitAccount1,
                        CreditAccount1 = d.CreditAccount1,
                        DebitAccount2 = d.DebitAccount2,
                        CreditAccount2 = d.CreditAccount2,
                        OffsetVoucher = d.OffsetVoucher,
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

        public async Task<ResultModel<SaleListResult>> GetListAsync(DateOnly? fromDate, DateOnly? toDate, string? keyword, int page, int pageSize)
        {
            try
            {
                var result = await _saleRepository.GetListAsync(fromDate, toDate, keyword, page, pageSize);
                return new ResultModel<SaleListResult>
                {
                    IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200,
                    Data = result, Message = "OK"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<SaleListResult>
                {
                    IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500,
                    Data = null, Message = ex.Message
                };
            }
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
