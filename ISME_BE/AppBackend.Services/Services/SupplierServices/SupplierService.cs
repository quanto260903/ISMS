using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.SupplierRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.SupplierServices
{
    public class SupplierService : ISupplierService
    {
        private readonly ISupplierRepository _repo;
        private readonly IUnitOfWork _unitOfWork;

        public SupplierService(ISupplierRepository repo, IUnitOfWork unitOfWork)
        {
            _repo = repo;
            _unitOfWork = unitOfWork;
        }

        public async Task<ResultModel<List<SupplierSearchResult>>> SearchAsync(
            string keyword, int limit = 10)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return new ResultModel<List<SupplierSearchResult>>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = new List<SupplierSearchResult>(),
                    Message = "Keyword rỗng",
                };

            var data = await _repo.SearchAsync(keyword.Trim(), limit);
            return new ResultModel<List<SupplierSearchResult>>
            {
                IsSuccess = true,
                ResponseCode = "SUCCESS",
                StatusCode = 200,
                Data = data,
                Message = $"Tìm thấy {data.Count} nhà cung cấp",
            };
        }

        public async Task<ResultModel<SupplierSearchResult>> CreateAsync(
            CreateSupplierRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SupplierId))
                return Fail(400, "MISSING_ID", "Mã nhà cung cấp không được rỗng");

            if (string.IsNullOrWhiteSpace(request.SupplierName))
                return Fail(400, "MISSING_NAME", "Tên nhà cung cấp không được rỗng");

            if (await _repo.ExistsAsync(request.SupplierId.Trim()))
                return Fail(409, "DUPLICATE_ID", $"Mã \"{request.SupplierId}\" đã tồn tại");

            var supplier = new Customer
            {
                CustomerId = request.SupplierId.Trim(),
                CustomerName = request.SupplierName.Trim(),
                TaxId = request.TaxId?.Trim(),
                Address = request.Address?.Trim(),
                Phone = request.Phone?.Trim(),
                IsVendor = true,    // đánh dấu là nhà cung cấp
                IsCustomer = false,
                IsInactive = false,
            };

            await _repo.AddAsync(supplier);
            await _unitOfWork.SaveChangesAsync();

            return new ResultModel<SupplierSearchResult>
            {
                IsSuccess = true,
                ResponseCode = "CREATED",
                StatusCode = 201,
                Data = new SupplierSearchResult
                {
                    SupplierId = supplier.CustomerId,
                    SupplierName = supplier.CustomerName,
                    TaxId = supplier.TaxId,
                    Address = supplier.Address,
                    Phone = supplier.Phone,
                },
                Message = "Tạo nhà cung cấp thành công",
            };
        }

        private static ResultModel<SupplierSearchResult> Fail(
            int code, string respCode, string msg) =>
            new()
            {
                IsSuccess = false,
                ResponseCode = respCode,
                StatusCode = code,
                Data = null,
                Message = msg,
            };
    }
}
