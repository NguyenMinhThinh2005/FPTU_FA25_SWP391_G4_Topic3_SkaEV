using Microsoft.EntityFrameworkCore;
using Serilog;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Extensions;

/// <summary>
/// Extension methods for WebApplication to modularize middleware and startup configuration.
/// </summary>
public static class WebApplicationExtensions
{
    /// <summary>
    /// Configure the middleware pipeline: exception handling, CORS, auth, routing.
    /// </summary>
    public static WebApplication UseSkaEVMiddleware(this WebApplication app)
    {
        // Global Exception Handler — must be first
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                var exceptionFeature = context.Features
                    .Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();

                if (exceptionFeature?.Error != null)
                    Log.Error(exceptionFeature.Error, "Unhandled exception occurred");

                await context.Response.WriteAsJsonAsync(new
                {
                    message = "An unexpected error occurred. Please try again later.",
                    details = app.Environment.IsDevelopment() ? exceptionFeature?.Error.Message : null
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

        // CORS → Logging → Auth → Routing
        app.UseCors("AllowFrontend");
        app.UseSerilogRequestLogging();
        app.UseAuthentication();
        app.UseAuthorization();

        // Endpoints
        app.MapControllers();
        app.MapHealthChecks("/health");

        return app;
    }

    /// <summary>
    /// Run data seeding and auto-migration for development/SQLite mode.
    /// </summary>
    public static async Task UseSkaEVSeedingAsync(
        this WebApplication app, IConfiguration configuration, bool isSqliteDemo)
    {
        var seedAdmin = configuration.GetValue<bool>("SeedAdminData", false);
        if (seedAdmin)
        {
            using var scope = app.Services.CreateScope();
            try
            {
                var context = scope.ServiceProvider.GetRequiredService<SkaEVDbContext>();
                var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
                var logger = loggerFactory.CreateLogger("SeedSystemLogs");
                await SeedSystemLogs.SeedAsync(context, logger);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "An error occurred while seeding the database.");
            }
        }

        // Auto-Migration (SQLite Demo Only)
        if (isSqliteDemo)
        {
            using var scope = app.Services.CreateScope();
            try
            {
                var context = scope.ServiceProvider.GetRequiredService<SkaEVDbContext>();
                context.Database.Migrate();
                Log.Information("Database migrations applied (SQLite demo).");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Failed to apply database migrations.");
            }
        }
    }
}
