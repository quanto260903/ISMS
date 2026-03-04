using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.ImportServices
{
    public interface IImportServices
    {
        Task<ResultModel<int>> CreateInwardAsync(ImportOrder request, string userId);
    }
}
