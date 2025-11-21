using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý toàn diện các trạm sạc dành cho Admin.
/// Bao gồm các chức năng: CRUD, Giám sát thời gian thực, Điều khiển từ xa, Cấu hình, Quản lý lỗi.
/// </summary>
[Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
[Route("api/admin/stations")]
public class AdminStationsController : BaseApiController
{
    // Service quản lý trạm sạc (chính)
    private readonly IAdminStationManagementService _stationMgmtService;
    // Service trạm sạc admin (phụ/legacy)
    private readonly IAdminStationService? _adminStationService;
    private readonly ILogger<AdminStationsController> _logger;

    /// <summary>
    /// Constructor nhận vào các service cần thiết.
    /// </summary>
    /// <param name="stationMgmtService">Service quản lý trạm sạc.</param>
    /// <param name="logger">Logger để ghi lại các hoạt động.</param>
    /// <param name="adminStationService">Service trạm sạc admin (tùy chọn).</param>
    public AdminStationsController(
        IAdminStationManagementService stationMgmtService,
        ILogger<AdminStationsController> logger,
        IAdminStationService? adminStationService = null)
    {
        _stationMgmtService = stationMgmtService;
        _logger = logger;
        _adminStationService = adminStationService;
    }

    #region Station List & Search

    /// <summary>
    /// Lấy danh sách tất cả các trạm với bộ lọc, sắp xếp và phân trang.
    /// </summary>
    /// <param name="filter">Các tiêu chí lọc (tên, trạng thái, vị trí...).</param>
    /// <returns>Danh sách trạm và thông tin phân trang.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStations([FromQuery] StationFilterDto filter)
    {
        try
        {
            // Debug: Log authentication info
            _logger.LogInformation("GetStations called. User authenticated: {IsAuthenticated}, User: {User}, Roles: {Roles}",
                User.Identity?.IsAuthenticated ?? false,
                User.Identity?.Name ?? "Unknown",
                string.Join(", ", User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value)));

            // Lấy danh sách trạm và tổng số lượng từ service
            var (stations, totalCount) = await _stationMgmtService.GetStationsAsync(filter);

            // Trả về kết quả kèm thông tin phân trang
            return OkResponse(new
            {
                data = stations,
                pagination = new
                {
                    page = filter.Page,
                    pageSize = filter.PageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stations. Filter: {@Filter}", filter);
            return StatusCode(500, new { message = "An error occurred while retrieving stations", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy thông tin chi tiết của một trạm cụ thể.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <returns>Thông tin chi tiết trạm.</returns>
    [HttpGet("{stationId}")]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationDetail(int stationId)
    {
        var station = await _stationMgmtService.GetStationDetailAsync(stationId);

        if (station == null)
            return NotFoundResponse("Station not found");

        return OkResponse(station);
    }

    #endregion

    #region Real-time Monitoring

    /// <summary>
    /// Lấy dữ liệu giám sát thời gian thực cho một trạm.
    /// Bao gồm: Công suất sử dụng, phiên sạc đang hoạt động, tiêu thụ năng lượng, tính khả dụng.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <returns>Dữ liệu giám sát thời gian thực.</returns>
    [HttpGet("{stationId}/realtime")]
    [ProducesResponseType(typeof(ApiResponse<StationRealTimeMonitoringDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationRealTimeData(int stationId)
    {
        var realtimeData = await _stationMgmtService.GetStationRealTimeDataAsync(stationId);

        if (realtimeData == null)
            return NotFoundResponse("Station not found");

        return OkResponse(realtimeData);
    }

    #endregion

    #region Remote Control

    /// <summary>
    /// Điều khiển một trụ sạc cụ thể (post).
    /// Các lệnh: start, stop, restart, pause, resume, maintenance.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    /// <param name="command">Lệnh điều khiển.</param>
    /// <returns>Kết quả thực hiện lệnh.</returns>
    [HttpPost("posts/{postId}/control")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<ControlCommandResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ControlChargingPoint(int postId, [FromBody] ChargingPointControlDto command)
    {
        command.PostId = postId;
        var result = await _stationMgmtService.ControlChargingPointAsync(command);

        return OkResponse(result);
    }

    /// <summary>
    /// Điều khiển toàn bộ trạm (tất cả các trụ sạc).
    /// Các lệnh: enable_all, disable_all, restart_all, maintenance_mode.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <param name="command">Lệnh điều khiển.</param>
    /// <returns>Kết quả thực hiện lệnh.</returns>
    [HttpPost("{stationId}/control")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<ControlCommandResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ControlStation(int stationId, [FromBody] StationControlDto command)
    {
        command.StationId = stationId;
        var result = await _stationMgmtService.ControlStationAsync(command);

        return OkResponse(result);
    }

    #endregion

    #region Configuration

    /// <summary>
    /// Cấu hình cài đặt cho trụ sạc.
    /// Bao gồm: Giới hạn công suất, giới hạn phiên, firmware, cân bằng tải.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    /// <param name="config">Thông tin cấu hình.</param>
    /// <returns>Kết quả cấu hình.</returns>
    [HttpPut("posts/{postId}/config")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfigureChargingPoint(int postId, [FromBody] ChargingPointConfigDto config)
    {
        config.PostId = postId;
        var success = await _stationMgmtService.ConfigureChargingPointAsync(config);

        if (!success)
            return NotFoundResponse("Charging point not found");

        return OkResponse(new { }, "Configuration updated successfully");
    }

    #endregion

    #region Error Management

    /// <summary>
    /// Lấy danh sách nhật ký lỗi của một trạm.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <param name="includeResolved">Bao gồm cả lỗi đã xử lý hay không (mặc định false).</param>
    /// <returns>Danh sách lỗi.</returns>
    [HttpGet("{stationId}/errors")]
    [ProducesResponseType(typeof(ApiResponse<List<StationErrorLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationErrors(int stationId, [FromQuery] bool includeResolved = false)
    {
        var errors = await _stationMgmtService.GetStationErrorsAsync(stationId, includeResolved);
        return OkResponse(errors);
    }

    /// <summary>
    /// Đánh dấu một lỗi là đã được xử lý.
    /// </summary>
    /// <param name="logId">ID nhật ký lỗi.</param>
    /// <param name="dto">Thông tin xử lý.</param>
    /// <returns>Kết quả xử lý.</returns>
    [HttpPatch("errors/{logId}/resolve")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveError(int logId, [FromBody] ResolveErrorDto dto)
    {
        // Lấy tên người dùng hiện tại từ token
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
        var success = await _stationMgmtService.ResolveErrorAsync(logId, userName, dto.Resolution);

        if (!success)
            return NotFoundResponse("Error log not found");

        return OkResponse(new { }, "Error marked as resolved");
    }

    /// <summary>
    /// Ghi nhận một lỗi hoặc cảnh báo mới cho trạm.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <param name="dto">Thông tin lỗi.</param>
    /// <returns>ID của lỗi vừa tạo.</returns>
    [HttpPost("{stationId}/errors")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status201Created)]
    public async Task<IActionResult> LogStationError(int stationId, [FromBody] LogStationErrorDto dto)
    {
        var logId = await _stationMgmtService.LogStationErrorAsync(
            stationId, dto.PostId, dto.SlotId, dto.Severity,
            dto.ErrorType, dto.Message, dto.Details);

        return CreatedResponse($"/api/admin/stations/errors/{logId}", new { logId }, (object?)null, "Error logged successfully");
    }

    #endregion

    #region CRUD Operations

    /// <summary>
    /// Tạo mới một trạm sạc.
    /// </summary>
    /// <param name="dto">Thông tin trạm sạc mới.</param>
    /// <returns>Thông tin trạm sạc vừa tạo.</returns>
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateStation([FromBody] CreateUpdateStationDto dto)
    {
        var station = await _stationMgmtService.CreateStationAsync(dto);

        return CreatedResponse($"/api/admin/stations/{station.StationId}", new { id = station.StationId }, station, "Station created successfully");
    }

    /// <summary>
    /// Cập nhật thông tin trạm sạc.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <param name="dto">Thông tin cập nhật.</param>
    /// <returns>Kết quả cập nhật.</returns>
    [HttpPut("{stationId}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStation(int stationId, [FromBody] CreateUpdateStationDto dto)
    {
        var success = await _stationMgmtService.UpdateStationAsync(stationId, dto);

        if (!success)
            return NotFoundResponse("Station not found");

        return OkResponse(new { }, "Station updated successfully");
    }

    /// <summary>
    /// Xóa trạm sạc (xóa mềm - soft delete).
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <returns>Kết quả xóa.</returns>
    [HttpDelete("{stationId}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStation(int stationId)
    {
        var success = await _stationMgmtService.DeleteStationAsync(stationId);

        if (!success)
            return NotFoundResponse("Station not found");

        return OkResponse<object>(new { }, "Station deleted successfully");
    }

    /// <summary>
    /// Thêm mới một trụ sạc vào trạm.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <param name="dto">Thông tin trụ sạc mới.</param>
    /// <returns>Thông tin trụ sạc vừa tạo.</returns>
    [HttpPost("{stationId}/posts")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<ChargingPointDetailDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateChargingPost(int stationId, [FromBody] CreateChargingPostDto dto)
    {
        dto.StationId = stationId;
        var post = await _stationMgmtService.CreateChargingPostAsync(dto);

        return CreatedResponse($"/api/admin/stations/{stationId}/posts/{post.PostId}", new { id = post.PostId }, post, "Charging post created successfully");
    }

    #endregion

    #region Manager Assignment

    /// <summary>
    /// Cập nhật người quản lý cho trạm sạc.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <param name="dto">Thông tin người quản lý mới.</param>
    /// <returns>Kết quả cập nhật.</returns>
    [HttpPut("{stationId}/manager")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStationManager(int stationId, [FromBody] UpdateStationManagerDto dto)
    {
        var success = await _stationMgmtService.UpdateStationManagerAsync(stationId, dto.ManagerUserId);

        if (!success)
            return NotFoundResponse("Station not found");

        var action = dto.ManagerUserId.HasValue ? "assigned" : "cleared";
        return OkResponse(new { }, $"Station manager {action} successfully");
    }

    #endregion

    #region Legacy Analytics (if needed)

    /// <summary>
    /// Lấy phân tích trạm sạc với các chỉ số theo thời gian (Hỗ trợ Legacy).
    /// </summary>
    /// <param name="timeRange">Khoảng thời gian (mặc định "30d").</param>
    /// <returns>Dữ liệu phân tích.</returns>
    [HttpGet("analytics")]
    [ProducesResponseType(typeof(ApiResponse<StationAnalyticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationAnalytics([FromQuery] string timeRange = "30d")
    {
        if (_adminStationService != null)
        {
            var analytics = await _adminStationService.GetStationAnalyticsAsync(timeRange);
            return OkResponse(analytics);
        }

        return OkResponse(new { }, "Analytics service not available");
    }

    #endregion
}

/// <summary>
/// DTO cho việc xử lý lỗi.
/// </summary>
public class ResolveErrorDto
{
    /// <summary>
    /// Nội dung giải pháp xử lý lỗi.
    /// </summary>
    public string Resolution { get; set; } = string.Empty;
}

/// <summary>
/// DTO cho việc ghi nhận lỗi trạm sạc.
/// </summary>
public class LogStationErrorDto
{
    public int? PostId { get; set; }
    public int? SlotId { get; set; }
    public string Severity { get; set; } = "warning";
    public string ErrorType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
}

/// <summary>
/// DTO cập nhật người quản lý trạm.
/// </summary>
public class UpdateStationManagerDto
{
    public int? ManagerUserId { get; set; }
}
