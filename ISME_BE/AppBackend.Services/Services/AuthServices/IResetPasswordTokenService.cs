using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppBackend.BusinessObjects.Models;

namespace AppBackend.Services.Services.AuthServices
{
    public interface IResetPasswordTokenService
    {
        string GenerateToken(User user);
        Task<(bool IsValid, User? User, string Message)> ValidateTokenAsync(string token);
    }
}
