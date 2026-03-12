using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.AuditServices
{
    public interface IAuditService
    {
        Task<ResultModel<int>> CreateAsync(CreateAuditRequest request, string userId);
        Task<ResultModel<int>> UpdateAsync(CreateAuditRequest request, string userId);
        Task<ResultModel<AuditVoucherDto>> GetByIdAsync(string voucherId);
        Task<ResultModel<PagedResult<AuditListDto>>> GetListAsync(GetAuditListRequest request);
    }
}
