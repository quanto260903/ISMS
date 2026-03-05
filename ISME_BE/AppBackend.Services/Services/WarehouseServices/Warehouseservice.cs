using AppBackend.BusinessObjects.Dtos;
using AppBackend.Repositories.Repositories.WarehouseRepo;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.WarehouseServices
{
    public class WarehouseService : IWarehouseService
    {
        private readonly IWarehouseRepository _warehouseRepository;

        public WarehouseService(IWarehouseRepository warehouseRepository)
        {
            _warehouseRepository = warehouseRepository;
        }

        public async Task<ResultModel<IEnumerable<WarehouseDto>>> GetAllActiveAsync()
        {
            try
            {
                var warehouses = await _warehouseRepository.GetAllActiveAsync();

                var data = warehouses.Select(w => new WarehouseDto
                {
                    WarehouseId = w.WarehouseId,
                    WarehouseName = w.WarehouseName,
                    Address = w.Address,
                });

                return new ResultModel<IEnumerable<WarehouseDto>>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = data,
                    Message = "OK"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<IEnumerable<WarehouseDto>>
                {
                    IsSuccess = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode = 500,
                    Data = Enumerable.Empty<WarehouseDto>(),
                    Message = ex.Message
                };
            }
        }
    }
}
