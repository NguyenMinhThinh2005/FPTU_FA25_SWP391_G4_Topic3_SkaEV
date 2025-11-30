// services/invoiceService.js
import { formatCurrency } from "../utils/helpers";

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
    const pdfContent = this.formatInvoiceHTML(invoiceData);

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

  static formatInvoiceHTML(invoice) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Hóa đơn ${invoice.invoiceNumber}</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: #f5f5f5;
                }
                .invoice-container { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    background: white; 
                    padding: 40px; 
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 40px; 
                    border-bottom: 3px solid #2E7D32;
                    padding-bottom: 20px;
                }
                .logo { 
                    font-size: 32px; 
                    font-weight: bold; 
                    color: #2E7D32; 
                    margin-bottom: 10px;
                }
                .company-info { 
                    font-size: 14px; 
                    color: #666; 
                }
                .invoice-title { 
                    font-size: 24px; 
                    font-weight: bold; 
                    margin: 20px 0 10px 0;
                    color: #333;
                }
                .invoice-meta { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 30px;
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                }
                .section { 
                    margin-bottom: 30px; 
                }
                .section-title { 
                    font-size: 18px; 
                    font-weight: bold; 
                    margin-bottom: 15px; 
                    color: #2E7D32;
                    border-left: 4px solid #2E7D32;
                    padding-left: 10px;
                }
                .info-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 15px; 
                }
                .info-item { 
                    display: flex; 
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px dotted #ddd;
                }
                .label { 
                    font-weight: 500; 
                    color: #555; 
                }
                .value { 
                    font-weight: bold; 
                    color: #333;
                }
                .pricing-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 15px;
                }
                .pricing-table th, .pricing-table td { 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 1px solid #ddd; 
                }
                .pricing-table th { 
                    background-color: #f8f9fa; 
                    font-weight: bold;
                    color: #2E7D32;
                }
                .total-row { 
                    background-color: #e8f5e8; 
                    font-weight: bold; 
                    font-size: 18px;
                    color: #2E7D32;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 40px; 
                    padding-top: 20px; 
                    border-top: 2px solid #eee;
                    color: #666;
                    font-size: 12px;
                }
                .status { 
                    padding: 8px 16px; 
                    border-radius: 20px; 
                    font-weight: bold; 
                    color: white;
                    background-color: #4CAF50;
                }
                @media print {
                    body { background: white; }
                    .invoice-container { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <!-- Header -->
                <div class="header">
                    <div class="logo">SkaEV</div>
                    <div class="company-info">
                        Hệ thống sạc xe điện thông minh<br>
                        Địa chỉ: Hà Nội, Việt Nam<br>
                        Hotline: 1900-xxxx | Email: support@skaev.com
                    </div>
                    <div class="invoice-title">HÓA ĐƠN ĐIỆN TỬ</div>
                </div>

                <!-- Invoice Meta -->
                <div class="invoice-meta">
                    <div>
                        <div class="label">Số hóa đơn:</div>
                        <div class="value">${invoice.invoiceNumber}</div>
                    </div>
                    <div>
                        <div class="label">Ngày lập:</div>
                        <div class="value">${new Date(
                          invoice.date
                        ).toLocaleDateString("vi-VN")}</div>
                    </div>
                    <div>
                        <div class="label">Trạng thái:</div>
                        <div class="status">${
                          invoice.status === "completed"
                            ? "Đã thanh toán"
                            : "Chờ xử lý"
                        }</div>
                    </div>
                </div>

                <!-- Customer Info -->
                <div class="section">
                    <div class="section-title">Thông tin khách hàng</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Họ tên:</span>
                            <span class="value">${invoice.customer.name}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Email:</span>
                            <span class="value">${invoice.customer.email}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Điện thoại:</span>
                            <span class="value">${invoice.customer.phone}</span>
                        </div>
                        ${
                          invoice.customer.vehicleInfo
                            ? `
                        <div class="info-item">
                            <span class="label">Thông tin xe:</span>
                            <span class="value">${invoice.customer.vehicleInfo}</span>
                        </div>
                        `
                            : ""
                        }
                    </div>
                </div>

                ${
                  invoice.session
                    ? `
                <!-- Session Details -->
                <div class="section">
                    <div class="section-title">Thông tin phiên sạc</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Trạm sạc:</span>
                            <span class="value">${
                              invoice.session.stationName
                            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Địa chỉ:</span>
                            <span class="value">${
                              invoice.session.stationAddress || "N/A"
                            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Loại cổng:</span>
                            <span class="value">${
                              invoice.session.connectorType
                            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Công suất:</span>
                            <span class="value">${
                              invoice.session.powerOutput
                            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Thời gian bắt đầu:</span>
                            <span class="value">${
                              invoice.session.startTime
                            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Thời gian kết thúc:</span>
                            <span class="value">${
                              invoice.session.endTime
                            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Tổng thời gian:</span>
                            <span class="value">${
                              invoice.session.duration
                            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Năng lượng sạc:</span>
                            <span class="value">${
                              invoice.session.energyDelivered
                            }</span>
                        </div>
                    </div>
                </div>
                `
                    : ""
                }

                ${
                  invoice.subscription
                    ? `
                <!-- Subscription Details -->
                <div class="section">
                    <div class="section-title">Thông tin gói dịch vụ</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Tên gói:</span>
                            <span class="value">${invoice.subscription.packageName}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Loại gói:</span>
                            <span class="value">${invoice.subscription.packageType}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Thời hạn:</span>
                            <span class="value">${invoice.subscription.period}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Phiên sạc/tháng:</span>
                            <span class="value">${invoice.subscription.sessionsIncluded}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Giảm giá:</span>
                            <span class="value">${invoice.subscription.discount}</span>
                        </div>
                    </div>
                </div>
                `
                    : ""
                }

                <!-- Pricing Details -->
                <div class="section">
                    <div class="section-title">Chi tiết thanh toán</div>
                    <table class="pricing-table">
                        <thead>
                            <tr>
                                <th>Mô tả</th>
                                <th>Số lượng</th>
                                <th>Đơn giá</th>
                                <th>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                              invoice.pricing.energyCost
                                ? `
                            <tr>
                                <td>Phí sạc điện</td>
                                <td>${invoice.session.energyDelivered}</td>
                                <td>${formatCurrency(
                                  invoice.pricing.energyRate
                                )}/kWh</td>
                                <td>${formatCurrency(
                                  invoice.pricing.energyCost
                                )}</td>
                            </tr>
                            `
                                : ""
                            }
                            ${
                              invoice.pricing.parkingCost
                                ? `
                            <tr>
                                <td>Phí đỗ xe</td>
                                <td>${invoice.session.duration}</td>
                                <td>${formatCurrency(
                                  invoice.pricing.parkingRate
                                )}/giờ</td>
                                <td>${formatCurrency(
                                  invoice.pricing.parkingCost
                                )}</td>
                            </tr>
                            `
                                : ""
                            }
                            ${
                              invoice.pricing.packagePrice
                                ? `
                            <tr>
                                <td>Gói dịch vụ ${
                                  invoice.subscription.packageName
                                }</td>
                                <td>1 tháng</td>
                                <td>${formatCurrency(
                                  invoice.pricing.packagePrice
                                )}</td>
                                <td>${formatCurrency(
                                  invoice.pricing.packagePrice
                                )}</td>
                            </tr>
                            `
                                : ""
                            }
                            <tr>
                                <td colspan="3"><strong>Tạm tính:</strong></td>
                                <td><strong>${formatCurrency(
                                  invoice.pricing.subtotal
                                )}</strong></td>
                            </tr>
                            <tr>
                                <td colspan="3"><strong>VAT (10%):</strong></td>
                                <td><strong>${formatCurrency(
                                  invoice.pricing.tax
                                )}</strong></td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="3"><strong>TỔNG CỘNG:</strong></td>
                                <td><strong>${formatCurrency(
                                  invoice.pricing.total
                                )}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p><strong>Cảm ơn quý khách đã sử dụng dịch vụ SkaEV!</strong></p>
                    <p>Hóa đơn này được tạo tự động bởi hệ thống và có giá trị pháp lý.</p>
                    <p>Mọi thắc mắc xin liên hệ: hotline 1900-xxxx hoặc support@skaev.com</p>
                    <br>
                    <p style="font-size: 10px; color: #999;">
                        Hóa đơn được tạo lúc: ${new Date().toLocaleString(
                          "vi-VN"
                        )}
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
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
    link.download = `skaev_invoices_${
      new Date().toISOString().split("T")[0]
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
