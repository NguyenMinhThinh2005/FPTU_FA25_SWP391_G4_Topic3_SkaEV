using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SkaEV.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace SkaEV.API.Infrastructure.Data;

public static class SeedSystemLogs
{
    /// <summary>
    /// Seed helpful admin activity & audit logs into the SystemLogs table.
    /// This is a safe, idempotent seeder that will only insert entries when there are none for the target admin(s).
    /// It is intended to be called from Program.cs during development/testing only.
    /// </summary>
    public static async Task SeedAsync(SkaEVDbContext context, ILogger logger)
    {
        if (context == null) throw new ArgumentNullException(nameof(context));

        try
        {
            // If there are already many system logs, skip seeding to avoid duplicates
            var existingCount = await context.SystemLogs.CountAsync();
            if (existingCount > 50)
            {
                logger.LogInformation("SystemLogs already populated ({Count} entries) - skipping seed.", existingCount);
                return;
            }

            // Find admin users to attach logs to (prefer real admin accounts)
            var admins = await context.Users.Where(u => u.Role == "admin").Take(5).ToListAsync();

            if (admins.Count == 0)
            {
                logger.LogWarning("No admin users found in database - seeding system logs without user association.");
            }

            var now = DateTime.UtcNow;

            // Create a list of sample actions
            var sampleActions = new[]
            {
                // Use allowed LogType values (error, warning, info, security)
                new { Type = "info", Severity = "medium", Message = "Tạo trạm sạc mới: Trạm A1", Endpoint = "/api/admin/stations", DelayMin = 120 },
                new { Type = "warning", Severity = "medium", Message = "Cập nhật trạng thái trạm: Trạm A1 -> inactive", Endpoint = "/api/admin/stations/{id}/status", DelayMin = 110 },
                new { Type = "info", Severity = "medium", Message = "Thêm trụ sạc vào Trạm A1", Endpoint = "/api/admin/stations/{id}/posts", DelayMin = 90 },
                new { Type = "warning", Severity = "low", Message = "Bật trụ sạc post-3 tại Trạm A1", Endpoint = "/api/admin/stations/{id}/control", DelayMin = 70 },
                new { Type = "info", Severity = "high", Message = "Chỉnh sửa chi tiết giá dịch vụ", Endpoint = "/api/admin/pricing", DelayMin = 60 },
                new { Type = "security", Severity = "high", Message = "Đổi quyền người dùng: user@demo -> staff", Endpoint = "/api/admin/users/{id}/role", DelayMin = 45 },
                new { Type = "security", Severity = "low", Message = "Đăng nhập quản trị (web)", Endpoint = "/api/auth/login", DelayMin = 30 },
                new { Type = "info", Severity = "low", Message = "Đã đồng bộ dữ liệu thử nghiệm", Endpoint = "/admin/seed", DelayMin = 15 }
            };

            var logsToAdd = admins.SelectMany((a, idx) =>
            {
                // For each admin create a few logs with different timestamps
                var userLogs = sampleActions.Select((s, j) => new SystemLog
                {
                    LogType = s.Type,
                    Severity = s.Severity,
                    Message = s.Message + (admins.Count > 1 ? $" (by {a.FullName})" : string.Empty),
                    StackTrace = null,
                    UserId = a.UserId,
                    IpAddress = "127.0.0.1",
                    Endpoint = s.Endpoint.Replace("{id}", "123"),
                    CreatedAt = now.AddMinutes(-(s.DelayMin + idx * 5 + j))
                }).ToList();

                return userLogs;
            }).ToList();

            // If no admins were found, create logs without user association
            if (logsToAdd.Count == 0)
            {
                logsToAdd = sampleActions.Select((s, j) => new SystemLog
                {
                    LogType = s.Type,
                    Severity = s.Severity,
                    Message = s.Message + " (seed)",
                    StackTrace = null,
                    UserId = null,
                    IpAddress = "127.0.0.1",
                    Endpoint = s.Endpoint.Replace("{id}", "123"),
                    CreatedAt = now.AddMinutes(-s.DelayMin - j)
                }).ToList();
            }

            await context.SystemLogs.AddRangeAsync(logsToAdd);
            await context.SaveChangesAsync();

            logger.LogInformation("Seeded {Count} system log entries.", logsToAdd.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error while seeding system logs");
        }
    }
}
