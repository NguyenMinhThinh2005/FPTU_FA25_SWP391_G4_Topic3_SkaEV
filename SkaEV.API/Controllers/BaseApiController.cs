using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;

namespace SkaEV.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected int CurrentUserId
    {
        get
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return 0;
            return int.TryParse(userIdClaim.Value, out int userId) ? userId : 0;
        }
    }

    protected string CurrentUserRole => User.FindFirst(ClaimTypes.Role)?.Value;

    protected IActionResult OkResponse<T>(T data, string? message = null)
    {
        return Ok(ApiResponse<T>.Ok(data, message));
    }

    protected IActionResult CreatedResponse<T>(string actionName, object routeValues, T data, string? message = null)
    {
        return CreatedAtAction(actionName, routeValues, ApiResponse<T>.Ok(data, message));
    }
    
    protected IActionResult BadRequestResponse(string message)
    {
        return BadRequest(ApiResponse<object>.Fail(message));
    }
    
    protected IActionResult NotFoundResponse(string message = "Resource not found")
    {
        return NotFound(ApiResponse<object>.Fail(message));
    }
    
    protected IActionResult ForbiddenResponse(string message = "Access denied")
    {
        return StatusCode(403, ApiResponse<object>.Fail(message));
    }
    
    protected IActionResult ServerErrorResponse(string message = "An internal server error occurred")
    {
        return StatusCode(500, ApiResponse<object>.Fail(message));
    }
}
