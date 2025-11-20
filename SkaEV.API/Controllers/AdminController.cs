using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.Common;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý các tác vụ quản trị chung (Admin).
/// Cung cấp các API để reset mật khẩu người dùng và reset mật khẩu admin (chỉ dùng cho development).
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AdminController : BaseApiController
{
    // DbContext để truy cập cơ sở dữ liệu
    private readonly SkaEVDbContext _context;
    // Logger để ghi lại các hoạt động quan trọng
    private readonly ILogger<AdminController> _logger;

    /// <summary>
    /// Constructor nhận vào DbContext và Logger thông qua Dependency Injection.
    /// </summary>
    /// <param name="context">Đối tượng DbContext để làm việc với DB.</param>
    /// <param name="logger">Đối tượng Logger để ghi log.</param>
    public AdminController(SkaEVDbContext context, ILogger<AdminController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
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
        // Tìm người dùng theo ID
        var user = await _context.Users.FindAsync(userId);
        
        // Nếu không tìm thấy người dùng, trả về lỗi 404
        if (user == null)
        {
            return NotFoundResponse("User not found");
        }

        // Cập nhật mật khẩu mới (Lưu ý: Trong thực tế nên hash mật khẩu trước khi lưu)
        user.PasswordHash = request.NewPassword;
        user.UpdatedAt = DateTime.UtcNow;
        
        // Lưu thay đổi vào cơ sở dữ liệu
        await _context.SaveChangesAsync();

        // Ghi log thông tin reset mật khẩu
        _logger.LogInformation("Password reset for user {UserId} ({Email})", userId, user.Email);

        // Trả về phản hồi thành công
        return OkResponse(new 
        { 
            userId = user.UserId,
            email = user.Email
        }, "Password reset successful");
    }

    /// <summary>
    /// Reset tất cả mật khẩu của tài khoản Admin về mặc định (Chỉ dùng cho môi trường Development!).
    /// </summary>
    /// <returns>Danh sách các tài khoản Admin đã được reset mật khẩu.</returns>
    [HttpPost("reset-all-admin-passwords")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetAllAdminPasswords()
    {
        // Mật khẩu mặc định
        const string defaultPassword = "Admin123!@#";

        // Lấy danh sách tất cả các tài khoản có vai trò là Admin và đang hoạt động
        var adminUsers = await _context.Users
            .Where(u => u.Role == "Admin" && u.IsActive)
            .ToListAsync();

        // Cập nhật mật khẩu cho từng tài khoản Admin
        foreach (var user in adminUsers)
        {
            user.PasswordHash = defaultPassword;
            user.UpdatedAt = DateTime.UtcNow;
        }

        // Lưu tất cả thay đổi vào cơ sở dữ liệu
        await _context.SaveChangesAsync();

        // Ghi log cảnh báo về việc reset hàng loạt mật khẩu Admin
        _logger.LogWarning("Reset passwords for {AdminCount} admin accounts", adminUsers.Count);

        // Trả về phản hồi thành công kèm danh sách tài khoản bị ảnh hưởng
        return OkResponse(new 
        { 
            defaultPassword = defaultPassword,
            affectedUsers = adminUsers.Select(u => new { u.UserId, u.Email, u.FullName })
        }, $"Reset {adminUsers.Count} admin passwords to default");
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
