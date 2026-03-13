using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.CustomerRepo;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.CustomerServices
{
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _repo;
        public CustomerService(ICustomerRepository repo) => _repo = repo;

        private static CustomerListDto MapToList(Customer c) => new()
        {
            CustomerId = c.CustomerId,
            CustomerName = c.CustomerName,
            Phone = c.Phone,
            TaxId = c.TaxId,
            Address = c.Address,
            IsEnterprise = c.IsEnterprise ?? false,
            IsInactive = c.IsInactive,
        };

        private static CustomerDetailDto MapToDetail(Customer c) => new()
        {
            CustomerId = c.CustomerId,
            CustomerName = c.CustomerName,
            Phone = c.Phone,
            TaxId = c.TaxId,
            Address = c.Address,
            IsEnterprise = c.IsEnterprise ?? false,
            IsInactive = c.IsInactive,
        };

        public async Task<ResultModel<PagedResult<CustomerListDto>>> GetListAsync(
            GetCustomerListRequest request)
        {
            try
            {
                var (items, total) = await _repo.GetListAsync(request);
                return Ok(new PagedResult<CustomerListDto>
                {
                    Items = items.Select(MapToList).ToList(),
                    Total = total,
                    Page = request.Page,
                    PageSize = request.PageSize,
                }, "OK");
            }
            catch (Exception ex) { return Error<PagedResult<CustomerListDto>>(ex); }
        }

        public async Task<ResultModel<CustomerDetailDto>> GetByIdAsync(string id)
        {
            try
            {
                var c = await _repo.GetByIdAsync(id);
                if (c == null)
                    return Fail<CustomerDetailDto>(404, "NOT_FOUND",
                        $"Không tìm thấy khách hàng: {id}");
                return Ok(MapToDetail(c), "OK");
            }
            catch (Exception ex) { return Error<CustomerDetailDto>(ex); }
        }

        public async Task<ResultModel<List<CustomerSearchResult>>> SearchAsync(
            string keyword, int limit)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(keyword))
                    return Ok(new List<CustomerSearchResult>(), "Keyword rỗng");
                var data = await _repo.SearchAsync(keyword.Trim(), limit);
                return Ok(data, $"Tìm thấy {data.Count} khách hàng");
            }
            catch (Exception ex) { return Error<List<CustomerSearchResult>>(ex); }
        }

        public async Task<ResultModel<CustomerDetailDto>> CreateAsync(
            CreateCustomerRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.CustomerId))
                    return Fail<CustomerDetailDto>(400, "MISSING_ID",
                        "Mã khách hàng không được để trống");

                if (string.IsNullOrWhiteSpace(request.CustomerName))
                    return Fail<CustomerDetailDto>(400, "MISSING_NAME",
                        "Tên khách hàng không được để trống");

                var newId = request.CustomerId.Trim().ToUpper();
                if (await _repo.ExistsAsync(newId))
                    return Fail<CustomerDetailDto>(409, "DUPLICATE_ID",
                        $"Mã '{newId}' đã tồn tại");

                var entity = new Customer
                {
                    CustomerId = newId,
                    CustomerName = request.CustomerName.Trim(),
                    Phone = request.Phone?.Trim(),
                    TaxId = request.TaxId?.Trim(),
                    Address = request.Address?.Trim(),
                    IsCustomer = true,
                    IsVendor = false,
                    IsEnterprise = request.IsEnterprise,
                    IsInactive = false,
                };

                await _repo.AddAsync(entity);
                await _repo.SaveChangesAsync();

                return new ResultModel<CustomerDetailDto>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 201,
                    Data = MapToDetail(entity),
                    Message = $"Tạo khách hàng '{entity.CustomerName}' thành công",
                };
            }
            catch (Exception ex) { return Error<CustomerDetailDto>(ex); }
        }

        public async Task<ResultModel<CustomerDetailDto>> UpdateAsync(
            string id, UpdateCustomerRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.CustomerName))
                    return Fail<CustomerDetailDto>(400, "MISSING_NAME",
                        "Tên khách hàng không được để trống");

                var entity = await _repo.GetByIdAsync(id);
                if (entity == null)
                    return Fail<CustomerDetailDto>(404, "NOT_FOUND",
                        $"Không tìm thấy khách hàng: {id}");

                entity.CustomerName = request.CustomerName.Trim();
                entity.Phone = request.Phone?.Trim();
                entity.TaxId = request.TaxId?.Trim();
                entity.Address = request.Address?.Trim();
                entity.IsEnterprise = request.IsEnterprise;

                await _repo.SaveChangesAsync();
                return Ok(MapToDetail(entity), "Cập nhật thành công");
            }
            catch (Exception ex) { return Error<CustomerDetailDto>(ex); }
        }

        public async Task<ResultModel<int>> UpdateStatusAsync(string id, bool isInactive)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null)
                    return Fail<int>(404, "NOT_FOUND",
                        $"Không tìm thấy khách hàng: {id}");

                entity.IsInactive = isInactive;
                var rows = await _repo.SaveChangesAsync();
                var action = isInactive ? "khóa" : "kích hoạt";
                return Ok(rows, $"Đã {action} khách hàng '{entity.CustomerName}'");
            }
            catch (Exception ex) { return Error<int>(ex); }
        }

        public async Task<ResultModel<int>> DeleteAsync(string id)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null)
                    return Fail<int>(404, "NOT_FOUND",
                        $"Không tìm thấy khách hàng: {id}");

                var rows = await _repo.DeleteAsync(id);
                return Ok(rows, $"Đã xóa khách hàng '{entity.CustomerName}'");
            }
            catch (Exception ex) { return Error<int>(ex); }
        }

        private static ResultModel<T> Ok<T>(T data, string msg) => new()
        { IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200, Data = data, Message = msg };
        private static ResultModel<T> Fail<T>(int code, string rc, string msg) => new()
        { IsSuccess = false, ResponseCode = rc, StatusCode = code, Data = default, Message = msg };
        private static ResultModel<T> Error<T>(Exception ex) => new()
        { IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500, Data = default, Message = ex.Message };
    }
}
