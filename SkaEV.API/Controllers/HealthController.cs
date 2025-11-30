using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller kiểm tra trạng thái sức khỏe của hệ thống (Health Check).
/// Thường được sử dụng bởi các công cụ giám sát hoặc load balancer.
/// </summary>
[Route("api/[controller]")]
public class HealthController : BaseApiController
{
    /// <summary>
    /// Kiểm tra trạng thái hoạt động của API.
    /// </summary>
    /// <returns>Trạng thái "Healthy" và thời gian hiện tại.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public IActionResult GetHealth()
    {
        return OkResponse(new { status = "Healthy", timestamp = DateTime.UtcNow });
    }
}
