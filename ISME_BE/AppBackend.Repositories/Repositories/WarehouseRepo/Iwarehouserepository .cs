using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.WarehouseRepo
{
    public interface IWarehouseRepository
    {
        Task<IEnumerable<Warehouse>> GetAllActiveAsync();
    }
}
