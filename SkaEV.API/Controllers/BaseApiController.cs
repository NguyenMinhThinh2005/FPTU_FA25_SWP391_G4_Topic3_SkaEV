using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;

namespace SkaEV.API.Controllers;

/// <summary>
/// Lớp controller cơ sở cung cấp các chức năng chung cho tất cả các API controller.
/// Kế thừa từ ControllerBase cung cấp các tính năng cơ bản của API controller.
/// </summary>
[ApiController] // Đánh dấu lớp này là API controller (bật tính năng định tuyến thuộc tính, tự động trả về 400, v.v.)
[Route("api/[controller]")] // Thiết lập mẫu định tuyến mặc định là api/[ControllerName]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// Lấy User ID của người dùng hiện tại từ claims trong JWT token.
    /// Trả về 0 nếu người dùng chưa xác thực hoặc claim ID bị thiếu/không hợp lệ.
    /// </summary>
    protected int CurrentUserId
    {
        get
        {
            // Lấy claim "nameid" (claim chuẩn cho Subject ID) từ identity của người dùng hiện tại
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            
            // Nếu claim bị thiếu, trả về 0 (biểu thị không tìm thấy ID người dùng hợp lệ)
            if (userIdClaim == null) return 0;
            
            // Thử phân tích giá trị claim sang số nguyên. Nếu thành công, trả về nó; ngược lại trả về 0.
            return int.TryParse(userIdClaim.Value, out int userId) ? userId : 0;
        }
    }

    /// <summary>
    /// Lấy Role (Vai trò) của người dùng hiện tại từ claims trong JWT token.
    /// Trả về null nếu người dùng chưa xác thực hoặc claim Role bị thiếu.
    /// </summary>
    protected string? CurrentUserRole => User.FindFirst(ClaimTypes.Role)?.Value;

    /// <summary>
    /// Trả về phản hồi 200 OK chuẩn được bao bọc trong đối tượng ApiResponse.
    /// </summary>
    /// <typeparam name="T">Kiểu dữ liệu được trả về.</typeparam>
    /// <param name="data">Dữ liệu thực tế.</param>
    /// <param name="message">Thông báo thành công tùy chọn.</param>
    /// <returns>IActionResult chứa ApiResponse.</returns>
    protected IActionResult OkResponse<T>(T data, string? message = null)
    {
        // Bao bọc dữ liệu trong ApiResponse<T>.Ok() để tạo cấu trúc phản hồi thành công chuẩn
        return Ok(ApiResponse<T>.Ok(data, message));
    }

    /// <summary>
    /// Trả về phản hồi 201 Created chuẩn được bao bọc trong đối tượng ApiResponse.
    /// </summary>
    /// <typeparam name="T">Kiểu dữ liệu được trả về.</typeparam>
    /// <param name="actionName">Tên của action để lấy tài nguyên vừa tạo (cho header Location).</param>
    /// <param name="routeValues">Các giá trị route để tạo URL cho header Location.</param>
    /// <param name="data">Dữ liệu tài nguyên vừa tạo.</param>
    /// <param name="message">Thông báo thành công tùy chọn.</param>
    /// <returns>IActionResult chứa ApiResponse.</returns>
    protected IActionResult CreatedResponse<T>(string actionName, object routeValues, T data, string? message = null)
    {
        // Trả về 201 Created với header Location trỏ đến tài nguyên mới
        return CreatedAtAction(actionName, routeValues, ApiResponse<T>.Ok(data, message));
    }
    
    /// <summary>
    /// Trả về phản hồi 400 Bad Request chuẩn được bao bọc trong đối tượng ApiResponse.
    /// </summary>
    /// <param name="message">Thông báo lỗi giải thích tại sao yêu cầu không hợp lệ.</param>
    /// <returns>IActionResult chứa ApiResponse thất bại.</returns>
    protected IActionResult BadRequestResponse(string message)
    {
        // Trả về 400 Bad Request với success=false và thông báo lỗi
        return BadRequest(ApiResponse<object>.Fail(message));
    }
    
    /// <summary>
    /// Trả về phản hồi 404 Not Found chuẩn được bao bọc trong đối tượng ApiResponse.
    /// </summary>
    /// <param name="message">Thông báo lỗi (mặc định: "Resource not found").</param>
    /// <returns>IActionResult chứa ApiResponse thất bại.</returns>
    protected IActionResult NotFoundResponse(string message = "Resource not found")
    {
        // Trả về 404 Not Found với success=false và thông báo lỗi
        return NotFound(ApiResponse<object>.Fail(message));
    }
    
    /// <summary>
    /// Trả về phản hồi 403 Forbidden chuẩn được bao bọc trong đối tượng ApiResponse.
    /// </summary>
    /// <param name="message">Thông báo lỗi (mặc định: "Access denied").</param>
    /// <returns>IActionResult chứa ApiResponse thất bại.</returns>
    protected IActionResult ForbiddenResponse(string message = "Access denied")
    {
        // Trả về 403 Forbidden với success=false và thông báo lỗi
        return StatusCode(403, ApiResponse<object>.Fail(message));
    }
    
    /// <summary>
    /// Trả về phản hồi 500 Internal Server Error chuẩn được bao bọc trong đối tượng ApiResponse.
    /// </summary>
    /// <param name="message">Thông báo lỗi (mặc định: "An internal server error occurred").</param>
    /// <returns>IActionResult chứa ApiResponse thất bại.</returns>
    protected IActionResult ServerErrorResponse(string message = "An internal server error occurred")
    {
        // Trả về 500 Internal Server Error với success=false và thông báo lỗi
        return StatusCode(500, ApiResponse<object>.Fail(message));
    }
}
