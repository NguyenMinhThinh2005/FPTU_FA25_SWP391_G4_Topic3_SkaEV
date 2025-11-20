using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Application.Options;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.Services.Payments;
// using SkaEV.API.Hubs; // Temporarily commented out
using Serilog;
using Serilog.Events;
using VNPAY.Extensions;


public partial class Program
{
    public static async Task Main(string[] args)
    {
        // Create a builder for the web application. This is the starting point for configuring services and the app's request pipeline.
        var builder = WebApplication.CreateBuilder(args);
        // Read connection string early so we can adapt behavior (SQLite demo vs full SQL Server)
        var _defaultConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
        var _isSqliteDemo = _defaultConnectionString.IndexOf(".db", StringComparison.OrdinalIgnoreCase) >= 0
                            || _defaultConnectionString.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase);
        // Configure Serilog - A structured logging library for .NET
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information() // Set the minimum log level to Information
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning) // Reduce noise from Microsoft libraries
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Error) // Only log EF Core errors to keep logs clean
            .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning) // Reduce noise from ASP.NET Core
            .Enrich.FromLogContext() // Include context information in logs
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}") // Format console output
            .WriteTo.File("logs/skaev-.txt", rollingInterval: RollingInterval.Day) // Write logs to a file, creating a new file each day
            .CreateLogger();

        // Tell the host to use Serilog as the logging provider
        builder.Host.UseSerilog();

        // Add services to the container (Dependency Injection)
        // Add controllers and configure JSON serialization options
        builder.Services.AddControllers()
            .AddNewtonsoftJson(options =>
            {
                // Use camelCase property names for all JSON responses to match frontend expectations
                options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
                options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
                // Ignore null values to reduce payload size
                options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
            });

        // Bind configuration section "GoogleMaps" to the GoogleMapsOptions class for dependency injection
        builder.Services.Configure<GoogleMapsOptions>(builder.Configuration.GetSection(GoogleMapsOptions.SectionName));

        // Configure Database Context
        builder.Services.AddDbContext<SkaEVDbContext>(options =>
        {
            var connectionString = _defaultConnectionString;
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("DefaultConnection string is not configured.");
            }
            if (_isSqliteDemo)
            {
                // Use SQLite provider
                options.UseSqlite(connectionString);
            }
            else
            {
                // Use SQL Server provider with specific options
                options.UseSqlServer(
                    connectionString,
                    sqlOptions =>
                    {
                        sqlOptions.UseNetTopologySuite(); // Enable spatial data support (for maps/locations)
                        // Enable automatic retries for transient failures (e.g., network blips)
                        sqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(30),
                            errorNumbersToAdd: null);
                    });
            }
        });

        // Configure JWT (JSON Web Token) Authentication
        var jwtSettings = builder.Configuration.GetSection("JwtSettings");
        // Get the secret key, falling back to a default if not found (Note: Default should not be used in production)
        var secretKey = jwtSettings["SecretKey"] ?? "SkaEV_Secret_Key_2025_Change_This_In_Production_Environment_12345678";
        var key = Encoding.ASCII.GetBytes(secretKey);

        // Add Authentication services
        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme; // Use JWT Bearer as default scheme
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false; // Set to true in production to ensure HTTPS
            options.SaveToken = true; // Save the token in the AuthenticationProperties
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true, // Validate the key used to sign the token
                IssuerSigningKey = new SymmetricSecurityKey(key), // The key to validate against
                ValidateIssuer = false, // Do not validate the issuer (who created the token) - simplify for dev
                ValidateAudience = false, // Do not validate the audience (who the token is for) - simplify for dev
                ValidateLifetime = true, // Validate that the token has not expired
                ClockSkew = TimeSpan.Zero // Remove default 5 min clock skew for strict expiration
            };
        });

        // Add Authorization services
        builder.Services.AddAuthorization();

        // Configure CORS (Cross-Origin Resource Sharing) to allow frontend applications to access the API
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy.WithOrigins(
                    "http://localhost:5173", // Vite default
                    "http://localhost:3000", // React default
                    "http://localhost:5174",
                    "http://localhost:5175",
                    "http://localhost:5176",
                    "http://localhost:5177"
                )
                .AllowAnyHeader() // Allow any HTTP header
                .AllowAnyMethod() // Allow any HTTP method (GET, POST, PUT, DELETE, etc.)
                .AllowCredentials() // Allow cookies/auth headers
                .SetIsOriginAllowed(_ => true); // Allow any origin (useful for development, restrict in production)
            });
        });

        // Register Application Services (Dependency Injection)
        // Scoped services are created once per client request (connection)
        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<IStationService, StationService>();
        builder.Services.AddScoped<IBookingService, BookingService>();
        builder.Services.AddScoped<IPaymentMethodService, PaymentMethodService>();
        builder.Services.AddScoped<IReportService, ReportService>();
        builder.Services.AddScoped<IStaffDashboardService, StaffDashboardService>();

        // New Services for extended functionality
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
        builder.Services.AddScoped<IVNPayService, VNPayService>();

        // Additional admin and analytics services
        builder.Services.AddScoped<IncidentService>(); // Incident management service
        builder.Services.AddScoped<StationAnalyticsService>(); // Station analytics service
        builder.Services.AddScoped<IAdminStationManagementService, AdminStationManagementService>();

        // Maps Service with HttpClient - Registers HttpClient to be injected into MapsService
        builder.Services.AddHttpClient<IMapsService, MapsService>();

        // Register VNPay client with configuration
        builder.Services.AddVnpayClient(options => builder.Configuration.GetSection("VNPay").Bind(options));

        // Payment Services - Using Simulated Processor for now
        builder.Services.AddScoped<SkaEV.API.Application.Services.Payments.IPaymentProcessor, SkaEV.API.Application.Services.Payments.SimulatedPaymentProcessor>();

        // Background Simulation Services (Hosted Services run in the background for the lifetime of the app)
        builder.Services.AddHostedService<SkaEV.API.Services.ChargingSimulationService>(); // Simulates charging progress
        builder.Services.AddHostedService<SkaEV.API.Services.SystemEventsSimulationService>(); // Simulates system events

        // Configure Swagger/OpenAPI for API documentation
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

            // Add JWT Authentication support to Swagger UI
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

        // Add SignalR for real-time updates (WebSockets)
        builder.Services.AddSignalR();

        // Add Health Checks to monitor application status
        builder.Services.AddHealthChecks()
            .AddDbContextCheck<SkaEVDbContext>(); // Check if database is accessible

        // Build the application
        var app = builder.Build();

        // Configure the HTTP request pipeline (Middleware)

        // Global exception handler (must be first to catch exceptions from other middleware)
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

        // Configure Swagger UI in Development environment
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "SkaEV API v1");
                c.RoutePrefix = "swagger"; // Swagger UI available at /swagger
            });
        }

        // Disable HTTPS redirection in development for easier testing
        // app.UseHttpsRedirection();

        // IMPORTANT: CORS must be configured before Authentication/Authorization
        app.UseCors("AllowFrontend");

        // Enable Serilog request logging
        app.UseSerilogRequestLogging();

        // Enable Authentication and Authorization middleware
        app.UseAuthentication();
        app.UseAuthorization();

        // Map controller routes
        app.MapControllers();

        // Map health check endpoint
        app.MapHealthChecks("/health");

        // Map SignalR Hub - Temporarily commented out
        // app.MapHub<StationMonitoringHub>("/hubs/station-monitoring");

        try
        {
            Log.Information("Starting SkaEV API in {Environment} mode...", app.Environment.EnvironmentName);

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
    }
}
