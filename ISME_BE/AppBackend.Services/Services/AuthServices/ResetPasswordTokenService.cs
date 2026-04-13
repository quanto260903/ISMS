using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.AuthServices
{
    public class ResetPasswordTokenService : IResetPasswordTokenService
    {
        private readonly IndividualBusinessContext _context;
        private readonly IConfiguration _config;

        public ResetPasswordTokenService(IndividualBusinessContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public string GenerateToken(User user)
        {
            var expiredAt = DateTime.UtcNow.AddMinutes(int.Parse(_config["ResetPassword:ExpireMinutes"]!));

            var userId = user.UserId;
            var expiredAtText = expiredAt.ToString("O", CultureInfo.InvariantCulture);

            var signature = ComputeSignature(userId, expiredAtText, user.PasswordHash);

            var rawToken = $"{userId}.{expiredAtText}.{signature}";
            return Base64UrlEncode(rawToken);
        }

        public async Task<(bool IsValid, User? User, string Message)> ValidateTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return (false, null, "Token không hợp lệ.");

            string rawToken;
            try
            {
                rawToken = Base64UrlDecode(token);
            }
            catch
            {
                return (false, null, "Token không đúng định dạng.");
            }

            var firstDot = rawToken.IndexOf('.');
            var lastDot = rawToken.LastIndexOf('.');

            if (firstDot <= 0 || lastDot <= firstDot)
                return (false, null, "Token không hợp lệ.");

            var userIdText = rawToken.Substring(0, firstDot);
            var expiredAtText = rawToken.Substring(firstDot + 1, lastDot - firstDot - 1);
            var signature = rawToken.Substring(lastDot + 1);

            if (!DateTime.TryParse(expiredAtText, null, DateTimeStyles.RoundtripKind, out DateTime expiredAt))
                return (false, null, "Token không hợp lệ.");

            if (expiredAt < DateTime.UtcNow)
                return (false, null, "Token đã hết hạn.");

            var user = await _context.Users.FirstOrDefaultAsync(x => x.UserId == userIdText);
            if (user == null)
                return (false, null, "Người dùng không tồn tại.");

            var expectedSignature = ComputeSignature(userIdText, expiredAtText, user.PasswordHash);

            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(signature),
                    Encoding.UTF8.GetBytes(expectedSignature)))
            {
                return (false, null, "Token không hợp lệ hoặc đã được sử dụng.");
            }

            return (true, user, "Token hợp lệ.");
        }

        private string ComputeSignature(string userId, string expiredAtText, string passwordHash)
        {
            var data = $"{userId}|{expiredAtText}|{passwordHash}";
            var keyBytes = Encoding.UTF8.GetBytes(_config["ResetPassword:SecretKey"]!);
            var dataBytes = Encoding.UTF8.GetBytes(data);

            using var hmac = new HMACSHA256(keyBytes);
            var hash = hmac.ComputeHash(dataBytes);
            return Convert.ToBase64String(hash);
        }

        private static string Base64UrlEncode(string input)
        {
            var bytes = Encoding.UTF8.GetBytes(input);
            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }

        private static string Base64UrlDecode(string input)
        {
            var base64 = input
                .Replace("-", "+")
                .Replace("_", "/");

            switch (base64.Length % 4)
            {
                case 2:
                    base64 += "==";
                    break;
                case 3:
                    base64 += "=";
                    break;
            }

            var bytes = Convert.FromBase64String(base64);
            return Encoding.UTF8.GetString(bytes);
        }
    }
}
