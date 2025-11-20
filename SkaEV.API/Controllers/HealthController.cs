using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;

namespace SkaEV.API.Controllers;

[Route("api/[controller]")]
public class HealthController : BaseApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public IActionResult GetHealth()
    {
        return OkResponse(new { status = "Healthy", timestamp = DateTime.UtcNow });
    }
}
