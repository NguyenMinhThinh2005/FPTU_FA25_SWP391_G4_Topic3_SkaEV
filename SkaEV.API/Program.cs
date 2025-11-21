using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Application.Services;
// using SkaEV.API.Hubs; // Temporarily commented out
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// Read connection string early so we can adapt behavior (SQLite demo vs full SQL Server)
var _defaultConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
var _isSqliteDemo = _defaultConnectionString.IndexOf(".db", StringComparison.OrdinalIgnoreCase) >= 0
                    || _defaultConnectionString.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase);

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
        // Use camelCase property names for all JSON responses to match frontend expectations
        options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
    });

// Configure Database
builder.Services.AddDbContext<SkaEVDbContext>(options =>
{
    var connectionString = _defaultConnectionString;

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("DefaultConnection string is not configured.");
    }

    if (_isSqliteDemo)
    {
        options.UseSqlite(connectionString);
    }
    else
    {
        options.UseSqlServer(
            connectionString,
            sqlOptions =>
            {
                sqlOptions.UseNetTopologySuite();
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            });
    }
});

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "SkaEV_Secret_Key_2025_Change_This_In_Production_Environment_12345678";
var key = Encoding.ASCII.GetBytes(secretKey);

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

// Admin Management Services
builder.Services.AddScoped<IAdminStationManagementService, AdminStationManagementService>();
// Temporarily commented out - services not implemented yet
// builder.Services.AddScoped<IMonitoringService, MonitoringService>(); // Real-time monitoring
// builder.Services.AddScoped<IDemandForecastingService, DemandForecastingService>(); // AI demand forecasting
// builder.Services.AddScoped<IAdvancedAnalyticsService, AdvancedAnalyticsService>(); // Advanced ML analytics

// Background Simulation Services (for student project demo)
// Disabled by default during developer-driven feature runs to avoid background exceptions
// that interfere with API testing. Toggle back if you need simulations.
if (!_isSqliteDemo && false)
{
    builder.Services.AddHostedService<SkaEV.API.Services.ChargingSimulationService>();
    builder.Services.AddHostedService<SkaEV.API.Services.SystemEventsSimulationService>();
}

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
        {
            Name = "SWP391 G4 Topic 3",
            Email = "support@skaev.com"
        }
    });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
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
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Add SignalR for real-time updates
builder.Services.AddSignalR();

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<SkaEVDbContext>();

var app = builder.Build();

// Configure the HTTP request pipeline

// Global exception handler (must be first)
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        var exceptionHandlerPathFeature =
            context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();

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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SkaEV API v1");
        c.RoutePrefix = "swagger"; // Swagger at /swagger
    });
}

// Disable HTTPS redirection in development for easier testing
// app.UseHttpsRedirection();

// IMPORTANT: CORS must be before Authentication/Authorization
app.UseCors("AllowFrontend");

app.UseSerilogRequestLogging();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health");

// Map SignalR Hub - Temporarily commented out
// app.MapHub<StationMonitoringHub>("/hubs/station-monitoring");

try
{
    Log.Information("Starting SkaEV API...");
    Log.Information("Environment: {0}", app.Environment.EnvironmentName);

    // Optionally run development-only seeders if configuration requests it
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

    // Apply EF Core migrations automatically only for the SQLite demo so the DB file
    // is created and the schema is available when running locally without SQL Server.
    // Avoid auto-migrating against a fresh SQL Server container to prevent unexpected
    // schema operations in environments where a production DB is expected.
    if (_isSqliteDemo)
    {
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            try
            {
                var context = services.GetRequiredService<SkaEVDbContext>();
                // Apply pending migrations (safe in local/dev environments)
                context.Database.Migrate();
                Log.Information("Database migrations applied (development/SQLite demo).");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Failed to apply database migrations.");
            }
        }
    }

    // Start the application (blocking). This keeps the host running normally in dev/test runs.
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

    // Expose Program type for integration tests (WebApplicationFactory<Program>)
    public partial class Program { }