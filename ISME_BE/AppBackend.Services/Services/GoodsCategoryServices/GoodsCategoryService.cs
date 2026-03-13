using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.GoodsCategoryRepo;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.GoodsCategoryServices
{
    public class GoodsCategoryService : IGoodsCategoryService
    {
        private readonly IGoodsCategoryRepository _repo;
    public GoodsCategoryService(IGoodsCategoryRepository repo) => _repo = repo;

    // ── Map ───────────────────────────────────────────────
    private static GoodsCategoryListDto MapToList(GoodsCategory g, int count) => new()
    {
        GoodsGroupId = g.GoodsGroupId,
        GoodsGroupName = g.GoodsGroupName,
        IsInactive = g.IsInactive,
        GoodsCount = count,
    };

    private static GoodsCategoryDetailDto MapToDetail(GoodsCategory g, int count = 0) => new()
    {
        GoodsGroupId = g.GoodsGroupId,
        GoodsGroupName = g.GoodsGroupName,
        IsInactive = g.IsInactive,
        GoodsCount = count,
    };

    // ── Danh sách ─────────────────────────────────────────
    public async Task<ResultModel<PagedResult<GoodsCategoryListDto>>> GetListAsync(
        GetGoodsCategoryListRequest request)
    {
        try
        {
            var (items, total) = await _repo.GetListAsync(request);

            // Đếm số hàng hóa cho từng nhóm
            var dtos = new List<GoodsCategoryListDto>();
            foreach (var item in items)
            {
                var count = await _repo.CountGoodsAsync(item.GoodsGroupId);
                dtos.Add(MapToList(item, count));
            }

            return Ok(new PagedResult<GoodsCategoryListDto>
            {
                Items = dtos,
                Total = total,
                Page = request.Page,
                PageSize = request.PageSize,
            }, "OK");
        }
        catch (Exception ex) { return Error<PagedResult<GoodsCategoryListDto>>(ex); }
    }

    // ── Chi tiết ──────────────────────────────────────────
    public async Task<ResultModel<GoodsCategoryDetailDto>> GetByIdAsync(string id)
    {
        try
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null)
                return Fail<GoodsCategoryDetailDto>(404, "NOT_FOUND",
                    $"Không tìm thấy nhóm hàng: {id}");

            var count = await _repo.CountGoodsAsync(id);
            return Ok(MapToDetail(entity, count), "OK");
        }
        catch (Exception ex) { return Error<GoodsCategoryDetailDto>(ex); }
    }

    // ── Tạo mới ───────────────────────────────────────────
    public async Task<ResultModel<GoodsCategoryDetailDto>> CreateAsync(
        CreateGoodsCategoryRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.GoodsGroupId))
                return Fail<GoodsCategoryDetailDto>(400, "MISSING_ID",
                    "Mã nhóm hàng không được để trống");

            if (string.IsNullOrWhiteSpace(request.GoodsGroupName))
                return Fail<GoodsCategoryDetailDto>(400, "MISSING_NAME",
                    "Tên nhóm hàng không được để trống");

            if (await _repo.ExistsAsync(request.GoodsGroupId.Trim().ToUpper()))
                return Fail<GoodsCategoryDetailDto>(409, "DUPLICATE_ID",
                    $"Mã nhóm '{request.GoodsGroupId}' đã tồn tại");

            var entity = new GoodsCategory
            {
                GoodsGroupId = request.GoodsGroupId.Trim().ToUpper(),
                GoodsGroupName = request.GoodsGroupName.Trim(),
                IsInactive = false,
            };

            await _repo.AddAsync(entity);
            await _repo.SaveChangesAsync();

            return new ResultModel<GoodsCategoryDetailDto>
            {
                IsSuccess = true,
                ResponseCode = "SUCCESS",
                StatusCode = 201,
                Data = MapToDetail(entity),
                Message = $"Tạo nhóm hàng '{entity.GoodsGroupName}' thành công",
            };
        }
        catch (Exception ex) { return Error<GoodsCategoryDetailDto>(ex); }
    }

    // ── Cập nhật ──────────────────────────────────────────
    public async Task<ResultModel<GoodsCategoryDetailDto>> UpdateAsync(
        string id, UpdateGoodsCategoryRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.GoodsGroupName))
                return Fail<GoodsCategoryDetailDto>(400, "MISSING_NAME",
                    "Tên nhóm hàng không được để trống");

            var entity = await _repo.GetByIdAsync(id);
            if (entity == null)
                return Fail<GoodsCategoryDetailDto>(404, "NOT_FOUND",
                    $"Không tìm thấy nhóm hàng: {id}");

            entity.GoodsGroupName = request.GoodsGroupName.Trim();
            await _repo.SaveChangesAsync();

            var count = await _repo.CountGoodsAsync(id);
            return Ok(MapToDetail(entity, count), "Cập nhật thành công");
        }
        catch (Exception ex) { return Error<GoodsCategoryDetailDto>(ex); }
    }

    // ── Đổi trạng thái ────────────────────────────────────
    public async Task<ResultModel<int>> UpdateStatusAsync(
        string id, UpdateGoodsCategoryStatusRequest request)
    {
        try
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null)
                return Fail<int>(404, "NOT_FOUND",
                    $"Không tìm thấy nhóm hàng: {id}");

            entity.IsInactive = request.IsInactive;
            var rows = await _repo.SaveChangesAsync();

            var action = request.IsInactive ? "vô hiệu hóa" : "kích hoạt";
            return Ok(rows, $"Đã {action} nhóm hàng '{entity.GoodsGroupName}'");
        }
        catch (Exception ex) { return Error<int>(ex); }
    }

    // ── Xóa ───────────────────────────────────────────────
    public async Task<ResultModel<int>> DeleteAsync(string id)
    {
        try
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null)
                return Fail<int>(404, "NOT_FOUND",
                    $"Không tìm thấy nhóm hàng: {id}");

            // Không cho xóa nếu có hàng hóa đang dùng nhóm này
            var count = await _repo.CountGoodsAsync(id);
            if (count > 0)
                return Fail<int>(409, "HAS_GOODS",
                    $"Nhóm hàng đang có {count} hàng hóa, không thể xóa. Hãy vô hiệu hóa thay vì xóa.");

            var rows = await _repo.DeleteAsync(id);
            return Ok(rows, $"Đã xóa nhóm hàng '{entity.GoodsGroupName}'");
        }
        catch (Exception ex) { return Error<int>(ex); }
    }

    // ── Result helpers ────────────────────────────────────
    private static ResultModel<T> Ok<T>(T data, string msg) => new()
    { IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200, Data = data, Message = msg };
    private static ResultModel<T> Fail<T>(int code, string rc, string msg) => new()
    { IsSuccess = false, ResponseCode = rc, StatusCode = code, Data = default, Message = msg };
    private static ResultModel<T> Error<T>(Exception ex) => new()
    { IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500, Data = default, Message = ex.Message };
}
}
