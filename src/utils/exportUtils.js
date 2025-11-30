import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {string} sheetName - Name of the Excel sheet
 */
export const exportToExcel = (data, filename = "report", sheetName = "Data") => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);

    return { success: true, message: "Xuất Excel thành công!" };
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return { success: false, message: "Lỗi khi xuất Excel" };
  }
};

/**
 * Export data to PDF file with table
 * @param {Object} options - Configuration options
 * @param {string} options.title - Title of the PDF
 * @param {Array} options.headers - Array of column headers
 * @param {Array} options.data - Array of arrays (rows of data)
 * @param {string} options.filename - Name of the file (without extension)
 */
export const exportToPDF = ({
  title = "Báo cáo",
  headers = [],
  data = [],
  filename = "report",
}) => {
  try {
    // Create new PDF document (A4, portrait)
    const doc = new jsPDF("p", "mm", "a4");

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Add date
    doc.setFontSize(10);
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`, 14, 28);

    // Add table using autoTable
    doc.autoTable({
      head: [headers],
      body: data,
      startY: 35,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Save the PDF
    doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);

    return { success: true, message: "Xuất PDF thành công!" };
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    return { success: false, message: "Lỗi khi xuất PDF" };
  }
};

/**
 * Format currency for display
 * @param {number} amount - Amount in VND
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("vi-VN");
};

/**
 * Export revenue report to Excel
 * @param {Object} revenueData - Revenue data from API
 * @param {string} dateRange - Date range label
 */
export const exportRevenueToExcel = (revenueData, dateRange) => {
  if (!revenueData || !revenueData.timeSeries) {
    return { success: false, message: "Không có dữ liệu để xuất" };
  }

  const data = revenueData.timeSeries.map((item) => ({
    "Ngày": formatDate(item.date),
    "Doanh thu (VND)": item.revenue,
    "Số giao dịch": item.transactions || 0,
  }));

  // Add summary row
  data.push({
    "Ngày": "TỔNG CỘNG",
    "Doanh thu (VND)": revenueData.totalRevenue,
    "Số giao dịch": data.reduce((sum, row) => sum + (row["Số giao dịch"] || 0), 0),
  });

  return exportToExcel(data, `bao-cao-doanh-thu-${dateRange}`, "Doanh thu");
};

/**
 * Export revenue report to PDF
 * @param {Object} revenueData - Revenue data from API
 * @param {string} dateRange - Date range label
 */
export const exportRevenueToPDF = (revenueData, dateRange) => {
  if (!revenueData || !revenueData.timeSeries) {
    return { success: false, message: "Không có dữ liệu để xuất" };
  }

  const headers = ["Ngày", "Doanh thu (VND)", "Số giao dịch"];
  const data = revenueData.timeSeries.map((item) => [
    formatDate(item.date),
    formatCurrency(item.revenue),
    item.transactions || 0,
  ]);

  // Add summary row
  data.push([
    "TỔNG CỘNG",
    formatCurrency(revenueData.totalRevenue),
    data.reduce((sum, row) => sum + row[2], 0),
  ]);

  return exportToPDF({
    title: `Báo cáo Doanh thu - ${dateRange}`,
    headers,
    data,
    filename: `bao-cao-doanh-thu-${dateRange}`,
  });
};

/**
 * Export energy report to Excel
 * @param {Object} energyData - Energy data from API
 * @param {string} dateRange - Date range label
 */
export const exportEnergyToExcel = (energyData, dateRange) => {
  if (!energyData || !energyData.byStation) {
    return { success: false, message: "Không có dữ liệu để xuất" };
  }

  const data = energyData.byStation.map((item) => ({
    "Trạm": item.stationName,
    "Năng lượng (kWh)": item.energy?.toFixed(2) || 0,
    "Số phiên": item.sessions || 0,
    "Trung bình (kWh/phiên)": item.avgEnergy?.toFixed(2) || 0,
  }));

  // Add summary row
  data.push({
    "Trạm": "TỔNG CỘNG",
    "Năng lượng (kWh)": energyData.totalEnergy?.toFixed(2) || 0,
    "Số phiên": energyData.totalSessions || 0,
    "Trung bình (kWh/phiên)": energyData.averagePerSession?.toFixed(2) || 0,
  });

  return exportToExcel(data, `bao-cao-nang-luong-${dateRange}`, "Năng lượng");
};

/**
 * Export energy report to PDF
 * @param {Object} energyData - Energy data from API
 * @param {string} dateRange - Date range label
 */
export const exportEnergyToPDF = (energyData, dateRange) => {
  if (!energyData || !energyData.byStation) {
    return { success: false, message: "Không có dữ liệu để xuất" };
  }

  const headers = ["Trạm", "Năng lượng (kWh)", "Số phiên", "TB (kWh/phiên)"];
  const data = energyData.byStation.map((item) => [
    item.stationName,
    item.energy?.toFixed(2) || 0,
    item.sessions || 0,
    item.avgEnergy?.toFixed(2) || 0,
  ]);

  // Add summary row
  data.push([
    "TỔNG CỘNG",
    energyData.totalEnergy?.toFixed(2) || 0,
    energyData.totalSessions || 0,
    energyData.averagePerSession?.toFixed(2) || 0,
  ]);

  return exportToPDF({
    title: `Báo cáo Năng lượng - ${dateRange}`,
    headers,
    data,
    filename: `bao-cao-nang-luong-${dateRange}`,
  });
};

/**
 * Export usage report to Excel
 * @param {Object} usageData - Usage data from API
 * @param {string} dateRange - Date range label
 */
export const exportUsageToExcel = (usageData, dateRange) => {
  if (!usageData || !usageData.stationBreakdown) {
    return { success: false, message: "Không có dữ liệu để xuất" };
  }

  const data = usageData.stationBreakdown.map((item) => ({
    "Trạm": item.stationName,
    "Doanh thu (VND)": item.revenue,
    "Số phiên": item.sessions,
    "Năng lượng (kWh)": item.energy?.toFixed(2) || 0,
    "Tỷ lệ sử dụng (%)": item.utilization?.toFixed(1) || 0,
  }));

  return exportToExcel(data, `bao-cao-su-dung-${dateRange}`, "Sử dụng");
};

/**
 * Export usage report to PDF
 * @param {Object} usageData - Usage data from API
 * @param {string} dateRange - Date range label
 */
export const exportUsageToPDF = (usageData, dateRange) => {
  if (!usageData || !usageData.stationBreakdown) {
    return { success: false, message: "Không có dữ liệu để xuất" };
  }

  const headers = ["Trạm", "Doanh thu (VND)", "Số phiên", "Năng lượng (kWh)", "Sử dụng (%)"];
  const data = usageData.stationBreakdown.map((item) => [
    item.stationName,
    formatCurrency(item.revenue),
    item.sessions,
    item.energy?.toFixed(2) || 0,
    item.utilization?.toFixed(1) || 0,
  ]);

  return exportToPDF({
    title: `Báo cáo Sử dụng - ${dateRange}`,
    headers,
    data,
    filename: `bao-cao-su-dung-${dateRange}`,
  });
};
