namespace SkaEV.API.Application.DTOs.Auth;

/// <summary>
/// DTO yêu cầu đăng nhập.
/// </summary>
public class LoginRequestDto
{
    /// <summary>
    /// Địa chỉ email của người dùng.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Mật khẩu đăng nhập.
    /// </summary>
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// DTO phản hồi sau khi đăng nhập thành công.
/// </summary>
public class LoginResponseDto
{
    /// <summary>
    /// ID người dùng.
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Email người dùng.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Họ và tên đầy đủ.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Vai trò của người dùng trong hệ thống.
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Token xác thực (JWT).
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Thời gian hết hạn của token.
    /// </summary>
    public DateTime ExpiresAt { get; set; }
}

/// <summary>
/// DTO yêu cầu đăng ký tài khoản mới.
/// </summary>
public class RegisterRequestDto
{
    /// <summary>
    /// Email đăng ký.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Mật khẩu.
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Họ và tên đầy đủ.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Số điện thoại liên hệ.
    /// </summary>
    public string PhoneNumber { get; set; } = string.Empty;

    /// <summary>
    /// Vai trò đăng ký (mặc định là User).
    /// </summary>
    public string Role { get; set; } = string.Empty;
}

/// <summary>
/// DTO phản hồi sau khi đăng ký thành công.
/// </summary>
public class RegisterResponseDto
{
    /// <summary>
    /// ID người dùng vừa tạo.
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Email người dùng.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Họ và tên đầy đủ.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Thông báo kết quả.
    /// </summary>
    public string Message { get; set; } = "Registration successful";
}
