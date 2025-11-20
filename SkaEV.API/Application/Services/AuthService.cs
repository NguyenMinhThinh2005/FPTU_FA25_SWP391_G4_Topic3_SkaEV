using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Application.DTOs.Auth;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Interface định nghĩa các dịch vụ xác thực người dùng.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Xử lý đăng nhập người dùng.
    /// </summary>
    /// <param name="request">Thông tin đăng nhập (email, password).</param>
    /// <returns>Thông tin phản hồi đăng nhập (token, user info) hoặc null nếu thất bại.</returns>
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);

    /// <summary>
    /// Đăng ký người dùng mới.
    /// </summary>
    /// <param name="request">Thông tin đăng ký.</param>
    /// <returns>Thông tin người dùng vừa đăng ký.</returns>
    Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request);

    /// <summary>
    /// Lấy thông tin người dùng theo ID.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Đối tượng User hoặc null nếu không tìm thấy.</returns>
    Task<User?> GetUserByIdAsync(int userId);
}

/// <summary>
/// Service thực hiện các chức năng xác thực và quản lý phiên làm việc.
/// </summary>
public class AuthService : IAuthService
{
    private readonly SkaEVDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(SkaEVDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    /// <summary>
    /// Xác thực người dùng và tạo JWT token.
    /// </summary>
    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

        // If user not found or password does not verify, return null (Unauthorized)
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password ?? string.Empty, user.PasswordHash ?? string.Empty))
        {
            return null;
        }

        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(24);

        return new LoginResponseDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            Token = token,
            ExpiresAt = expiresAt
        };
    }

    /// <summary>
    /// Đăng ký tài khoản mới.
    /// </summary>
    public async Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // === KIỂM TRA DỮ LIỆU ĐẦU VÀO ===

        // 1. Kiểm tra trường FullName (Bắt buộc)
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new InvalidOperationException("Full name is required");
        }

        // 2. Kiểm tra trường Role (Bắt buộc)
        if (string.IsNullOrWhiteSpace(request.Role))
        {
            throw new InvalidOperationException("Role is required");
        }

        // 3. Kiểm tra tính hợp lệ của Role
        var validRoles = new[] { "admin", "staff", "customer" };
        if (!validRoles.Contains(request.Role.ToLower()))
        {
            throw new InvalidOperationException("Invalid role specified. Must be 'admin', 'staff', or 'customer'.");
        }

        // 4. Kiểm tra Email đã tồn tại chưa
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new InvalidOperationException("Email already registered");
        }

        // === TẠO USER MỚI ===
        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), // Hash mật khẩu trước khi lưu
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        // === TẠO HỒ SƠ NGƯỜI DÙNG ===
        // Tạo UserProfile ngay lập tức để đảm bảo tính toàn vẹn dữ liệu
        var profile = new UserProfile
        {
            User = user, // Gán object User, EF Core sẽ tự động liên kết ID
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.UserProfiles.Add(profile);

        // Lưu tất cả thay đổi vào database trong một transaction ngầm định
        await _context.SaveChangesAsync();

        return new RegisterResponseDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName
        };
    }

    /// <summary>
    /// Lấy thông tin chi tiết người dùng bao gồm cả hồ sơ.
    /// </summary>
    public async Task<User?> GetUserByIdAsync(int userId)
    {
        return await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    /// <summary>
    /// Tạo JWT token cho người dùng đã xác thực.
    /// </summary>
    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "SkaEV_Secret_Key_2025_Change_This_In_Production_Environment_12345678");

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role)
            }),
            Expires = DateTime.UtcNow.AddHours(24),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
