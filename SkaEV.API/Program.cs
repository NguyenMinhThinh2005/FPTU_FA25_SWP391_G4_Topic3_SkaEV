using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Application.Options;
using SkaEV.API.Application.Services;
<<<<<<< HEAD
using SkaEV.API.Hubs;
=======
using SkaEV.API.Application.Services.Payments;
// using SkaEV.API.Hubs; // Uncomment when Hubs are implemented
>>>>>>> origin/develop
using Serilog;
using Serilog.Events;
using VNPAY.Extensions;

namespace SkaEV.API;

<<<<<<< HEAD
// Configure Serilog - Simple HTTP logging only
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Error)
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/skaev-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
        // Use camelCase for JSON property names (JavaScript convention)
        options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
    });

// Configure Database
builder.Services.AddDbContext<SkaEVDbContext>(options =>
=======
/// <summary>
/// Main entry point for the SkaEV API application.
/// Configures services, middleware pipeline, and starts the web host.
/// </summary>
public partial class Program
>>>>>>> origin/develop
{
    /// <summary>
    /// Application entry point.
    /// </summary>
    /// <param name="args">Command line arguments.</param>
    public static async Task Main(string[] args)
    {
        #region 1. Builder Initialization & Configuration
        
        // Create the WebApplication builder which sets up the hosting environment and configuration
        var builder = WebApplication.CreateBuilder(args);

        // Retrieve the default connection string from configuration
        var _defaultConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
        
        // Determine if we are running in SQLite Demo mode based on the connection string format
        // This allows the app to switch between SQL Server (Production) and SQLite (Dev/Demo) dynamically
        var _isSqliteDemo = _defaultConnectionString.IndexOf(".db", StringComparison.OrdinalIgnoreCase) >= 0
                            || _defaultConnectionString.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase);

        #endregion

        #region 2. Logging Configuration (Serilog)

        // Configure Serilog as the logging provider
        // We configure it early to capture startup errors
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information() // Default to Information level
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning) // Reduce noise from Microsoft framework
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Error) // Only log EF Core errors to keep logs clean
            .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning) // Reduce noise from ASP.NET Core
            .Enrich.FromLogContext() // Include context properties (like RequestId) in logs
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}") // Clean console output
            .WriteTo.File("logs/skaev-.txt", rollingInterval: RollingInterval.Day) // Rolling file logs for persistent storage
            .CreateLogger();

        // Hook Serilog into the host builder
        builder.Host.UseSerilog();

        #endregion

        #region 3. Service Registration (Dependency Injection)

        // === Core MVC & JSON Services ===
        builder.Services.AddControllers()
            .AddNewtonsoftJson(options =>
            {
                // Use camelCase for JSON properties to align with JavaScript/Frontend conventions
                options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
                // Ignore circular references to prevent stack overflow serialization errors
                options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
                // Ignore null values to reduce response payload size
                options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
            });

        // === Configuration Options ===
        // Bind "GoogleMaps" section to strong-typed options class
        builder.Services.Configure<GoogleMapsOptions>(builder.Configuration.GetSection(GoogleMapsOptions.SectionName));

<<<<<<< HEAD
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Set to true in production
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
});

builder.Services.AddAuthorization();

// Configure CORS (with SignalR support)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .SetIsOriginAllowed(_ => true); // For SignalR compatibility
    });
});

// Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStationService, StationService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IPaymentMethodService, PaymentMethodService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IStaffDashboardService, StaffDashboardService>();

// New Services
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IQRCodeService, QRCodeService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ISlotService, SlotService>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<IIssueService, IssueService>(); // Optional - requires 08_ADD_ISSUES_TABLE.sql
builder.Services.AddScoped<IncidentService>(); // Incident management service
builder.Services.AddScoped<StationAnalyticsService>(); // Station analytics service

// Real-time SignalR Notification Service
builder.Services.AddScoped<IStationNotificationService, StationNotificationService>();

// Admin Management Services
builder.Services.AddScoped<IAdminStationManagementService, AdminStationManagementService>();
// Temporarily commented out - services not implemented yet
// builder.Services.AddScoped<IMonitoringService, MonitoringService>(); // Real-time monitoring
// builder.Services.AddScoped<IDemandForecastingService, DemandForecastingService>(); // AI demand forecasting
// builder.Services.AddScoped<IAdvancedAnalyticsService, AdvancedAnalyticsService>(); // Advanced ML analytics

// Background Simulation Services (for student project demo) - DISABLED to prevent crashes
// builder.Services.AddHostedService<SkaEV.API.Services.ChargingSimulationService>();
// builder.Services.AddHostedService<SkaEV.API.Services.SystemEventsSimulationService>();

// Configure Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SkaEV API",
        Version = "v1",
        Description = "Electric Vehicle Charging Station Management System API",
        Contact = new OpenApiContact
