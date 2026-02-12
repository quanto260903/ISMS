using System.ComponentModel.DataAnnotations;

namespace AppBackend.BusinessObjects.Dtos
{
    public class UserDto
    {
        public string UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public int Role { get; set; }
        public string RoleName { get; set; } = string.Empty;
    }

    public class CreateUserRequest
    {
        public string UserId { get; set; }

        public string Username { get; set; } 
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string FullName { get; set; } = string.Empty;

        public string? Phone { get; set; }
        public string? Address { get; set; }

        [Required]
        public int Role { get; set; }
        public int NumberOfDependent { get; set; }
    }

    public class UpdateUserRequest
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        public string? Email { get; set; }

        public string? IdcardNumber { get; set; }


        [Required]
        public int Role { get; set; }
    }

}
