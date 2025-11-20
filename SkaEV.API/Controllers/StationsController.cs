using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Stations;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.Common;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý trạm sạc.
/// Xử lý các thao tác CRUD, tìm kiếm và lấy chi tiết trạm sạc (slot, trụ sạc).
/// </summary>
[Route("api/[controller]")]
public class StationsController : BaseApiController
{
    private readonly IStationService _stationService;
    private readonly ILogger<StationsController> _logger;

    /// <summary>
    /// Constructor nhận vào StationService và Logger.
    /// </summary>
    /// <param name="stationService">Service trạm sạc.</param>
    /// <param name="logger">Logger hệ thống.</param>
    public StationsController(IStationService stationService, ILogger<StationsController> logger)
    {
        _stationService = stationService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách tất cả trạm sạc, có thể lọc theo thành phố hoặc trạng thái.
    /// </summary>
    /// <param name="city">Tên thành phố (tùy chọn).</param>
    /// <param name="status">Trạng thái trạm (tùy chọn, ví dụ: "active", "maintenance").</param>
    /// <returns>Danh sách trạm sạc phù hợp.</returns>
    [HttpGet]
    [AllowAnonymous] // Cho phép truy cập công khai
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStations([FromQuery] string? city = null, [FromQuery] string? status = null)
    {
        // Gọi service để lấy danh sách trạm theo bộ lọc
        var stations = await _stationService.GetAllStationsAsync(city, status);
        
        // Trả về danh sách và số lượng
        return OkResponse(new { data = stations, count = stations.Count });
    }

    /// <summary>
    /// Lấy chi tiết một trạm sạc theo ID.
    /// </summary>
    /// <param name="id">ID trạm sạc.</param>
    /// <returns>Chi tiết trạm sạc nếu tìm thấy, ngược lại trả về 404.</returns>
    [HttpGet("{id}")]
    [AllowAnonymous] // Cho phép truy cập công khai
    [ProducesResponseType(typeof(ApiResponse<StationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStation(int id)
    {
        // Gọi service để lấy trạm theo ID
        var station = await _stationService.GetStationByIdAsync(id);
        
        // Nếu không tìm thấy, trả về 404
        if (station == null)
        {
            return NotFoundResponse("Station not found");
        }

        // Trả về chi tiết trạm
        return OkResponse(station);
    }

    /// <summary>
    /// Tìm kiếm trạm sạc gần một vị trí cụ thể (vĩ độ/kinh độ).
    /// </summary>
    /// <param name="request">Tham số tìm kiếm (lat, long, bán kính).</param>
    /// <returns>Danh sách trạm sạc gần đó.</returns>
    [HttpGet("nearby")]
    [AllowAnonymous] // Cho phép truy cập công khai
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNearbyStations([FromQuery] SearchStationsRequestDto request)
    {
        // Gọi service để thực hiện tìm kiếm theo vị trí
        var stations = await _stationService.SearchStationsByLocationAsync(request);
        
        // Trả về danh sách trạm gần đó và số lượng
        return OkResponse(new { data = stations, count = stations.Count });
    }

    /// <summary>
    /// Tạo mới một trạm sạc. Chỉ dành cho Admin.
    /// </summary>
    /// <param name="dto">Thông tin trạm sạc mới.</param>
    /// <returns>Chi tiết trạm sạc vừa tạo.</returns>
    [HttpPost]
    [Authorize(Roles = Roles.Admin)] // Chỉ Admin mới có thể tạo trạm
    [ProducesResponseType(typeof(ApiResponse<StationDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateStation([FromBody] CreateStationDto dto)
    {
        // Gọi service để tạo trạm
        var station = await _stationService.CreateStationAsync(dto);
        
        // Trả về 201 Created với location header và dữ liệu trạm mới
        return CreatedResponse(nameof(GetStation), new { id = station.StationId }, station);
    }

    /// <summary>
    /// Lấy danh sách tất cả slot sạc khả dụng của một trạm.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách slot khả dụng.</returns>
    [HttpGet("{stationId}/slots")]
    [AllowAnonymous] // Cho phép truy cập công khai
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableSlots(int stationId)
    {
        // Gọi service để lấy slot khả dụng
        var slots = await _stationService.GetAvailableSlotsAsync(stationId);
        
        // Trả về danh sách slot và số lượng
        return OkResponse(new { data = slots, count = slots.Count });
    }

    /// <summary>
    /// Lấy danh sách tất cả trụ sạc khả dụng (và slot của chúng) của một trạm.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách trụ sạc khả dụng.</returns>
    [HttpGet("{stationId}/posts")]
    [AllowAnonymous] // Cho phép truy cập công khai
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailablePosts(int stationId)
    {
        // Gọi service để lấy trụ sạc khả dụng
        var posts = await _stationService.GetAvailablePostsAsync(stationId);
        
        // Trả về danh sách trụ sạc và số lượng
        return OkResponse(new { data = posts, count = posts.Count });
    }

    /// <summary>
    /// Cập nhật thông tin trạm sạc. Chỉ dành cho Admin và Staff.
    /// </summary>
    /// <param name="id">ID trạm sạc cần cập nhật.</param>
    /// <param name="dto">Thông tin cập nhật.</param>
    /// <returns>Thông báo thành công nếu cập nhật được, hoặc 404 nếu không tìm thấy.</returns>
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)] // Admin và Staff có thể cập nhật
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStation(int id, [FromBody] UpdateStationDto dto)
    {
        // Gọi service để cập nhật trạm
        var success = await _stationService.UpdateStationAsync(id, dto);
        
        // Nếu cập nhật thất bại (thường là do không tìm thấy ID), trả về 404
        if (!success)
        {
            return NotFoundResponse("Station not found");
        }

        // Trả về thông báo thành công
        return OkResponse<object>(new { }, "Station updated successfully");
    }

    /// <summary>
    /// Lấy chi tiết trạng thái của tất cả slot trong trạm (dành cho admin/staff giám sát).
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách chi tiết slot với trạng thái và thông tin nguồn điện.</returns>
    [HttpGet("{stationId}/slots/details")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)] // Giới hạn cho người dùng nội bộ
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SlotDetailDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationSlots(int stationId)
    {
        // Gọi service để lấy thông tin chi tiết slot
        var slots = await _stationService.GetStationSlotsDetailsAsync(stationId);
        
        // Trả về danh sách slot chi tiết
        return OkResponse(slots);
    }

    /// <summary>
    /// Xóa (xóa mềm) một trạm sạc. Chỉ dành cho Admin.
    /// </summary>
    /// <param name="id">ID trạm sạc cần xóa.</param>
    /// <returns>Thông báo thành công nếu xóa được, hoặc 404 nếu không tìm thấy.</returns>
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)] // Chỉ Admin mới có thể xóa
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStation(int id)
    {
        // Gọi service để xóa trạm
        var success = await _stationService.DeleteStationAsync(id);
        
        // Nếu xóa thất bại, trả về 404
        if (!success)
        {
            return NotFoundResponse("Station not found");
        }

        // Trả về thông báo thành công
        return OkResponse<object>(new { }, "Station deleted successfully");
    }
}
