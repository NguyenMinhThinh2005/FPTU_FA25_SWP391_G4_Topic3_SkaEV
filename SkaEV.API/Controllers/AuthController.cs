using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Auth;
using SkaEV.API.Application.DTOs.UserProfiles;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.Common;

namespace SkaEV.API.Controllers;

public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;
    private readonly IUserProfileService _userProfileService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, IUserProfileService userProfileService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _userProfileService = userProfileService;
        _logger = logger;
    }

    /// <summary>
    /// User login
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);
        if (result == null)
        {
            return StatusCode(401, ApiResponse<object>.Fail("Invalid email or password"));
        }

        return OkResponse(result);
    }

    /// <summary>
    /// User registration
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);
            return CreatedResponse(nameof(GetProfile), new { id = result.UserId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _authService.GetUserByIdAsync(CurrentUserId);

        if (user == null)
        {
            return NotFoundResponse("User not found");
        }

        return OkResponse(new
        {
            userId = user.UserId,
            email = user.Email,
            fullName = user.FullName,
            phoneNumber = user.PhoneNumber,
            role = user.Role,
            isActive = user.IsActive,
            profile = user.UserProfile
        });
    }

    /// <summary>
    /// Update current user profile
    /// </summary>
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto updateDto)
    {
        try
        {
            var updatedProfile = await _userProfileService.UpdateUserProfileAsync(CurrentUserId, updateDto);
            return OkResponse(updatedProfile);
        }
        catch (ArgumentException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// User logout (client-side token removal)
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        // In JWT, logout is handled client-side by removing the token
        return OkResponse(new { message = "Logout successful" });
    }
}

