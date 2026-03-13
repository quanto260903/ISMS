using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.CustomerServices
{
    public interface ICustomerService
    {
        Task<ResultModel<PagedResult<CustomerListDto>>> GetListAsync(GetCustomerListRequest request);
        Task<ResultModel<CustomerDetailDto>> GetByIdAsync(string id);
        Task<ResultModel<List<CustomerSearchResult>>> SearchAsync(string keyword, int limit);
        Task<ResultModel<CustomerDetailDto>> CreateAsync(CreateCustomerRequest request);
        Task<ResultModel<CustomerDetailDto>> UpdateAsync(string id, UpdateCustomerRequest request);
        Task<ResultModel<int>> UpdateStatusAsync(string id, bool isInactive);
        Task<ResultModel<int>> DeleteAsync(string id);
    }
}
