using System.Collections.Generic;
using System.Threading.Tasks;
using SkaEV.API.Application.DTOs.Stations;

namespace SkaEV.API.Application.Services
{
    /// <summary>
    /// Interface định nghĩa các dịch vụ quản lý trạm sạc.
    /// </summary>
    public interface IStationService
    {
        /// <summary>
        /// Tìm kiếm trạm sạc theo vị trí địa lý.
        /// </summary>
        Task<List<StationDto>> SearchStationsByLocationAsync(SearchStationsRequestDto request);

        /// <summary>
        /// Lấy thông tin chi tiết trạm sạc theo ID.
        /// </summary>
        Task<StationDto?> GetStationByIdAsync(int stationId);
    }
}
