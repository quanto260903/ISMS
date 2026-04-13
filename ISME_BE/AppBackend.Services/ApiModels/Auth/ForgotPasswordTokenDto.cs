using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.ApiModels.Auth
{
    public class ForgotPasswordTokenDto
    {
        public int UserId { get; set; }

        public DateTime ExpiredTime { get; set; }

    }
}
