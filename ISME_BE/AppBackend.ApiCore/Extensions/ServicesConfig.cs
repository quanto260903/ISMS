using AppBackend.Repositories.Generic;
using AppBackend.Repositories.Repositories.CustomerRepo;
using AppBackend.Repositories.Repositories.ExportRepo;
using AppBackend.Repositories.Repositories.GoodsCategoryRepo;
using AppBackend.Repositories.Repositories.GoodsRepo;
using AppBackend.Repositories.Repositories.ImportRepo;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Repositories.Repositories.OpenInventoryRepo;
using AppBackend.Repositories.Repositories.StockTakeRepo;
using AppBackend.Repositories.Repositories.SupplierRepo;
using AppBackend.Repositories.Repositories.UserRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services;
using AppBackend.Services.RateLimiting;
using AppBackend.Services.Services.AuthServices;
using AppBackend.Services.Services.CustomerServices;
using AppBackend.Services.Services.Email;
using AppBackend.Services.Services.ExportServices;
using AppBackend.Services.Services.GoodsCategoryServices;
using AppBackend.Services.Services.GoodsServices;
using AppBackend.Services.Services.ImportServices;
using AppBackend.Services.Services.ItemServices;
using AppBackend.Services.Services.OpenInventoryServices;
using AppBackend.Services.Services.StockTakeServices;
using AppBackend.Services.Services.SupplierServices;
using AppBackend.Services.Services.UserServices;
using SWS.Repositories.UnitOfWork;

namespace AppBackend.Extensions;

public static class ServicesConfig
{
    public static IServiceCollection AddServicesConfig(this IServiceCollection services)
    {
        #region Generic Repository
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        #endregion

        #region Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ISaleGoodsRepository, SaleGoodsRepository>();
        services.AddScoped<IItemRepository, ItemRepository>();
        services.AddScoped<IImportRepository, ImportRepository>();
        services.AddScoped<IExportRepository, ExportRepository>();
        services.AddScoped<ISupplierRepository, SupplierRepository>();
        services.AddScoped<IGoodsCategoryRepository, GoodsCategoryRepository>();
        services.AddScoped<IGoodsRepository, GoodsRepository>();
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<IOpenInventoryRepository, OpenInventoryRepository>();
        services.AddScoped<IStockTakeVoucherRepository, StockTakeVoucherRepository>();
        services.AddScoped<IStockTakeDetailRepository, StockTakeDetailRepository>();
        #endregion

        #region Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ICloudinaryService, CloudinaryService>();
        services.AddSingleton<RateLimiterStore>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ISaleGoodsService, SaleGoodsService>();
        services.AddScoped<IItemService, ItemService>();
        services.AddScoped<IImportServices, ImportService>();
        services.AddScoped<IExportServices, ExportService>();
        services.AddScoped<ISupplierService, SupplierService>();
        services.AddScoped<IGoodsCategoryService, GoodsCategoryService>();
        services.AddScoped<IGoodsService, GoodsService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IOpenInventoryService, OpenInventoryService>();
        services.AddScoped<IStockTakeService, StockTakeService>();
        services.AddScoped<IResetPasswordTokenService, ResetPasswordTokenService>();
        #endregion
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        #region Helpers
        #endregion

        return services;
    }
}