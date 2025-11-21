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
    // Database context for accessing User data
    private readonly SkaEVDbContext _context;
    
    // Configuration for accessing app settings (e.g. JWT secret)
    private readonly IConfiguration _configuration;
    
    // Logger for tracking operations and errors
    private readonly ILogger<AuthService> _logger;

    // Constructor for dependency injection
    public AuthService(SkaEVDbContext context, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Xác thực người dùng và tạo JWT token.
    /// </summary>
    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        // Log the login attempt (masking sensitive data implicitly by only logging email)
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        // Query the database for a user with the matching email who is also active
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

        // If no matching user is found
        if (user == null)
        {
            // Log warning and return null to indicate failure
            _logger.LogWarning("User not found or inactive: {Email}", request.Email);
            return null;
        }

        // Log that the user was found (useful for debugging flow)
        _logger.LogInformation("User found: {Email}, Role: {Role}, IsActive: {IsActive}", user.Email, user.Role, user.IsActive);

        // Verify password using shared PasswordHasher (supports BCrypt and legacy/plaintext)
        bool passwordMatches = false;
        try
        {
            // Verify the provided password against the stored hash
            passwordMatches = PasswordHasher.Verify(user.PasswordHash, request.Password);
            _logger.LogInformation("Password verification result: {Result}", passwordMatches);
        }
        catch (Exception ex)
        {
            // Catch any unexpected error during verification to prevent crash
            _logger.LogError(ex, "Error verifying password for user: {Email}", user.Email);
            passwordMatches = false;
        }

        // If password does not match
        if (!passwordMatches)
        {
            // Log warning and return null
            _logger.LogWarning("Password verification failed for user: {Email}", user.Email);
            return null;
        }

        // Legacy Password Migration Logic
        // If the stored password was legacy (not BCrypt), migrate it to a BCrypt hash
        try
        {
            // Check if password is not empty and does not start with BCrypt prefix "$2"
            if (!string.IsNullOrEmpty(user.PasswordHash) && !user.PasswordHash.StartsWith("$2"))
            {
                // Hash the plaintext password using BCrypt
                user.PasswordHash = PasswordHasher.HashPassword(request.Password);
                // Update the timestamp
                user.UpdatedAt = DateTime.UtcNow;
                // Save changes to database
                await _context.SaveChangesAsync();
                _logger.LogInformation("Migrated legacy password to BCrypt for user: {Email}", user.Email);
            }
        }
        catch (Exception ex)
        {
            // Log migration failure but do not fail the login request
            _logger.LogError(ex, "Failed to migrate password for user: {Email}", user.Email);
        }

        // Log successful login
        _logger.LogInformation("Login successful for user: {Email}", user.Email);

        // Generate JWT token for the authenticated user
        var token = GenerateJwtToken(user);
        // Set token expiration time (24 hours from now)
        var expiresAt = DateTime.UtcNow.AddHours(24);

        // Return successful response DTO
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

        // 1. Check if FullName is provided
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new InvalidOperationException("Full name is required");
        }

        // 2. Check if Role is provided
        if (string.IsNullOrWhiteSpace(request.Role))
        {
            throw new InvalidOperationException("Role is required");
        }

        // 3. Check if Role is valid (User, Staff, Admin)
        // Normalize role to lowercase for comparison
        var validRoles = new[] { "customer", "staff", "admin" };
        if (!validRoles.Contains(request.Role.ToLower()))
        {
             throw new InvalidOperationException("Invalid role specified");
        }

        // 4. Check if Email already exists in the database
        var existingUser = await _context.Users
            .AnyAsync(u => u.Email == request.Email);
            
        if (existingUser)
        {
            // Throw exception if email is already taken
            throw new InvalidOperationException("Email is already in use");
        }

        // Create new User entity
        var newUser = new User
        {
            Email = request.Email,
            // Hash the password immediately upon creation
            PasswordHash = PasswordHasher.HashPassword(request.Password),
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            Role = request.Role.ToLower(), // Store role in lowercase
            IsActive = true, // Default to active
            CreatedAt = DateTime.UtcNow
        };

        // Add user to the database context
        _context.Users.Add(newUser);
        
        // Save changes to generate the UserId
        await _context.SaveChangesAsync();
        
        // Log the registration event
        _logger.LogInformation("User registered successfully: {Email} with Role: {Role}", newUser.Email, newUser.Role);

        // Return response DTO with new user info
        return new RegisterResponseDto
        {
            UserId = newUser.UserId,
            Email = newUser.Email,
            FullName = newUser.FullName
        };
    }

    /// <summary>
    /// Lấy thông tin chi tiết người dùng bao gồm cả hồ sơ.
    /// </summary>
    public async Task<User?> GetUserByIdAsync(int userId)
    {
        // Query database for user by ID
        // Include the UserProfile navigation property to get extended details
        return await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    /// <summary>
    /// Tạo JWT token cho người dùng đã xác thực.
    /// </summary>
    private string GenerateJwtToken(User user)
    {
        // Get JWT settings from configuration
        var jwtSettings = _configuration.GetSection("JwtSettings");
        
        // Get the secret key, with a hardcoded fallback for development safety (WARNING: Should always use config in prod)
        var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "SkaEV_Secret_Key_2025_Change_This_In_Production_Environment_12345678");

        // Create the token descriptor containing claims and expiration
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            // Define the claims (payload) of the token
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()), // User ID
                new Claim(ClaimTypes.Email, user.Email), // User Email
                new Claim(ClaimTypes.Name, user.FullName), // User Name
                new Claim(ClaimTypes.Role, user.Role) // User Role
            }),
            // Set expiration time to 24 hours
            Expires = DateTime.UtcNow.AddHours(24),
            // Sign the token using HmacSha256 algorithm and the secret key
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        // Create and write the token string
        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
