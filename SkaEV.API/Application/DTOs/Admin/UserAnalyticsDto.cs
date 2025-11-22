namespace SkaEV.API.Application.DTOs.Admin;

/// <summary>
/// User analytics data with time-based metrics
/// </summary>
public class UserAnalyticsDto
{
    public string AnalysisPeriod { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // User counts
    public int TotalUsers { get; set; }
    public int NewUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }

    // Role distribution
    public Dictionary<string, int> UsersByRole { get; set; } = new();

    // Activity metrics
    public double AverageSessionsPerUser { get; set; }
    public decimal AverageSpendingPerUser { get; set; }
    public int TotalBookings { get; set; }
    public decimal TotalRevenue { get; set; }

    // Time series data
    public List<UserGrowthDataPoint> GrowthData { get; set; } = new();
    public List<UserActivityDataPoint> ActivityData { get; set; } = new();
}

public class UserGrowthDataPoint
{
    public DateTime Date { get; set; }
    public string Label { get; set; } = string.Empty;
    public int NewUsers { get; set; }
    public int TotalUsers { get; set; }
}

public class UserActivityDataPoint
{
    public DateTime Date { get; set; }
    public string Label { get; set; } = string.Empty;
    public int ActiveUsers { get; set; }
    public int TotalBookings { get; set; }
    public decimal Revenue { get; set; }
}

/// <summary>
/// Station analytics data with time-based metrics
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

public class StationRevenueDataPoint
{
    public DateTime Date { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Sessions { get; set; }
}

public class StationUsageDataPoint
{
    public DateTime Date { get; set; }
    public string Label { get; set; } = string.Empty;
    public int TotalBookings { get; set; }
    public int CompletedSessions { get; set; }
    public double UtilizationRate { get; set; }
}

public class StationPerformanceDataPoint
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Sessions { get; set; }
    public decimal EnergyDelivered { get; set; }
    public double UtilizationRate { get; set; }
}
