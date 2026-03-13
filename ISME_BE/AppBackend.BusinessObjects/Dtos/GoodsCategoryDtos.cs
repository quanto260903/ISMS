using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    // ── Response: dòng trong danh sách ──
    public class GoodsCategoryListDto
    {
        public string GoodsGroupId { get; set; } = null!;
        public string GoodsGroupName { get; set; } = null!;
        public bool IsInactive { get; set; }
        public int GoodsCount { get; set; }   // số hàng hóa thuộc nhóm
    }

    // ── Response: chi tiết ──
    public class GoodsCategoryDetailDto
    {
        public string GoodsGroupId { get; set; } = null!;
        public string GoodsGroupName { get; set; } = null!;
        public bool IsInactive { get; set; }
        public int GoodsCount { get; set; }
    }

    // ── Request: tạo mới ──
    public class CreateGoodsCategoryRequest
    {
        public string GoodsGroupId { get; set; } = null!;   // mã nhóm — do người dùng nhập
        public string GoodsGroupName { get; set; } = null!;
    }

    // ── Request: cập nhật ──
    public class UpdateGoodsCategoryRequest
    {
        public string GoodsGroupName { get; set; } = null!;
    }

    // ── Request: đổi trạng thái ──
    public class UpdateGoodsCategoryStatusRequest
    {
        public bool IsInactive { get; set; }
    }

    // ── Request: lọc danh sách ──
    public class GetGoodsCategoryListRequest
    {
        public string? Keyword { get; set; }
        public bool? IsInactive { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
}
