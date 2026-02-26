using Serilog;
using Serilog.Events;
using SkaEV.API.Extensions;

namespace SkaEV.API;

/// <summary>
/// Main entry point for the SkaEV API application.
/// Service registration and middleware are modularized via extension methods
/// in the Extensions/ folder for readability and maintainability.
/// </summary>
public partial class Program
{
    public static async Task Main(string[] args)
    {
        // ─── 1. Builder & Configuration ────────────────────────────
        var builder = WebApplication.CreateBuilder(args);

        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
        var isSqliteDemo = connectionString.IndexOf(".db", StringComparison.OrdinalIgnoreCase) >= 0
                           || connectionString.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase);

        // ─── 2. Logging (Serilog) ──────────────────────────────────
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

        // ─── 3. Service Registration (via extension methods) ───────
        builder.Services.AddControllers()
            .AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.ContractResolver =
                    new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
                options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
                options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
            });

        builder.Services.AddSkaEVDatabase(connectionString, isSqliteDemo);
        builder.Services.AddSkaEVAuthentication(builder.Configuration);
        builder.Services.AddSkaEVApplicationServices(builder.Configuration);
        builder.Services.AddSkaEVSwagger();

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy.WithOrigins(
                    "http://localhost:5173", "http://localhost:3000",
                    "http://localhost:5174", "http://localhost:5175",
                    "http://localhost:5176", "http://localhost:5177")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()
                .SetIsOriginAllowed(_ => true);
            });
        });

        builder.Services.AddSignalR();
        builder.Services.AddHealthChecks()
            .AddDbContextCheck<SkaEV.API.Infrastructure.Data.SkaEVDbContext>();

        // ─── 4. Build & Configure Pipeline ─────────────────────────
        var app = builder.Build();
        app.UseSkaEVMiddleware();

        // ─── 5. Startup & Run ──────────────────────────────────────
        try
        {
            Log.Information("Starting SkaEV API in {Environment} mode...", app.Environment.EnvironmentName);
            await app.UseSkaEVSeedingAsync(builder.Configuration, isSqliteDemo);
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
