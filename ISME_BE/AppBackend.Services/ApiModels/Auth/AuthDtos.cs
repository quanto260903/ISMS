using AppBackend.BusinessObjects.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.ApiModels.Auth
{
    public class AuthData
    {
        public UserDto User { get; set; } = null!;
        public string Token { get; set; } = null!;
    }

    // Đổi tên tránh trùng với Microsoft.AspNetCore.Identity.Data.LoginRequest
    public class AuthLoginRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    // Đổi tên tránh trùng với Microsoft.AspNetCore.Identity.Data.RegisterRequest
    public class AuthRegisterRequest
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public int Role { get; set; } = 3;
    }
}
