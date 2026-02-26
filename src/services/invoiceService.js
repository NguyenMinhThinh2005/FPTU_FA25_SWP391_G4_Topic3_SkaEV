// services/invoiceService.js
import { formatCurrency } from "../utils/helpers";
import { formatInvoiceHTML } from "../templates/invoiceTemplate";

export class InvoiceService {
  static generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(
      3,
      "0"
    );
    return `INV-${year}-${month}-${sequence}`;
  }

  static calculateTax(amount, taxRate = 0.1) {
    const subtotal = amount / (1 + taxRate);
    const tax = amount - subtotal;
    return {
      subtotal: Math.round(subtotal),
      tax: Math.round(tax),
      total: amount,
    };
  }

  static generateChargingInvoice(session, pricing) {
    const energyKwh = session.energyDelivered || 0;
    const duration = session.duration || 0; // in minutes
    const parkingFee = Math.ceil(duration / 60) * 5000; // 5000 VND per hour

    // Calculate energy cost based on connector type
    let energyCost = 0;
    if (session.connectorType === "Type 2") {
      energyCost = energyKwh * pricing.ac;
    } else if (session.connectorType === "CCS2") {
      energyCost = energyKwh * pricing.dc;
    } else if (session.connectorType === "CHAdeMO") {
      energyCost = energyKwh * pricing.ultra;
    }

    const totalBeforeTax = energyCost + parkingFee;
    const taxInfo = this.calculateTax(totalBeforeTax);

    return {
      invoiceNumber: this.generateInvoiceNumber(),
      date: new Date().toISOString().split("T")[0],
      session: {
        id: session.id,
        stationName: session.stationName,
        stationAddress: session.stationAddress,
        connectorType: session.connectorType,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
        energyDelivered: `${energyKwh.toFixed(1)} kWh`,
        powerOutput: session.powerOutput || "0 kW",
      },
      pricing: {
        energyRate:
          pricing[
          session.connectorType?.toLowerCase()?.includes("type")
            ? "ac"
            : session.connectorType?.toLowerCase()?.includes("ccs")
              ? "dc"
              : "ultra"
          ],
        energyCost,
        parkingRate: 5000,
        parkingCost: parkingFee,
        totalBeforeTax,
        ...taxInfo,
      },
      customer: {
        name: session.customerName || "Khách hàng",
        email: session.customerEmail || "",
        phone: session.customerPhone || "",
        vehicleInfo: session.vehicleInfo || "",
      },
      status: "completed",
    };
  }

  static generateSubscriptionInvoice(subscription, customer) {
    const taxInfo = this.calculateTax(subscription.price);

    return {
      invoiceNumber: this.generateInvoiceNumber(),
      date: new Date().toISOString().split("T")[0],
      subscription: {
        packageName: subscription.name,
        packageType: subscription.type,
        period: subscription.period,
        sessionsIncluded: subscription.sessionsPerMonth,
        discount: subscription.discount,
        features: subscription.features || [],
      },
      pricing: {
        packagePrice: subscription.price,
        ...taxInfo,
      },
      customer: {
        name: customer.name || "Khách hàng",
        email: customer.email || "",
        phone: customer.phone || "",
        membershipLevel: customer.membershipLevel || "Cơ bản",
      },
      status: "completed",
    };
  }

  static generateInvoicePDF(invoiceData) {
    // Mock PDF generation - in real app, use libraries like jsPDF or html2pdf
    const pdfContent = formatInvoiceHTML(invoiceData);

    // Create blob and download
    const blob = new Blob([pdfContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoiceData.invoiceNumber}.html`;
    link.click();
    URL.revokeObjectURL(url);

    return invoiceData.invoiceNumber;
  }

  // Delegate to external template
  static formatInvoiceHTML(invoice) {
    return formatInvoiceHTML(invoice);
  }

  static async sendInvoiceEmail(invoice, recipientEmail) {
    // Mock email service - in real app, integrate with email provider
    const emailContent = {
      to: recipientEmail,
      subject: `Hóa đơn SkaEV - ${invoice.invoiceNumber}`,
      html: this.formatInvoiceHTML(invoice),
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: "Mock PDF content", // Real PDF buffer would go here
        },
      ],
    };

    // Simulate API call
    console.log("Sending invoice email:", emailContent);

    // Return mock success
    return {
      success: true,
      messageId: `email_${Date.now()}`,
      invoice: invoice.invoiceNumber,
    };
  }

  static getInvoicesByDateRange() {
    // Mock data - in real app, fetch from database with date range filtering
    // Parameters startDate and endDate would be used in production
    return [
      // This would return filtered invoices from database
    ];
  }

  static async exportInvoicesToExcel(invoices) {
    // Mock Excel export - in real app, use libraries like SheetJS
    const csvContent = this.formatInvoicesCSV(invoices);

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `skaev_invoices_${new Date().toISOString().split("T")[0]
      }.csv`;
    link.click();
    URL.revokeObjectURL(url);

    return `skaev_invoices_${new Date().toISOString().split("T")[0]}.csv`;
  }

  static formatInvoicesCSV(invoices) {
    const headers = [
      "Số hóa đơn",
      "Ngày",
      "Khách hàng",
      "Dịch vụ",
      "Tạm tính",
      "VAT",
      "Tổng cộng",
      "Trạng thái",
    ].join(",");

    const rows = invoices.map((invoice) =>
      [
        invoice.invoiceNumber,
        invoice.date,
        invoice.customer.name,
        invoice.session ? "Sạc xe điện" : "Gói dịch vụ",
        invoice.pricing.subtotal,
        invoice.pricing.tax,
        invoice.pricing.total,
        invoice.status,
      ].join(",")
    );

    return [headers, ...rows].join("\n");
  }
}

export default InvoiceService;
