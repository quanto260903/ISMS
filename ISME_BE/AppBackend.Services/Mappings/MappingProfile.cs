using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AutoMapper;

namespace AppBackend.Services.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            #region AccountServices
            #endregion

            #region Account
            #endregion

            //#region Google Authentication
            //// Map từ GoogleUserInfo (ApiModel) sang GoogleUserInfoDto (DTO)
            //CreateMap<GoogleUserInfo, GoogleUserInfoDto>();

            //// Map từ User entity sang GoogleLoginResponseDto
            //CreateMap<User, GoogleLoginResponseDto>()
            //    .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            //    .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
            //    .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            //    .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.Phone))
            //    .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address))
            //    .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role))
            //    .ForMember(dest => dest.Token, opt => opt.Ignore())
            //    .ForMember(dest => dest.IsNewUser, opt => opt.Ignore());
            //#endregion

            #region User Management
            CreateMap<User, UserDto>()
                   .ForMember(dest => dest.Role,
                       opt => opt.MapFrom(src => src.UserRoles.Select(r => r.RoleId).FirstOrDefault()))
                   .ForMember(dest => dest.RoleName,
                       opt => opt.MapFrom(src => src.UserRoles
                           .Select(r => RoleConstants.Labels.GetValueOrDefault(r.RoleId, "Unknown"))
                           .FirstOrDefault() ?? "Unknown"));

            // Map CreateUserRequest to User entity
            CreateMap<CreateUserRequest, User>()
               .ForMember(dest => dest.UserRoles, opt => opt.Ignore()) // gán thủ công trong service
               .ForMember(dest => dest.PasswordHash, opt => opt.Ignore()); // hash thủ công trong service

            // Map UpdateUserRequest to User entity
            CreateMap<UpdateUserRequest, User>()
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.Email, opt => opt.Ignore())
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());
            #endregion
        }
    }
}