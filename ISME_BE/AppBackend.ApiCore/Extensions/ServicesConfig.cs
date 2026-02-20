using AppBackend.Repositories.Generic;
using AppBackend.Repositories.Repositories.GoodsRepo;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Repositories.Repositories.UserRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services;
using AppBackend.Services.RateLimiting;
using AppBackend.Services.Services.Email;
using AppBackend.Services.Services.GoodsServices;
using AppBackend.Services.Services.ItemServices;
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
        #endregion

        #region Services
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ICloudinaryService, CloudinaryService>();
        services.AddSingleton<RateLimiterStore>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ISaleGoodsService, SaleGoodsService>();
        services.AddScoped<IItemService, ItemService>();
        #endregion
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        #region Helpers
        #endregion

        return services;
    }
}