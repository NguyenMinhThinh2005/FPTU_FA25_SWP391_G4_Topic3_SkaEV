using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Application.DTOs.Auth;
using BCrypt.Net;

namespace SkaEV.API.Application.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
    Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<User?> GetUserByIdAsync(int userId);
}

public class AuthService : IAuthService
{
    private readonly SkaEVDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(SkaEVDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
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

    public async Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // === VALIDATION (FIX LỖI 500) ===

        // 1. Kiểm tra trường FullName (NOT NULL)


        // 2. Kiểm tra trường Role (NOT NULL)
        if (string.IsNullOrWhiteSpace(request.Role))
        {
            throw new InvalidOperationException("Role is required");
        }

        // 3. Kiểm tra ràng buộc CHECK của Role (dựa theo script database của bạn)
        var validRoles = new[] { "admin", "staff", "customer" };
        if (!validRoles.Contains(request.Role.ToLower()))
        {
            throw new InvalidOperationException("Invalid role specified. Must be 'admin', 'staff', or 'customer'.");
        }

        // 4. Kiểm tra Email (code cũ của bạn)
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new InvalidOperationException("Email already registered");
        }

        // === TẠO USER ===
        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), // Hash password với BCrypt
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        // === TỐI ƯU HÓA NHỎ ===
        // Bạn nên tạo UserProfile ngay và chỉ gọi SaveChangesAsync 1 lần.
        // Việc này đảm bảo cả hai (User và Profile) hoặc cùng thành công, hoặc cùng thất bại (Transaction).

        // Create user profile
        var profile = new UserProfile
        {
            User = user, // Gán thẳng object, EF Core sẽ tự hiểu UserId
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.UserProfiles.Add(profile);

        // Chỉ gọi SaveChanges 1 lần ở cuối
        await _context.SaveChangesAsync();

        return new RegisterResponseDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName
        };
    }

    public async Task<User?> GetUserByIdAsync(int userId)
    {
        return await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

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
