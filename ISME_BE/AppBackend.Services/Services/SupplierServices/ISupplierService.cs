using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.SupplierServices
{
    public interface ISupplierService
    {
        Task<ResultModel<List<SupplierSearchResult>>> SearchAsync(string keyword, int limit);
        Task<ResultModel<PagedResult<SupplierListDto>>> GetListAsync(GetSupplierListRequest request);
        Task<ResultModel<SupplierDetailDto>> GetByIdAsync(string id);
        Task<ResultModel<SupplierDetailDto>> CreateAsync(CreateSupplierRequest request);
        Task<ResultModel<SupplierDetailDto>> UpdateAsync(string id, UpdateSupplierRequest request);
        Task<ResultModel<int>> UpdateStatusAsync(string id, bool isInactive);
        Task<ResultModel<int>> DeleteAsync(string id);
    }
}
