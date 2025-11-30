using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Services;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý các tác vụ quản trị chung (Admin).
/// Cung cấp các API để reset mật khẩu người dùng và reset mật khẩu admin (chỉ dùng cho development).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class AdminController : BaseApiController
{
    // DbContext để truy cập cơ sở dữ liệu
    private readonly SkaEVDbContext _context;
    // Logger để ghi lại các hoạt động quan trọng
    private readonly ILogger<AdminController> _logger;
    private readonly IAdminUserService _adminUserService;
    private readonly IWebHostEnvironment _env;

    /// <summary>
    /// Constructor nhận vào DbContext và Logger thông qua Dependency Injection.
    /// </summary>
    /// <param name="context">Đối tượng DbContext để làm việc với DB.</param>
    /// <param name="logger">Đối tượng Logger để ghi log.</param>
    /// <param name="adminUserService">Service xử lý user admin.</param>
    /// <param name="env">Environment để kiểm tra development mode.</param>
    public AdminController(SkaEVDbContext context, ILogger<AdminController> logger, IAdminUserService adminUserService, IWebHostEnvironment env)
    {
        _context = context;
        _logger = logger;
        _adminUserService = adminUserService;
        _env = env;
    }
    /// Reset mật khẩu cho một người dùng cụ thể (Chức năng dành cho Admin).
    /// </summary>
    /// <param name="userId">ID của người dùng cần reset mật khẩu.</param>
    /// <param name="request">Đối tượng chứa mật khẩu mới.</param>
    /// <returns>Thông tin người dùng sau khi reset mật khẩu thành công.</returns>
    [HttpPost("reset-password/{userId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetUserPassword(int userId, [FromBody] ResetPasswordRequest request)
    {
        try
        {
            // Use AdminUserService to perform safe reset (hashing handled there)
            var performerId = int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : (int?)null;
            var result = await _adminUserService.ResetUserPasswordAsync(userId, performerId);

            // Ghi log thông tin reset mật khẩu
            _logger.LogInformation("Password reset for user {UserId}", userId);

            // Trả về phản hồi thành công
            return OkResponse(new
            {
                userId = userId,
                temporaryPassword = result.TemporaryPassword
            }, result.Message);
        }
        catch (ArgumentException ex)
        {
            return NotFoundResponse(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for user {UserId}", userId);
            return ServerErrorResponse("An error occurred while resetting password");
        }
    }

    /// <summary>
    /// Reset tất cả mật khẩu của tài khoản Admin về mặc định (Chỉ dùng cho môi trường Development!).
    /// </summary>
    /// <returns>Danh sách các tài khoản Admin đã được reset mật khẩu.</returns>
    [HttpPost("reset-all-admin-passwords")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetAllAdminPasswords()
    {
        if (!_env.IsDevelopment())
        {
            return BadRequestResponse("Seeding/resetting all admin passwords is allowed only in Development environment.");
        }

        const string defaultPassword = "Admin123!@#";

        try
        {
            var performerId = int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : (int?)null;
            var count = await _adminUserService.ResetAllAdminPasswordsAsync(defaultPassword, performerId);

            // Ghi log cảnh báo về việc reset hàng loạt mật khẩu Admin
            _logger.LogWarning("Reset passwords for {AdminCount} admin accounts", count);

            // Trả về phản hồi thành công kèm danh sách tài khoản bị ảnh hưởng
            return OkResponse(new
            {
                defaultPassword = defaultPassword,
                affectedCount = count
            }, $"Reset {count} admin passwords to default");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting all admin passwords");
            return ServerErrorResponse("An error occurred while resetting admin passwords");
        }
    }
}

/// <summary>
/// DTO (Data Transfer Object) cho yêu cầu reset mật khẩu.
/// </summary>
public class ResetPasswordRequest
{
    /// <summary>
    /// Mật khẩu mới cần thiết lập.
    /// </summary>
    public string NewPassword { get; set; } = string.Empty;
}
