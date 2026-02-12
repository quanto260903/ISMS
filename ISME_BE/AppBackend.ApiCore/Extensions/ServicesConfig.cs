using AppBackend.Repositories.Generic;
using AppBackend.Repositories.Repositories.UserRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services;
using AppBackend.Services.RateLimiting;
using AppBackend.Services.Services.Email;
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
        #endregion

        #region Services
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ICloudinaryService, CloudinaryService>();
        services.AddSingleton<RateLimiterStore>();
        services.AddScoped<IUserService, UserService>();
        #endregion
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        #region Helpers
        #endregion

        return services;
    }
}