using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Application.Options;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.Services.Payments;
using VNPAY.Extensions;

namespace SkaEV.API.Extensions;

/// <summary>
/// Extension methods for IServiceCollection to modularize service registration.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Register the EF Core DbContext with SQL Server or SQLite based on connection string.
    /// </summary>
    public static IServiceCollection AddSkaEVDatabase(
        this IServiceCollection services, string connectionString, bool isSqliteDemo)
    {
        services.AddDbContext<SkaEVDbContext>(options =>
        {
            if (string.IsNullOrWhiteSpace(connectionString))
                throw new InvalidOperationException("DefaultConnection string is not configured.");

            if (isSqliteDemo)
            {
                options.UseSqlite(connectionString);
            }
            else
            {
                options.UseSqlServer(connectionString, sqlOptions =>
                {
                    sqlOptions.UseNetTopologySuite();
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null);
                });
            }
        });

        return services;
    }

    /// <summary>
    /// Configure JWT Bearer authentication.
    /// </summary>
    public static IServiceCollection AddSkaEVAuthentication(
        this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]
            ?? "SkaEV_Secret_Key_2025_Change_This_In_Production_Environment_12345678";
        var key = Encoding.ASCII.GetBytes(secretKey);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var token = context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                    if (string.IsNullOrEmpty(token))
                        Log.Warning("JWT Token not found. Path: {Path}", context.Request.Path);
                    else
                        Log.Information("JWT Token received. Path: {Path}, Length: {Length}",
                            context.Request.Path, token.Length);
                    return Task.CompletedTask;
                },
                OnAuthenticationFailed = context =>
                {
                    Log.Warning("JWT Auth failed: {Error}. Path: {Path}",
                        context.Exception.Message, context.Request.Path);
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    var userId = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    var role = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                    Log.Information("JWT validated. UserId: {UserId}, Role: {Role}, Path: {Path}",
                        userId, role, context.Request.Path);
                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    Log.Warning("JWT Challenge. Error: {Error}, Path: {Path}",
                        context.Error, context.Request.Path);
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization();
        return services;
    }

    /// <summary>
    /// Register all application-level scoped services.
    /// </summary>
    public static IServiceCollection AddSkaEVApplicationServices(
        this IServiceCollection services, IConfiguration configuration)
    {
        // Core Logic Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IStationService, StationService>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IPaymentMethodService, PaymentMethodService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IStaffDashboardService, StaffDashboardService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<IVehicleService, VehicleService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IQRCodeService, QRCodeService>();
        services.AddScoped<IPostService, PostService>();
        services.AddScoped<ISlotService, SlotService>();
        services.AddScoped<IUserProfileService, UserProfileService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IIssueService, IssueService>();
        services.AddScoped<IVNPayService, VNPayService>();

        // Admin & Analytics Services
        services.AddScoped<IncidentService>();
        services.AddScoped<StationAnalyticsService>();
        services.AddScoped<IAdminStationManagementService, AdminStationManagementService>();
        services.AddScoped<IAdvancedAnalyticsService, AdvancedAnalyticsService>();
        services.AddScoped<IAdminStationService, AdminStationService>();

        // External Integrations
        services.AddHttpClient<IMapsService, MapsService>();
        services.AddVnpayClient(options => configuration.GetSection("VNPay").Bind(options));
        services.AddScoped<IPaymentProcessor, SimulatedPaymentProcessor>();

        // Configuration Options
        services.Configure<GoogleMapsOptions>(configuration.GetSection(GoogleMapsOptions.SectionName));

        return services;
    }

    /// <summary>
    /// Configure Swagger/OpenAPI documentation with JWT support.
    /// </summary>
    public static IServiceCollection AddSkaEVSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "SkaEV API",
                Version = "v1",
                Description = "Electric Vehicle Charging Station Management System API",
                Contact = new OpenApiContact { Name = "SWP391 G4 Topic 3", Email = "support@skaev.com" }
            });

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }
}
