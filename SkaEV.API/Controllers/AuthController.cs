using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Auth;
using SkaEV.API.Application.DTOs.UserProfiles;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.Common;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller chịu trách nhiệm xác thực và quản lý hồ sơ người dùng.
/// Xử lý đăng nhập, đăng ký và lấy/cập nhật thông tin hồ sơ.
/// </summary>
public class AuthController : BaseApiController
{
    // Service for handling authentication logic (Login, Register)
    private readonly IAuthService _authService;
    
    // Service for handling user profile logic (Get/Update profile)
    private readonly IUserProfileService _userProfileService;
    
    // Logger for tracking events and errors within this controller
    private readonly ILogger<AuthController> _logger;

    /// <summary>
    /// Constructor nhận vào các service cần thiết thông qua Dependency Injection.
    /// </summary>
    /// <param name="authService">Service xác thực.</param>
    /// <param name="userProfileService">Service hồ sơ người dùng.</param>
    /// <param name="logger">Logger hệ thống.</param>
    public AuthController(IAuthService authService, IUserProfileService userProfileService, ILogger<AuthController> logger)
    {
        // Assign the injected auth service to the local field
        _authService = authService;
        
        // Assign the injected user profile service to the local field
        _userProfileService = userProfileService;
        
        // Assign the injected logger to the local field
        _logger = logger;
    }

    /// <summary>
    /// Xác thực người dùng và trả về JWT token.
    /// </summary>
    /// <param name="request">Thông tin đăng nhập (email và mật khẩu).</param>
    /// <returns>JWT token và thông tin người dùng nếu thành công, hoặc 401 Unauthorized.</returns>
    [HttpPost("login")]
    [AllowAnonymous] // Cho phép truy cập không cần xác thực (Anonymous access allowed)
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        // Call the AuthService to attempt login with the provided credentials
        // This is an asynchronous operation
        var result = await _authService.LoginAsync(request);
        
        // Check if the login result is null, indicating failure
        if (result == null)
        {
            // Return a 401 Unauthorized status code with a standardized error message
            return StatusCode(401, ApiResponse<object>.Fail("Invalid email or password"));
        }

        // If login is successful, return the result (Token + User Info) wrapped in a standard success response
        return OkResponse(result);
    }

    /// <summary>
    /// Đăng ký tài khoản người dùng mới.
    /// </summary>
    /// <param name="request">Thông tin đăng ký (tên, email, mật khẩu, ...).</param>
    /// <returns>Thông tin người dùng đã tạo nếu thành công, hoặc 400 Bad Request.</returns>
    [HttpPost("register")]
    [AllowAnonymous] // Cho phép truy cập không cần xác thực (Anonymous access allowed)
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            // Call the AuthService to attempt to register a new user
            // This is an asynchronous operation
            var result = await _authService.RegisterAsync(request);
            
            // Return a 201 Created status code
            // nameof(GetProfile) provides the location header for the newly created resource
            // The result contains the new user's details
            return CreatedResponse(nameof(GetProfile), new { id = result.UserId }, result);
        }
        catch (InvalidOperationException ex)
        {
            // Catch specific business logic errors (e.g., Email already exists)
            // Return a 400 Bad Request with the exception message
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Lấy thông tin hồ sơ của người dùng hiện tại.
    /// </summary>
    /// <returns>Thông tin hồ sơ người dùng.</returns>
    [HttpGet("profile")]
    [Authorize] // Yêu cầu JWT token hợp lệ để truy cập (Requires valid Authentication Token)
    public async Task<IActionResult> GetProfile()
    {
        // Retrieve user details using the ID from the current authenticated context (CurrentUserId)
        // CurrentUserId is a property from the BaseApiController
        var user = await _authService.GetUserByIdAsync(CurrentUserId);

        // Check if the user was found
        // This handles edge cases where a token might be valid but the user was deleted
        if (user == null)
        {
            // Return 404 Not Found if user does not exist
            return NotFoundResponse("User not found");
        }

        // Construct and return a simplified anonymous object containing user details
        // This ensures we only expose necessary data to the client
        return OkResponse(new
        {
            userId = user.UserId,
            email = user.Email,
            fullName = user.FullName,
            phoneNumber = user.PhoneNumber,
            role = user.Role,
            isActive = user.IsActive,
            profile = user.UserProfile // Includes extended profile data if available
        });
    }

    /// <summary>
    /// Cập nhật thông tin hồ sơ của người dùng hiện tại.
    /// </summary>
    /// <param name="updateDto">Dữ liệu hồ sơ cập nhật.</param>
    /// <returns>Hồ sơ đã cập nhật nếu thành công.</returns>
    [HttpPut("profile")]
    [Authorize] // Yêu cầu JWT token hợp lệ để truy cập (Requires valid Authentication Token)
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto updateDto)
    {
        try
        {
            // Call UserProfileService to update the profile for the current user
            // Passes CurrentUserId to ensure users can only update their own profile
            var updatedProfile = await _userProfileService.UpdateUserProfileAsync(CurrentUserId, updateDto);
            
            // Return the updated profile data wrapped in a success response
            return OkResponse(updatedProfile);
        }
        catch (ArgumentException ex)
        {
            // Catch validation errors (e.g., Invalid data format)
            // Return 400 Bad Request with the error message
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Đăng xuất người dùng.
    /// Lưu ý: Vì JWT là stateless, đây chủ yếu là thao tác phía client (xóa token).
    /// Endpoint này có thể dùng để ghi log hoặc vô hiệu hóa token phía server trong tương lai (blacklist).
    /// </summary>
    /// <returns>Thông báo thành công.</returns>
    [HttpPost("logout")]
    [Authorize] // Yêu cầu JWT token hợp lệ để truy cập (Requires valid Authentication Token)
    public IActionResult Logout()
    {
        // Since JWT is stateless, the server doesn't maintain a session to destroy.
        // The client is responsible for removing the token from storage.
        // Ideally, we could add the token to a blacklist here if we wanted strict logout enforcement.
        
        // Return a simple success message
        return OkResponse(new { message = "Logout successful" });
    }
}
