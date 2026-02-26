// ─── Invoice HTML Template ─────────────────────────────────────────
// Extracted from InvoiceService to reduce file size.
// This is a static HTML template used for PDF generation and email.
import { formatCurrency } from "../utils/helpers";

/**
 * Generate a full HTML invoice document.
 * @param {Object} invoice — The invoice data object
 * @returns {string} Complete HTML document as a string
 */
export function formatInvoiceHTML(invoice) {
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
                        <div class="status">${invoice.status === "completed"
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
                        ${invoice.customer.vehicleInfo
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

                ${invoice.session
            ? `
                <!-- Session Details -->
                <div class="section">
                    <div class="section-title">Thông tin phiên sạc</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Trạm sạc:</span>
                            <span class="value">${invoice.session.stationName
            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Địa chỉ:</span>
                            <span class="value">${invoice.session.stationAddress || "N/A"
            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Loại cổng:</span>
                            <span class="value">${invoice.session.connectorType
            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Công suất:</span>
                            <span class="value">${invoice.session.powerOutput
            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Thời gian bắt đầu:</span>
                            <span class="value">${invoice.session.startTime
            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Thời gian kết thúc:</span>
                            <span class="value">${invoice.session.endTime
            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Tổng thời gian:</span>
                            <span class="value">${invoice.session.duration
            }</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Năng lượng sạc:</span>
                            <span class="value">${invoice.session.energyDelivered
            }</span>
                        </div>
                    </div>
                </div>
                `
            : ""
        }

                ${invoice.subscription
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
                            ${invoice.pricing.energyCost
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
                            ${invoice.pricing.parkingCost
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
                            ${invoice.pricing.packagePrice
            ? `
                            <tr>
                                <td>Gói dịch vụ ${invoice.subscription.packageName
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
