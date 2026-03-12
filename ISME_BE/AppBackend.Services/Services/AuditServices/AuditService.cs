using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.AuditRepo;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.AuditServices
{
    public class AuditService : IAuditService
    {
        private readonly IAuditRepository _repo;
        private readonly IItemRepository _itemRepo;
        private readonly IUnitOfWork _unitOfWork;

        public AuditService(
            IAuditRepository repo,
            IItemRepository itemRepo,
            IUnitOfWork unitOfWork)
        {
            _repo = repo;
            _itemRepo = itemRepo;
            _unitOfWork = unitOfWork;
        }

        // ── Validate items ────────────────────────────────────────────────
        private async Task<ResultModel<int>?> ValidateItems(
            List<CreateAuditItemRequest> items)
        {
            if (items == null || items.Count == 0)
                return Fail(400, "NO_ITEMS", "Phiếu kiểm kê phải có ít nhất 1 hàng hóa");

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.GoodsId))
                    return Fail(400, "MISSING_GOODS", "Mã hàng hóa không được để trống");

                var goods = await _itemRepo.GetByIdAsync(item.GoodsId);
                if (goods == null)
                    return Fail(404, "GOODS_NOT_FOUND",
                        $"Không tìm thấy hàng hóa: {item.GoodsId}");

                if (item.ActualQuantity is null || item.ActualQuantity < 0)
                    return Fail(400, "INVALID_ACTUAL",
                        $"Số lượng thực tế không hợp lệ cho: {goods.GoodsName}");
            }
            return null;
        }

        // ── Map request → Voucher entity ─────────────────────────────────
        private static Voucher MapToVoucher(CreateAuditRequest request, string userId)
        {
            // AuditType lưu vào VoucherCode: KK-FULL hoặc KK-PARTIAL
            var voucherCode = $"KK-{request.AuditType ?? "PARTIAL"}";

            var voucher = new Voucher
            {
                VoucherId = request.VoucherId,
                VoucherCode = voucherCode,
                CustomerId = request.WarehouseId,    // Kho → CustomerId
                CustomerName = request.AuditType,      // AuditType → CustomerName
                VoucherDescription = request.Description,
                VoucherDate = request.AuditDate.HasValue
                                        ? DateOnly.FromDateTime(request.AuditDate.Value)
                                        : DateOnly.FromDateTime(DateTime.Today),
                // UserId không có ở Voucher header — lưu ở từng VoucherDetail
                VoucherDetails = new List<VoucherDetail>(),
            };

            foreach (var item in request.Items)
            {
                var diff = (item.ActualQuantity ?? 0) - (item.StockQuantity ?? 0);
                var reason = diff == 0 ? "Khớp tồn kho"
                           : diff > 0 ? "Thừa so với sổ sách"
                           : "Thiếu so với sổ sách";
                var action = diff == 0 ? "Khớp"
                           : diff > 0 ? "Nhập kho"
                           : "Xuất kho";

                voucher.VoucherDetails.Add(new VoucherDetail
                {
                    GoodsId = item.GoodsId,
                    GoodsName = item.GoodsName,
                    Unit = item.Unit,
                    Quantity = (int?)item.StockQuantity,   // SL tồn kho
                    UnitPrice = item.ActualQuantity,         // SL thực tế
                    Amount1 = diff,                        // Chênh lệch
                    DebitAccount1 = diff > 0 ? "156" : "632",
                    CreditAccount1 = diff > 0 ? "3381" : "156",                      // Xử lý
                    DebitWarehouseId = request.WarehouseId,         // Kho kiểm
                    UserId = userId,                      // Tự điền từ JWT
                    CreatedDateTime = DateTime.Now,
                });
            }

            return voucher;
        }

        // ── Map Voucher entity → DTO ──────────────────────────────────────
        private static AuditVoucherDto MapToDto(Voucher v)
        {
            // VoucherCode dạng "KK-FULL" → tách lấy AuditType
            var auditType = v.VoucherCode?.Replace("KK-", "") ?? "PARTIAL";

            return new AuditVoucherDto
            {
                VoucherId = v.VoucherId,
                WarehouseId = v.CustomerId,
                AuditType = auditType,
                Description = v.VoucherDescription,
                AuditDate = v.VoucherDate.HasValue
                                ? v.VoucherDate.Value.ToDateTime(TimeOnly.MinValue)
                                : null,
                CreatedBy = v.VoucherDetails.FirstOrDefault()?.UserId, // UserId ở VoucherDetail
                Items = v.VoucherDetails.Select(d => new AuditItemDto
                {
                    GoodsId = d.GoodsId,
                    GoodsName = d.GoodsName,
                    Unit = d.Unit,
                    StockQuantity = d.Quantity,        // SL tồn kho
                    ActualQuantity = d.UnitPrice,       // SL thực tế
                    Difference = d.Amount1,         // Chênh lệch
                    Reason = d.DebitAccount1,   // Nguyên nhân
                    Action = d.CreditAccount1,  // Xử lý
                }).ToList(),
            };
        }

        // ── Tạo mới phiếu kiểm kê ────────────────────────────────────────
        public async Task<ResultModel<int>> CreateAsync(
            CreateAuditRequest request, string userId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.VoucherId))
                    return Fail(400, "MISSING_ID", "Số phiếu không được để trống");

                if (string.IsNullOrWhiteSpace(request.WarehouseId))
                    return Fail(400, "MISSING_WAREHOUSE", "Vui lòng chọn kho kiểm kê");

                var validErr = await ValidateItems(request.Items);
                if (validErr != null) return validErr;

                var voucher = MapToVoucher(request, userId);
                await _repo.AddAsync(voucher);
                var rows = await _unitOfWork.SaveChangesAsync();

                return Ok(rows, "Tạo phiếu kiểm kê thành công");
            }
            catch (Exception ex) { return Error(ex); }
        }

        // ── Cập nhật phiếu kiểm kê ───────────────────────────────────────
        public async Task<ResultModel<int>> UpdateAsync(
            CreateAuditRequest request, string userId)
        {
            try
            {
                var existing = await _repo.GetByIdAsync(request.VoucherId);
                if (existing == null)
                    return Fail(404, "NOT_FOUND",
                        $"Không tìm thấy phiếu kiểm kê: {request.VoucherId}");

                if (string.IsNullOrWhiteSpace(request.WarehouseId))
                    return Fail(400, "MISSING_WAREHOUSE", "Vui lòng chọn kho kiểm kê");

                var validErr = await ValidateItems(request.Items);
                if (validErr != null) return validErr;

                // Cập nhật header
                existing.VoucherCode = $"KK-{request.AuditType ?? "PARTIAL"}";
                existing.CustomerId = request.WarehouseId;
                existing.CustomerName = request.AuditType;
                existing.VoucherDescription = request.Description;
                existing.VoucherDate = request.AuditDate.HasValue
                                                ? DateOnly.FromDateTime(request.AuditDate.Value)
                                                : existing.VoucherDate;
                // UserId không có ở Voucher header

                // Thay toàn bộ items
                existing.VoucherDetails.Clear();
                foreach (var item in request.Items)
                {
                    var diff = (item.ActualQuantity ?? 0) - (item.StockQuantity ?? 0);
                    var reason = diff == 0 ? "Khớp tồn kho"
                               : diff > 0 ? "Thừa so với sổ sách"
                               : "Thiếu so với sổ sách";
                    var action = diff == 0 ? "Khớp"
                               : diff > 0 ? "Nhập kho"
                               : "Xuất kho";

                    existing.VoucherDetails.Add(new VoucherDetail
                    {
                        GoodsId = item.GoodsId,
                        GoodsName = item.GoodsName,
                        Unit = item.Unit,
                        Quantity = (int?)item.StockQuantity,
                        UnitPrice = item.ActualQuantity,
                        Amount1 = diff,
                        DebitAccount1 = reason,
                        CreditAccount1 = action,
                        DebitWarehouseId = request.WarehouseId,
                        UserId = userId,               // Tự điền từ JWT
                        CreatedDateTime = DateTime.Now,
                    });
                }

                await _repo.UpdateAsync(existing);
                var rows = await _unitOfWork.SaveChangesAsync();

                return Ok(rows, "Cập nhật phiếu kiểm kê thành công");
            }
            catch (Exception ex) { return Error(ex); }
        }

        // ── Lấy chi tiết 1 phiếu ─────────────────────────────────────────
        public async Task<ResultModel<AuditVoucherDto>> GetByIdAsync(string voucherId)
        {
            try
            {
                var voucher = await _repo.GetByIdAsync(voucherId);
                if (voucher == null)
                    return new ResultModel<AuditVoucherDto>
                    {
                        IsSuccess = false,
                        ResponseCode = "NOT_FOUND",
                        StatusCode = 404,
                        Data = null,
                        Message = $"Không tìm thấy phiếu kiểm kê: {voucherId}",
                    };

                return new ResultModel<AuditVoucherDto>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = MapToDto(voucher),
                    Message = "OK",
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<AuditVoucherDto>
                {
                    IsSuccess = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode = 500,
                    Data = null,
                    Message = ex.Message,
                };
            }
        }

        // ── Danh sách phiếu kiểm kê ──────────────────────────────────────
        public async Task<ResultModel<PagedResult<AuditListDto>>> GetListAsync(
            GetAuditListRequest request)
        {
            try
            {
                // Default: tháng hiện tại
                if (!request.FromDate.HasValue)
                    request.FromDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
                if (!request.ToDate.HasValue)
                    request.ToDate = DateTime.Today;

                var (items, total) = await _repo.GetListAsync(request);

                var dtos = items.Select(v =>
                {
                    var auditType = v.VoucherCode?.Replace("KK-", "") ?? "PARTIAL";
                    return new AuditListDto
                    {
                        VoucherId = v.VoucherId,
                        AuditType = auditType,
                        Description = v.VoucherDescription,
                        AuditDate = v.VoucherDate.HasValue
                                         ? v.VoucherDate.Value.ToDateTime(TimeOnly.MinValue)
                                         : null,
                        CreatedBy = v.VoucherDetails.FirstOrDefault()?.UserId,
                        WarehouseId = v.CustomerId,
                        ItemCount = v.VoucherDetails.Count,
                        MatchCount = v.VoucherDetails.Count(d => d.Amount1 == 0),
                        SurplusCount = v.VoucherDetails.Count(d => d.Amount1 > 0),
                        DeficitCount = v.VoucherDetails.Count(d => d.Amount1 < 0),
                    };
                }).ToList();

                return new ResultModel<PagedResult<AuditListDto>>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = new PagedResult<AuditListDto>
                    {
                        Items = dtos,
                        Total = total,
                        Page = request.Page,
                        PageSize = request.PageSize,
                    },
                    Message = "OK",
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<PagedResult<AuditListDto>>
                {
                    IsSuccess = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode = 500,
                    Data = new PagedResult<AuditListDto>(),
                    Message = ex.Message,
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
