using System.Collections.Generic;
using System.Threading.Tasks;
using SkaEV.API.Application.DTOs.Posts;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Application.DTOs.Stations;

namespace SkaEV.API.Application.Services
{
    /// <summary>
    /// Interface định nghĩa các dịch vụ quản lý trạm sạc.
    /// </summary>
    public interface IStationService
    {
        /// <summary>
        /// Lấy danh sách tất cả trạm sạc với bộ lọc.
        /// </summary>
        Task<List<StationDto>> GetAllStationsAsync(string? city = null, string? status = null);

        /// <summary>
        /// Tìm kiếm trạm sạc theo vị trí địa lý.
        /// </summary>
        Task<List<StationDto>> SearchStationsByLocationAsync(SearchStationsRequestDto request);

        /// <summary>
        /// Lấy thông tin chi tiết trạm sạc theo ID.
        /// </summary>
        Task<StationDto?> GetStationByIdAsync(int stationId);

        /// <summary>
        /// Tạo mới trạm sạc.
        /// </summary>
        Task<StationDto> CreateStationAsync(CreateStationDto dto);

        /// <summary>
        /// Lấy danh sách slot khả dụng của trạm.
        /// </summary>
        Task<List<ChargingSlotDto>> GetAvailableSlotsAsync(int stationId);

        /// <summary>
        /// Lấy danh sách trụ sạc khả dụng của trạm.
        /// </summary>
        Task<List<PostDto>> GetAvailablePostsAsync(int stationId);

        /// <summary>
        /// Cập nhật thông tin trạm sạc.
        /// </summary>
        Task<bool> UpdateStationAsync(int stationId, UpdateStationDto dto);

        /// <summary>
        /// Lấy chi tiết trạng thái của tất cả slot trong trạm.
        /// </summary>
        Task<List<SlotDetailDto>> GetStationSlotsDetailsAsync(int stationId);

        /// <summary>
        /// Xóa (xóa mềm) trạm sạc.
        /// </summary>
        Task<bool> DeleteStationAsync(int stationId);
    }
}