=======
        // === Database Context Configuration ===
        builder.Services.AddDbContext<SkaEVDbContext>(options =>
>>>>>>> origin/develop
        {
            var connectionString = _defaultConnectionString;
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("DefaultConnection string is not configured.");
            }

            if (_isSqliteDemo)
            {
                // Use SQLite for local development or demo purposes
                options.UseSqlite(connectionString);
            }
            else
            {
                // Use SQL Server for production with resilient connection options
                options.UseSqlServer(
                    connectionString,
                    sqlOptions =>
                    {
                        sqlOptions.UseNetTopologySuite(); // Enable spatial data types (Geometry/Geography)
                        // Enable retry logic for transient network failures
                        sqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(30),
                            errorNumbersToAdd: null);
                    });
            }
        });

        // === Authentication & Authorization (JWT) ===
        var jwtSettings = builder.Configuration.GetSection("JwtSettings");
        // WARNING: Fallback key is for DEV ONLY. Production must use a secure key from config/secrets.
        var secretKey = jwtSettings["SecretKey"] ?? "SkaEV_Secret_Key_2025_Change_This_In_Production_Environment_12345678";
        var key = Encoding.ASCII.GetBytes(secretKey);

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false; // Set 'true' in production
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false, // Simplify for Dev: Ignore Issuer validation
                ValidateAudience = false, // Simplify for Dev: Ignore Audience validation
                ValidateLifetime = true, // Ensure token is not expired
                ClockSkew = TimeSpan.Zero // Remove default 5-minute leeway for expiration
            };
            
            // Add event handlers for debugging authentication issues
            options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var token = context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                    if (string.IsNullOrEmpty(token))
                    {
                        Log.Warning("JWT Token not found in Authorization header. Path: {Path}", context.Request.Path);
                    }
                    else
                    {
                        Log.Information("JWT Token received. Path: {Path}, Token length: {Length}", 
                            context.Request.Path, token.Length);
                    }
                    return Task.CompletedTask;
                },
                OnAuthenticationFailed = context =>
                {
                    Log.Warning("JWT Authentication failed: {Error}. Path: {Path}", 
                        context.Exception.Message, context.Request.Path);
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    var userId = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    var role = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                    Log.Information("JWT Token validated. UserId: {UserId}, Role: {Role}, Path: {Path}", 
                        userId, role, context.Request.Path);
                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    Log.Warning("JWT Challenge triggered. Error: {Error}, ErrorDescription: {ErrorDescription}, Path: {Path}", 
                        context.Error, context.ErrorDescription, context.Request.Path);
                    return Task.CompletedTask;
                }
            };
        });

        builder.Services.AddAuthorization();

        // === CORS Policy ===
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy.WithOrigins(
                    "http://localhost:5173", // Vite Local
                    "http://localhost:3000", // React Local
                    "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177" // Additional Vite ports
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()
                .SetIsOriginAllowed(_ => true); // Allow localhost origins
            });
        });

        // === Application Services (Scoped) ===
        // Core Logic Services
        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<IStationService, StationService>();
        builder.Services.AddScoped<IBookingService, BookingService>();
        builder.Services.AddScoped<IPaymentMethodService, PaymentMethodService>();
        builder.Services.AddScoped<IReportService, ReportService>();
        builder.Services.AddScoped<IStaffDashboardService, StaffDashboardService>();
        builder.Services.AddScoped<IInvoiceService, InvoiceService>();
        builder.Services.AddScoped<IVehicleService, VehicleService>();
        builder.Services.AddScoped<IReviewService, ReviewService>();
        builder.Services.AddScoped<INotificationService, NotificationService>();
        builder.Services.AddScoped<IQRCodeService, QRCodeService>();
        builder.Services.AddScoped<IPostService, PostService>();
        builder.Services.AddScoped<ISlotService, SlotService>();
        builder.Services.AddScoped<IUserProfileService, UserProfileService>();
        builder.Services.AddScoped<IAdminUserService, AdminUserService>();
        builder.Services.AddScoped<IIssueService, IssueService>(); // Incident/Issue tracking
        builder.Services.AddScoped<IVNPayService, VNPayService>();

        // Admin & Analytics Services
        builder.Services.AddScoped<IncidentService>();
        builder.Services.AddScoped<StationAnalyticsService>();
        builder.Services.AddScoped<IAdminStationManagementService, AdminStationManagementService>();
        builder.Services.AddScoped<IAdvancedAnalyticsService, AdvancedAnalyticsService>();
        builder.Services.AddScoped<IAdminStationService, AdminStationService>();

        // External Integrations
        // Register MapsService with a dedicated HttpClient
        builder.Services.AddHttpClient<IMapsService, MapsService>();
        // Register VNPay Client
        builder.Services.AddVnpayClient(options => builder.Configuration.GetSection("VNPay").Bind(options));
        // Payment Processor (Simulated)
        builder.Services.AddScoped<IPaymentProcessor, SimulatedPaymentProcessor>();

        // Background Services (Hosted)
        // Note: Currently disabled to prevent data noise during development/testing
        // builder.Services.AddHostedService<SkaEV.API.Application.Services.Simulation.ChargingSimulationService>();
        // builder.Services.AddHostedService<SkaEV.API.Application.Services.Simulation.SystemEventsSimulationService>();

        // === Swagger / OpenAPI Documentation ===
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "SkaEV API",
                Version = "v1",
                Description = "Electric Vehicle Charging Station Management System API",
                Contact = new OpenApiContact { Name = "SWP391 G4 Topic 3", Email = "support@skaev.com" }
            });

            // Configure JWT Auth support in Swagger UI
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

        // === Real-time Communication (SignalR) ===
        builder.Services.AddSignalR();

        // === Health Checks ===
        builder.Services.AddHealthChecks()
            .AddDbContextCheck<SkaEVDbContext>(); // Monitors DB connectivity

        #endregion

        #region 4. Build Application

        var app = builder.Build();

        #endregion

        #region 5. Middleware Pipeline Configuration

        // Global Exception Handler - Must be first to catch downstream errors
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();

                if (exceptionHandlerPathFeature?.Error != null)
                {
                    Log.Error(exceptionHandlerPathFeature.Error, "Unhandled exception occurred");
                }

                await context.Response.WriteAsJsonAsync(new
                {
                    message = "An unexpected error occurred. Please try again later.",
                    details = app.Environment.IsDevelopment() ? exceptionHandlerPathFeature?.Error.Message : null
                });
            });
        });

        // Swagger UI (Development Only)
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "SkaEV API v1");
                c.RoutePrefix = "swagger";
            });
        }

        // HTTPS Redirection (Disabled in dev for simpler local testing)
        // app.UseHttpsRedirection();

        // CORS - Must be before Auth
        app.UseCors("AllowFrontend");

        // Request Logging (Serilog)
        app.UseSerilogRequestLogging();

        // Authentication & Authorization
        app.UseAuthentication();
        app.UseAuthorization();

        // Endpoint Routing
        app.MapControllers();
        app.MapHealthChecks("/health");
        
        // SignalR Hub Mapping (Commented out until Hub is implemented)
        // app.MapHub<StationMonitoringHub>("/hubs/station-monitoring");

        #endregion

        #region 6. Startup Logic & Run

        try
        {
            Log.Information("Starting SkaEV API in {Environment} mode...", app.Environment.EnvironmentName);

            // === Development Data Seeding ===
            var seedAdmin = builder.Configuration.GetValue<bool>("SeedAdminData", false);
            if (seedAdmin)
            {
                using (var scope = app.Services.CreateScope())
                {
                    var services = scope.ServiceProvider;
                    try
                    {
                        var context = services.GetRequiredService<SkaEVDbContext>();
                        var loggerFactory = services.GetRequiredService<Microsoft.Extensions.Logging.ILoggerFactory>();
                        var logger = loggerFactory.CreateLogger("SeedSystemLogs");

                        await SeedSystemLogs.SeedAsync(context, logger);
                    }
                    catch (Exception ex)
                    {
                        Log.Error(ex, "An error occurred while seeding the database.");
                    }
                }
            }

            // === Auto-Migration (SQLite Demo Only) ===
            // We only auto-migrate for SQLite to ensure the file exists. 
            // For SQL Server, we prefer manual migration control to avoid accidental production schema changes.
            if (_isSqliteDemo)
            {
                using (var scope = app.Services.CreateScope())
                {
                    var services = scope.ServiceProvider;
                    try
                    {
                        var context = services.GetRequiredService<SkaEVDbContext>();
                        context.Database.Migrate();
                        Log.Information("Database migrations applied (development/SQLite demo).");
                    }
                    catch (Exception ex)
                    {
                        Log.Error(ex, "Failed to apply database migrations.");
                    }
                }
            }

            // Start the web host
            Log.Information("Backend is now running.");
            app.Run();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "SkaEV API terminated unexpectedly!");
        }
        finally
        {
            Log.Information("Shutting down...");
            await Log.CloseAndFlushAsync();
        }

        #endregion
    }
}
<<<<<<< HEAD

// Disable HTTPS redirection in development for easier testing
// app.UseHttpsRedirection();

// IMPORTANT: CORS must be before Authentication/Authorization
app.UseCors("AllowFrontend");

app.UseSerilogRequestLogging();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health");

// Map SignalR Hub for real-time updates
app.MapHub<StationMonitoringHub>("/hubs/station-monitoring");

try
{
    Log.Information("Starting SkaEV API...");
    Log.Information("Environment: {0}", app.Environment.EnvironmentName);

    // Start the application asynchronously
    _ = app.RunAsync();

    Log.Information("Backend is now running. Press ENTER to stop...");

    // Keep console alive
    Console.ReadLine();

    // Initiate shutdown
    await app.StopAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "SkaEV API terminated unexpectedly!");
}
finally
{
    Log.Information("Shutting down...");
    await Log.CloseAndFlushAsync();
}
=======
>>>>>>> origin/develop
