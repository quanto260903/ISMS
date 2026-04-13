using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using AppBackend.Services.ApiModels.Auth;
using System;
using System.Collections.Generic;
using System.Drawing.Drawing2D;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.AuthServices
{
    public interface IAuthService
    {
        Task<ResultModel<AuthData>> LoginAsync(AuthLoginRequest request);
        Task<ResultModel<AuthData>> RegisterAsync(AuthRegisterRequest request);
        Task<ResultModel<UserDto>> GetMeAsync(string userId);

        Task SendLinkResetPassword(string email);

        Task ResetPasswordAsync(ResetPasswordRequestDto request);
    }
}
