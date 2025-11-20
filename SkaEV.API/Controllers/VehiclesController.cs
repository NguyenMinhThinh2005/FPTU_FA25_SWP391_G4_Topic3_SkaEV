using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Vehicles;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý phương tiện của người dùng
/// </summary>
[Authorize(Roles = Roles.Customer)]
public class VehiclesController : BaseApiController
{
    private readonly IVehicleService _vehicleService;

    public VehiclesController(IVehicleService vehicleService)
    {
        _vehicleService = vehicleService;
    }

    /// <summary>
    /// Lấy danh sách phương tiện của tôi
    /// </summary>
    /// <remarks>
    /// API này trả về danh sách tất cả các phương tiện đã đăng ký của người dùng hiện tại.
    /// </remarks>
    /// <returns>Danh sách phương tiện</returns>
    /// <response code="200">Trả về danh sách thành công</response>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<VehicleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyVehicles()
    {
        var vehicles = await _vehicleService.GetUserVehiclesAsync(CurrentUserId);
        return OkResponse(vehicles);
    }

    /// <summary>
    /// Lấy thông tin phương tiện theo ID
    /// </summary>
    /// <remarks>
    /// API này trả về chi tiết một phương tiện cụ thể.
    /// Chỉ chủ sở hữu mới có thể xem thông tin.
    /// </remarks>
    /// <param name="id">ID của phương tiện</param>
    /// <returns>Thông tin chi tiết phương tiện</returns>
    /// <response code="200">Trả về thông tin thành công</response>
    /// <response code="403">Không có quyền truy cập (Không phải chủ sở hữu)</response>
    /// <response code="404">Không tìm thấy phương tiện</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetVehicle(int id)
    {
        var vehicle = await _vehicleService.GetVehicleByIdAsync(id);

        if (vehicle == null)
            return NotFoundResponse("Vehicle not found");

        if (vehicle.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(vehicle);
    }

    /// <summary>
    /// Thêm phương tiện mới
    /// </summary>
    /// <remarks>
    /// API này cho phép người dùng thêm một phương tiện mới vào tài khoản.
    /// </remarks>
    /// <param name="createDto">Thông tin phương tiện mới</param>
    /// <returns>Phương tiện vừa tạo</returns>
    /// <response code="201">Tạo thành công</response>
    /// <response code="400">Dữ liệu không hợp lệ</response>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddVehicle([FromBody] CreateVehicleDto createDto)
    {
        try
        {
            var userId = GetUserId();
            var vehicle = await _vehicleService.CreateVehicleAsync(userId, createDto);
            return CreatedAtAction(
                nameof(GetVehicle),
                new { id = vehicle.VehicleId },
                vehicle
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating vehicle");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Cập nhật phương tiện
    /// </summary>
    /// <remarks>
    /// API này cho phép cập nhật thông tin của một phương tiện hiện có.
    /// </remarks>
    /// <param name="id">ID của phương tiện</param>
    /// <param name="updateDto">Thông tin cập nhật</param>
    /// <returns>Phương tiện sau khi cập nhật</returns>
    /// <response code="200">Cập nhật thành công</response>
    /// <response code="403">Không có quyền truy cập</response>
    /// <response code="404">Không tìm thấy phương tiện</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateVehicle(int id, [FromBody] UpdateVehicleDto updateDto)
    {
        var existingVehicle = await _vehicleService.GetVehicleByIdAsync(id);

        if (existingVehicle == null)
            return NotFoundResponse("Vehicle not found");

        if (existingVehicle.UserId != CurrentUserId)
            return ForbiddenResponse();

        var updated = await _vehicleService.UpdateVehicleAsync(id, updateDto);
        return OkResponse(updated, "Vehicle updated successfully");
    }

    /// <summary>
    /// Xóa phương tiện
    /// </summary>
    /// <remarks>
    /// API này cho phép xóa một phương tiện khỏi tài khoản.
    /// </remarks>
    /// <param name="id">ID của phương tiện cần xóa</param>
    /// <returns>Kết quả xóa</returns>
    /// <response code="200">Xóa thành công</response>
    /// <response code="403">Không có quyền truy cập</response>
    /// <response code="404">Không tìm thấy phương tiện</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteVehicle(int id)
    {
        var existingVehicle = await _vehicleService.GetVehicleByIdAsync(id);

        if (existingVehicle == null)
            return NotFoundResponse("Vehicle not found");

        if (existingVehicle.UserId != CurrentUserId)
            return ForbiddenResponse();

        try
        {
            await _vehicleService.DeleteVehicleAsync(id);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting vehicle {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Đặt phương tiện mặc định
    /// </summary>
    /// <remarks>
    /// API này đặt một phương tiện làm phương tiện mặc định cho người dùng.
    /// </remarks>
    /// <param name="id">ID của phương tiện</param>
    /// <returns>Phương tiện được đặt làm mặc định</returns>
    /// <response code="200">Thành công</response>
    /// <response code="404">Không tìm thấy phương tiện</response>
    [HttpPatch("{id}/set-default")]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetDefaultVehicle(int id)
    {
        var vehicle = await _vehicleService.SetDefaultVehicleAsync(CurrentUserId, id);
        return OkResponse(vehicle, "Default vehicle set successfully");
    }
}
