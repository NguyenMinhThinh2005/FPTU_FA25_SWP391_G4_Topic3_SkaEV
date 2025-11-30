namespace SkaEV.API.Application.DTOs.Admin;

/// <summary>
/// DTO phân tích dữ liệu người dùng với các chỉ số theo thời gian.
/// </summary>
public class UserAnalyticsDto
{
    /// <summary>
    /// Khoảng thời gian phân tích (ví dụ: "Last 30 days").
    /// </summary>
    public string AnalysisPeriod { get; set; } = string.Empty;

    /// <summary>
    /// Ngày bắt đầu.
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// Ngày kết thúc.
    /// </summary>
    public DateTime EndDate { get; set; }

    // User counts
    /// <summary>
    /// Tổng số người dùng.
    /// </summary>
    public int TotalUsers { get; set; }

    /// <summary>
    /// Số người dùng mới.
    /// </summary>
    public int NewUsers { get; set; }

    /// <summary>
    /// Số người dùng đang hoạt động.
    /// </summary>
    public int ActiveUsers { get; set; }

    /// <summary>
    /// Số người dùng không hoạt động.
    /// </summary>
    public int InactiveUsers { get; set; }

    // Role distribution
    /// <summary>
    /// Phân bố người dùng theo vai trò.
    /// </summary>
    public Dictionary<string, int> UsersByRole { get; set; } = new();

    // Activity metrics
    /// <summary>
    /// Số phiên trung bình mỗi người dùng.
    /// </summary>
    public double AverageSessionsPerUser { get; set; }

    /// <summary>
    /// Chi tiêu trung bình mỗi người dùng.
    /// </summary>
    public decimal AverageSpendingPerUser { get; set; }

    /// <summary>
    /// Tổng số lượt đặt chỗ.
    /// </summary>
    public int TotalBookings { get; set; }

    /// <summary>
    /// Tổng doanh thu.
    /// </summary>
    public decimal TotalRevenue { get; set; }

    // Time series data
    /// <summary>
    /// Dữ liệu tăng trưởng người dùng theo thời gian.
    /// </summary>
    public List<UserGrowthDataPoint> GrowthData { get; set; } = new();

    /// <summary>
    /// Dữ liệu hoạt động người dùng theo thời gian.
    /// </summary>
    public List<UserActivityDataPoint> ActivityData { get; set; } = new();
}

/// <summary>
/// Điểm dữ liệu tăng trưởng người dùng.
/// </summary>
public class UserGrowthDataPoint
{
    public DateTime Date { get; set; }
    public string Label { get; set; } = string.Empty;
    public int NewUsers { get; set; }
    public int TotalUsers { get; set; }
}

/// <summary>
/// Điểm dữ liệu hoạt động người dùng.
/// </summary>
public class UserActivityDataPoint
{
    public DateTime Date { get; set; }
    public string Label { get; set; } = string.Empty;
    public int ActiveUsers { get; set; }
    public int TotalBookings { get; set; }
    public decimal Revenue { get; set; }
}

/// <summary>
/// DTO phân tích dữ liệu trạm sạc với các chỉ số theo thời gian.
/// </summary>
public class StationAnalyticsDto
{
    public string AnalysisPeriod { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Station metrics
    public int TotalStations { get; set; }
    public int ActiveStations { get; set; }
    public int MaintenanceStations { get; set; }
    public int InactiveStations { get; set; }

    // Performance metrics
    public double AverageUtilizationRate { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageRevenuePerStation { get; set; }
    public int TotalSessions { get; set; }
    public decimal TotalEnergyDelivered { get; set; }

    // Time series data
    public List<StationRevenueDataPoint> RevenueData { get; set; } = new();
    public List<StationUsageDataPoint> UsageData { get; set; } = new();
    public List<StationPerformanceDataPoint> PerformanceData { get; set; } = new();
}

/// <summary>
/// Điểm dữ liệu doanh thu trạm.
/// </summary>
public class StationRevenueDataPoint
{
    public DateTime Date { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Sessions { get; set; }
}

/// <summary>
/// Điểm dữ liệu sử dụng trạm.
/// </summary>
public class StationUsageDataPoint
{
    public DateTime Date { get; set; }
    public string Label { get; set; } = string.Empty;
    public int TotalBookings { get; set; }
    public int CompletedSessions { get; set; }
    public double UtilizationRate { get; set; }
}

/// <summary>
/// Điểm dữ liệu hiệu suất trạm.
/// </summary>
public class StationPerformanceDataPoint
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Sessions { get; set; }
    public decimal EnergyDelivered { get; set; }
    public double UtilizationRate { get; set; }
}
