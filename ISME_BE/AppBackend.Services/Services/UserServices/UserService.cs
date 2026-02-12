using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.UserRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services.ApiModels;
using AutoMapper;

namespace AppBackend.Services.Services.UserServices
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UserService(IUserRepository userRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

       

        public async Task<ResultModel<UserDto>> GetUserByIdAsync(int userId)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);

                if (user == null)
                {
                    return new ResultModel<UserDto>
                    {
                        IsSuccess = false,
                        StatusCode = 404,
                        ResponseCode = "NOT_FOUND",
                        Message = "User not found"
                    };
                }

                var userDto = _mapper.Map<UserDto>(user);
                userDto.RoleName = GetRoleName(userDto.Role);

                return new ResultModel<UserDto>
                {
                    IsSuccess = true,
                    StatusCode = 200,
                    Data = userDto,
                    Message = "User retrieved successfully"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<UserDto>
                {
                    IsSuccess = false,
                    StatusCode = 500,
                    ResponseCode = "ERROR",
                    Message = $"Error retrieving user: {ex.Message}"
                };
            }
        }

        public async Task<ResultModel<UserDto>> CreateUserAsync(CreateUserRequest request)
        {
            try
            {
                // Check if email already exists
                if (await _userRepository.IsEmailExistsAsync(request.Email))
                {
                    return new ResultModel<UserDto>
                    {  
                        IsSuccess = false,
                        StatusCode = 409,
                        ResponseCode = "CONFLICT",
                        Message = "Email already exists"
                    };
                }

                var user = _mapper.Map<User>(request);
                
                // Hash password (you should use proper password hashing in production)
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

                await _userRepository.AddAsync(user);
                await _unitOfWork.SaveChangesAsync();

                var userDto = _mapper.Map<UserDto>(user);
                userDto.RoleName = GetRoleName(userDto.Role);

                return new ResultModel<UserDto>
                {
                    IsSuccess = true,
                    StatusCode = 201,
                    Data = userDto,
                    Message = "User created successfully"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<UserDto>
                {
                    IsSuccess = false,
                    StatusCode = 500,
                    ResponseCode = "ERROR",
                    Message = $"Error creating user: {ex.Message}"
                };
            }
        }

        public async Task<ResultModel<UserDto>> UpdateUserAsync(int userId, UpdateUserRequest request)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);

                if (user == null)
                {
                    return new ResultModel<UserDto>
                    {
                        IsSuccess = false,
                        StatusCode = 404,
                        ResponseCode = "NOT_FOUND",
                        Message = "User not found"
                    };
                }

                // Update user properties
                user.FullName = request.FullName;
                user.Email = request.Email;
                user.IdcardNumber = request.IdcardNumber;

                await _userRepository.UpdateAsync(user);
                await _unitOfWork.SaveChangesAsync();

                var userDto = _mapper.Map<UserDto>(user);
                return new ResultModel<UserDto>
                {
                    IsSuccess = true,
                    StatusCode = 200,
                    Data = userDto,
                    Message = "User updated successfully"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<UserDto>
                {
                    IsSuccess = false,
                    StatusCode = 500,
                    ResponseCode = "ERROR",
                    Message = $"Error updating user: {ex.Message}"
                };
            }
        }

        public async Task<ResultModel> DeleteUserAsync(int userId)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);

                if (user == null)
                {
                    return new ResultModel
                    {
                        IsSuccess = false,
                        StatusCode = 404,
                        ResponseCode = "NOT_FOUND",
                        Message = "User not found"
                    };
                }

                await _userRepository.DeleteAsync(user);
                await _unitOfWork.SaveChangesAsync();

                return new ResultModel
                {
                    IsSuccess = true,
                    StatusCode = 200,
                    Message = "User deleted successfully"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel
                {
                    IsSuccess = false,
                    StatusCode = 500,
                    ResponseCode = "ERROR",
                    Message = $"Error deleting user: {ex.Message}"
                };
            }
        }
        public async Task<ResultModel<List<UserDto>>> GetAllUsersAsync()
        {
            try
            {
                var users = await _userRepository.GetAllUsersAsync();
                var userDtos = users.Select(user => new UserDto
                {
                    UserId = user.UserId,
                    Email = user.Email,
                }).ToList();

                return new ResultModel<List<UserDto>>
                {
                    IsSuccess = true,
                    StatusCode = 200,
                    Message = "User List successfully"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<List<UserDto>>
                {
                    IsSuccess = false,
                    StatusCode = 500,
                    ResponseCode = "ERROR",
                    Message = $"Error listing user: {ex.Message}"
                };
            }
        }
        private string GetRoleName(int role)
        {
            return role switch
            {
                0 => "Admin",
                1 => "Manager",
                2 => "Warehouse Staff",
            };
        }
    }
}
