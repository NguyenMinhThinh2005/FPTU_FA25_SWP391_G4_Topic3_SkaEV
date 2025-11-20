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
    private readonly IAuthService _authService;
    private readonly IUserProfileService _userProfileService;
    private readonly ILogger<AuthController> _logger;

    /// <summary>
    /// Constructor nhận vào các service cần thiết thông qua Dependency Injection.
    /// </summary>
    /// <param name="authService">Service xác thực.</param>
    /// <param name="userProfileService">Service hồ sơ người dùng.</param>
    /// <param name="logger">Logger hệ thống.</param>
    public AuthController(IAuthService authService, IUserProfileService userProfileService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _userProfileService = userProfileService;
        _logger = logger;
    }

    /// <summary>
    /// Xác thực người dùng và trả về JWT token.
    /// </summary>
    /// <param name="request">Thông tin đăng nhập (email và mật khẩu).</param>
    /// <returns>JWT token và thông tin người dùng nếu thành công, hoặc 401 Unauthorized.</returns>
    [HttpPost("login")]
    [AllowAnonymous] // Cho phép truy cập không cần xác thực
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        // Thử đăng nhập với thông tin được cung cấp
        var result = await _authService.LoginAsync(request);
        
        // Nếu đăng nhập thất bại (kết quả null), trả về 401 Unauthorized
        if (result == null)
        {
            return StatusCode(401, ApiResponse<object>.Fail("Invalid email or password"));
        }

        // Trả về kết quả đăng nhập (token, thông tin user)
        return OkResponse(result);
    }

    /// <summary>
    /// Đăng ký tài khoản người dùng mới.
    /// </summary>
    /// <param name="request">Thông tin đăng ký (tên, email, mật khẩu, ...).</param>
    /// <returns>Thông tin người dùng đã tạo nếu thành công, hoặc 400 Bad Request.</returns>
    [HttpPost("register")]
    [AllowAnonymous] // Cho phép truy cập không cần xác thực
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            // Thử đăng ký người dùng mới
            var result = await _authService.RegisterAsync(request);
            
            // Trả về 201 Created cùng với location của resource mới (GetProfile) và dữ liệu user đã tạo
            return CreatedResponse(nameof(GetProfile), new { id = result.UserId }, result);
        }
        catch (InvalidOperationException ex)
        {
            // Nếu đăng ký thất bại (ví dụ: email đã tồn tại), trả về 400 Bad Request với thông báo lỗi
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Lấy thông tin hồ sơ của người dùng hiện tại.
    /// </summary>
    /// <returns>Thông tin hồ sơ người dùng.</returns>
    [HttpGet("profile")]
    [Authorize] // Yêu cầu JWT token hợp lệ để truy cập
    public async Task<IActionResult> GetProfile()
    {
        // Lấy thông tin user sử dụng ID từ token hiện tại (CurrentUserId từ BaseApiController)
        var user = await _authService.GetUserByIdAsync(CurrentUserId);

        // Nếu không tìm thấy user (không nên xảy ra nếu token hợp lệ), trả về 404
        if (user == null)
        {
            return NotFoundResponse("User not found");
        }

        // Trả về đối tượng user đơn giản hóa
        return OkResponse(new
        {
            userId = user.UserId,
            email = user.Email,
            fullName = user.FullName,
            phoneNumber = user.PhoneNumber,
            role = user.Role,
            isActive = user.IsActive,
            profile = user.UserProfile // Bao gồm dữ liệu hồ sơ mở rộng nếu có
        });
    }

    /// <summary>
    /// Cập nhật thông tin hồ sơ của người dùng hiện tại.
    /// </summary>
    /// <param name="updateDto">Dữ liệu hồ sơ cập nhật.</param>
    /// <returns>Hồ sơ đã cập nhật nếu thành công.</returns>
    [HttpPut("profile")]
    [Authorize] // Yêu cầu JWT token hợp lệ để truy cập
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto updateDto)
    {
        try
        {
            // Cập nhật hồ sơ người dùng thông qua service
            var updatedProfile = await _userProfileService.UpdateUserProfileAsync(CurrentUserId, updateDto);
            
            // Trả về dữ liệu hồ sơ đã cập nhật
            return OkResponse(updatedProfile);
        }
        catch (ArgumentException ex)
        {
            // Nếu validation thất bại, trả về 400 Bad Request
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
    [Authorize] // Yêu cầu JWT token hợp lệ để truy cập
    public IActionResult Logout()
    {
        // Trong hệ thống JWT stateless, server không cần làm gì nhiều.
        // Client chịu trách nhiệm loại bỏ token.
        return OkResponse(new { message = "Logout successful" });
    }
}

