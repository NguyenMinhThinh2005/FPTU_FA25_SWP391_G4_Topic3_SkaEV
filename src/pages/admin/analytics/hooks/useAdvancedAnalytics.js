import { useState, useEffect, useCallback } from "react";
import reportsAPI from "../../../../services/api/reportsAPI";

const formatPeriodLabel = (year, month) => {
  if (!year) {
    return "Không xác định";
  }
  if (!month) {
    return `${year}`;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
};

export const useAdvancedAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dateMode = 'day'; 
  const [selectedFrom, setSelectedFrom] = useState(() => { 
    const d = new Date(); 
    d.setDate(d.getDate() - 29); 
    d.setHours(0,0,0,0); 
    return d; 
  });
  const [selectedTo, setSelectedTo] = useState(() => { 
    const d = new Date(); 
    d.setHours(23,59,59,999); 
    return d; 
  });

  const [revenueData, setRevenueData] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [stationPerformanceData, setStationPerformanceData] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [revenueByConnectorData, setRevenueByConnectorData] = useState([]);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let from = selectedFrom ? new Date(selectedFrom) : null;
      let to = selectedTo ? new Date(selectedTo) : null;

      if (dateMode === 'day') {
        if (!from) { from = new Date(); from.setDate(from.getDate() - 29); }
        from.setHours(0,0,0,0);
        if (!to) { to = new Date(); }
        to.setHours(23,59,59,999);
      } else if (dateMode === 'month') {
        if (!from) from = new Date();
        from = new Date(from.getFullYear(), from.getMonth(), 1, 0, 0, 0, 0);
        if (!to) to = new Date();
        to = new Date(to.getFullYear(), to.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (dateMode === 'year') {
        if (!from) from = new Date();
        from = new Date(from.getFullYear(), 0, 1, 0, 0, 0, 0);
        if (!to) to = new Date();
        to = new Date(to.getFullYear(), 11, 31, 23, 59, 59, 999);
      }

      if (from && to && from > to) {
        const tmp = from; from = to; to = tmp;
      }

      const paramsWithTimestamps = {
        startDate: from ? from.toISOString() : undefined,
        endDate: to ? to.toISOString() : undefined,
        granularity: dateMode === 'day' ? 'daily' : dateMode === 'month' ? 'monthly' : 'yearly'
      };

      const msPerDay = 24 * 60 * 60 * 1000;
      const diffDays = from && to ? Math.ceil((to - from) / msPerDay) + 1 : 30;
      const peakDateRange = diffDays <= 7 ? 'last7days' : diffDays <= 30 ? 'last30days' : 'last90days';

      const [
        revenueResponse,
        usageResponse,
        performanceResponse,
        peakHoursResponse,
        revenueByConnectorResponse,
      ] = await Promise.all([
        reportsAPI.getRevenueReports(paramsWithTimestamps),
        reportsAPI.getUsageReports(paramsWithTimestamps),
        reportsAPI.getStationPerformance(),
        reportsAPI.getPeakHours({ dateRange: peakDateRange }),
        reportsAPI.getRevenueByConnector(paramsWithTimestamps),
      ]);

      setRevenueData(revenueResponse.data || []);
      setUsageData(usageResponse.data || []);
      setStationPerformanceData(performanceResponse.data || []);
      
      const connectorData = revenueByConnectorResponse?.data || revenueByConnectorResponse || [];
      setRevenueByConnectorData(connectorData);
      setPeakHoursData(peakHoursResponse.data?.hourlyDistribution || []);
      
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(
        err?.message ||
          "Không thể tải dữ liệu phân tích. Vui lòng kiểm tra backend, seed dữ liệu báo cáo hoặc thử lại."
      );
      setRevenueData([]);
      setUsageData([]);
      setStationPerformanceData([]);
      setPeakHoursData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFrom, selectedTo, dateMode]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const calculateKPIs = () => {
    const stationRevenueSum = stationPerformanceData.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
    const stationEnergySum = stationPerformanceData.reduce((sum, s) => sum + (s.totalEnergyDelivered || 0), 0);
    const stationSessionsSum = stationPerformanceData.reduce((sum, s) => sum + (s.completedSessions || 0), 0);

    const totalRevenueFromRevenueData = revenueData.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const totalEnergyFromRevenueData = revenueData.reduce((sum, r) => sum + (r.totalEnergySoldKwh || 0), 0);

    const totalRevenue = stationPerformanceData.length > 0 ? stationRevenueSum : totalRevenueFromRevenueData;
    const totalEnergy = stationPerformanceData.length > 0 ? stationEnergySum : totalEnergyFromRevenueData;

    const sessionsFromUsage = usageData.reduce((sum, u) => sum + (u.completedSessions || 0), 0);
    const bookingsFromUsage = usageData.reduce((sum, u) => sum + (u.totalBookings || 0), 0);
    const sessionsFromRevenue = revenueData.reduce((sum, r) => sum + (r.totalTransactions || 0), 0);

    const resolvedSessions = stationPerformanceData.length > 0
      ? stationSessionsSum
      : sessionsFromUsage > 0
      ? sessionsFromUsage
      : sessionsFromRevenue;

    const resolvedBookings = bookingsFromUsage > 0 ? bookingsFromUsage : Math.max(sessionsFromRevenue, bookingsFromUsage);

    let avgUtilization = 0;
    if (usageData.length > 0) {
      avgUtilization = usageData.reduce((sum, u) => sum + (u.utilizationRatePercent || 0), 0) / usageData.length;
    } else if (stationPerformanceData.length > 0) {
      avgUtilization = stationPerformanceData.reduce((sum, s) => sum + (s.utilizationRate || s.currentOccupancyPercent || 0), 0) / stationPerformanceData.length;
    }

    const halfLength = Math.ceil(revenueData.length / 2);
    const firstHalf = revenueData.slice(0, halfLength);
    const secondHalf = revenueData.slice(halfLength);
    const firstHalfRevenue = firstHalf.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const secondHalfRevenue = secondHalf.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const revenueGrowth = firstHalfRevenue > 0 
      ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
      : 0;

    const baseKpis = {
      totalRevenue,
      totalSessions: resolvedSessions,
      totalBookings: resolvedBookings,
      totalEnergy,
      avgUtilization: Math.min(Math.max(avgUtilization, 0), 100),
      revenueGrowth,
    };

    return {
      ...baseKpis,
      arps: baseKpis.totalSessions > 0 ? baseKpis.totalRevenue / baseKpis.totalSessions : 0,
      conversionRate:
        baseKpis.totalBookings > 0 ? (baseKpis.totalSessions / baseKpis.totalBookings) * 100 : null,
    };
  };

  const getRevenueChartData = () => {
    if (revenueData.length === 0) return [];
    const grouped = {};

    revenueData.forEach((item) => {
      const isoDate = item.date || item.dateIso || item.dateLabelIso;
      const dateLabel = item.dateLabel
        || (isoDate ? new Date(isoDate).toLocaleDateString() : formatPeriodLabel(item.year, item.month));

      const _sortKey = isoDate || (item.year ? `${item.year}-${String(item.month || 1).padStart(2, "0")}-01` : dateLabel);

      if (!grouped[_sortKey]) grouped[_sortKey] = { dateLabel, _sortKey, revenue: 0, sessions: 0, energy: 0 };
      grouped[_sortKey].revenue += item.totalRevenue || 0;
      grouped[_sortKey].sessions += item.totalTransactions || 0;
      grouped[_sortKey].energy += item.totalEnergySoldKwh || 0;
    });

    return Object.values(grouped)
      .sort((a, b) => (a._sortKey > b._sortKey ? 1 : a._sortKey < b._sortKey ? -1 : 0))
      .map((v) => {
        const { _sortKey, dateLabel, ...rest } = v;
        const dateISO = v._sortKey && !isNaN(Date.parse(v._sortKey))
          ? new Date(v._sortKey).toISOString()
          : null;
        return { dateLabel, dateISO, ...rest };
      });
  };

  const detectGranularity = (series) => {
    if (!series || series.length < 2) return 'daily';
    const dates = series
      .map((s) => s.dateISO && !isNaN(Date.parse(s.dateISO)) ? new Date(s.dateISO) : null)
      .filter(Boolean);
    if (dates.length < 2) {
      const monthlyLike = series.every((s) => /^\d{4}-\d{2}/.test(s.dateLabel));
      return monthlyLike ? 'monthly' : 'daily';
    }
    let totalGap = 0;
    let gaps = 0;
    for (let i = 1; i < dates.length; i++) {
      const diffDays = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      totalGap += Math.abs(diffDays);
      gaps++;
    }
    const avgGap = totalGap / Math.max(1, gaps);
    if (avgGap > 25) return 'monthly';
    return 'daily';
  };

  const getEnergyUtilizationData = () => {
    if (revenueData.length === 0 && usageData.length === 0 && stationPerformanceData.length === 0) {
      return [];
    }

    const stationMap = new Map();

    const ensureStationEntry = (stationId, stationName = null) => {
      if (!stationMap.has(stationId)) {
        stationMap.set(stationId, {
          stationId,
          label: stationName || `Trạm ${stationId}`,
          energy: 0,
          utilizationSamples: [],
        });
      }
      return stationMap.get(stationId);
    };

    revenueData.forEach((item) => {
      const entry = ensureStationEntry(item.stationId, item.stationName);
      entry.energy += item.totalEnergySoldKwh || 0;
    });

    usageData.forEach((item) => {
      const entry = ensureStationEntry(item.stationId, item.stationName);
      if (typeof item.utilizationRatePercent === "number" && !Number.isNaN(item.utilizationRatePercent)) {
        entry.utilizationSamples.push(item.utilizationRatePercent);
      }
    });

    stationPerformanceData.forEach((item) => {
      const entry = ensureStationEntry(item.stationId, item.stationName);
      if (entry.utilizationSamples.length === 0 && typeof item.utilizationRate === "number") {
        entry.utilizationSamples.push(item.utilizationRate);
      }
    });

    return Array.from(stationMap.values())
      .map((entry) => {
        const utilization = entry.utilizationSamples.length > 0
          ? entry.utilizationSamples.reduce((sum, val) => sum + val, 0) / entry.utilizationSamples.length
          : 0;

        return {
          label: entry.label,
          energy: Number(entry.energy.toFixed(2)),
          utilization: Math.min(Math.max(utilization, 0), 100),
        };
      })
      .filter((entry) => entry.energy > 0 || entry.utilization > 0)
      .sort((a, b) => b.energy - a.energy)
      .slice(0, 12);
  };

  const getRevenueByType = () => {
    if (revenueByConnectorData && revenueByConnectorData.length > 0) {
      return revenueByConnectorData.map((r) => ({
        name: r.connectorType || r.connector || 'Unknown',
        revenue: r.totalRevenue || 0,
        value: r.totalRevenue || 0,
      }));
    }

    if (revenueData.length === 0) return [];

    const connectorAgg = {};
    revenueData.forEach((item) => {
      const connectors = item.connectorTypes || item.stationConnectorTypes || [];
      if (Array.isArray(connectors) && connectors.length > 0) {
        connectors.forEach((c) => {
          const key = c || 'Unknown';
          connectorAgg[key] = (connectorAgg[key] || 0) + (item.totalRevenue || 0);
        });
      } else {
        connectorAgg['Unknown'] = (connectorAgg['Unknown'] || 0) + (item.totalRevenue || 0);
      }
    });

    return Object.entries(connectorAgg).map(([name, revenue]) => ({ name, revenue, value: revenue }));
  };

  const computeRangeDays = () => {
    const from = selectedFrom ? new Date(selectedFrom) : null;
    const to = selectedTo ? new Date(selectedTo) : null;
    if (!from || !to) return 30;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((to - from) / msPerDay) + 1;
  };

  const kpis = calculateKPIs();
  const revenueSeries = getRevenueChartData();
  const revenueGranularity = detectGranularity(revenueSeries);
  const energyUtilizationData = getEnergyUtilizationData();
  const revenueByTypeData = getRevenueByType().sort((a, b) => b.revenue - a.revenue);
  
  const topStations = (stationPerformanceData || [])
    .slice()
    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
    .slice(0, 10);

  const tableTotals = {
    revenue: topStations.reduce((s, st) => s + (st.totalRevenue || 0), 0),
    energy: topStations.reduce((s, st) => s + (st.totalEnergyDelivered || 0), 0),
    sessions: topStations.reduce((s, st) => s + (st.completedSessions || 0), 0),
  };

  const rangeDaysNow = computeRangeDays();
  const shouldShowPerStation = rangeDaysNow <= 30 && revenueSeries.length <= 1;
  const stationBars = (topStations || []).map((s) => ({
    name: s.stationName || `Trạm ${s.stationId}`,
    revenue: s.totalRevenue || 0,
    sessions: s.completedSessions || 0,
  }));

  return {
    loading,
    error,
    dateMode,
    selectedFrom,
    setSelectedFrom,
    selectedTo,
    setSelectedTo,
    fetchAnalyticsData,
    kpis,
    revenueSeries,
    revenueGranularity,
    energyUtilizationData,
    revenueByTypeData,
    peakHoursData,
    topStations,
    tableTotals,
    shouldShowPerStation,
    stationBars,
    setError
  };
};
