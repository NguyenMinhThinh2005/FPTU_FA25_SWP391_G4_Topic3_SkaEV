import React, { useState, useEffect } from \"react\";mport React, { useState, useEffect } from \"react\";mport React, { useState } from "react";
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Grid,
    Avatar,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Alert,
    IconButton,
    Tooltip,
} from "@mui/material";
import {
    Receipt,
    Download,
    Print,
    Visibility,
    AttachMoney,
    CalendarMonth,
    Payment,
    CheckCircle,
    Schedule,
    ElectricBolt,
    CreditCard,
    AccountBalanceWallet,
    LocalAtm,
} from "@mui/icons-material";
import { formatCurrency } from "../../utils/helpers";
import useBookingStore from "../../store/bookingStore";

const PaymentHistory = () => {
    const [selectedMonth, setSelectedMonth] = useState("2024-09");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
    const { bookingHistory, initializeMockData } = useBookingStore();

    // Initialize data if needed
    React.useEffect(() => {
        if (bookingHistory.length === 0) {
            initializeMockData();
        }
    }, [bookingHistory.length, initializeMockData]);

    // Transform booking data to payment history
    const paymentHistory = bookingHistory
        .filter(booking => booking.status === 'completed')
        .map(booking => ({
            id: `PAY-${booking.id.replace('BOOK', '')}`,
            date: booking.bookingDate,
            amount: booking.totalAmount + (booking.chargingDuration * 500), // Include parking fee
            method: ["SkaEV Wallet", "Visa ****1234", "MoMo Wallet", "Banking Transfer"][Math.floor(Math.random() * 4)],
            methodIcon: <AccountBalanceWallet />,
            status: "completed",
            description: `Sạc tại ${booking.stationName}`,
            session: {
                stationName: `${booking.stationName} - ${booking.connector?.location || 'Trụ A01'}`,
                energy: `${booking.energyDelivered || 15} kWh`,
                duration: `${booking.chargingDuration || 45} phút`,
                connector: "CCS2",
                startTime: new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                endTime: new Date(booking.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            },
            invoiceNumber: `INV-${booking.bookingDate.replace(/-/g, '')}-${booking.id.slice(-3)}`,
            taxInfo: {
                subtotal: Math.round((booking.totalAmount + (booking.chargingDuration * 500)) / 1.1),
                tax: Math.round((booking.totalAmount + (booking.chargingDuration * 500)) * 0.1),
                total: booking.totalAmount + (booking.chargingDuration * 500)
            }
        }));

    // Add some additional mock subscription payments for variety
    const subscriptionPayments = [
        {
            id: "PAY-002",
            date: "2024-09-25",
            amount: 89000,
            method: "Visa ****1234",
            methodIcon: <CreditCard />,
            status: "completed",
            description: "Sạc tại AEON Mall Long Biên",
            session: {
                stationName: "AEON Mall Long Biên - Trụ B02",
                energy: "12.3 kWh",
                duration: "28 phút",
                connector: "Type 2",
                startTime: "09:15",
                endTime: "09:43"
            },
            invoiceNumber: "INV-2024-09-002",
            taxInfo: {
                subtotal: 81000,
                tax: 8100,
                total: 89100
            }
        },
        {
            id: "PAY-003",
            date: "2024-09-22",
            amount: 245000,
            method: "MoMo Wallet",
            methodIcon: <AccountBalanceWallet />,
            status: "completed",
            description: "Gói Tiết kiệm - Thanh toán hàng tháng",
            session: null,
            subscription: {
                packageName: "Gói Tiết kiệm",
                period: "09/2024",
                sessions: 25,
                discount: "10%"
            },
            invoiceNumber: "INV-2024-09-003",
            taxInfo: {
                subtotal: 222727,
                tax: 22273,
                total: 245000
            }
        },
        {
            id: "PAY-004",
            date: "2024-09-20",
            amount: 178000,
            method: "Banking Transfer",
            methodIcon: <LocalAtm />,
            status: "pending",
            description: "Sạc tại Lotte Center",
            session: {
                stationName: "Lotte Center - Trụ C01",
                energy: "21.7 kWh",
                duration: "52 phút",
                connector: "CCS2",
                startTime: "16:20",
                endTime: "17:12"
            },
            invoiceNumber: "INV-2024-09-004",
            taxInfo: {
                subtotal: 161818,
                tax: 16182,
                total: 178000
            }
        },
        {
            id: "PAY-SUB-001",
            date: "2024-09-01",
            amount: 199000,
            method: "Banking Transfer",
            methodIcon: <LocalAtm />,
            status: "completed",
            description: "Gói Tiết kiệm - Thanh toán hàng tháng",
            session: null,
            subscription: {
                packageName: "Gói Tiết kiệm",
                period: "09/2024",
                sessions: 20,
                discount: "15%"
            },
            invoiceNumber: "INV-2024-09-SUB-001",
            taxInfo: {
                subtotal: 180909,
                tax: 18091,
                total: 199000
            }
        }
    ];

    // Combine booking payments with subscription payments
    const allPayments = [...paymentHistory, ...subscriptionPayments];

    const getStatusChip = (status) => {
        const statusMap = {
            completed: { label: "Thành công", color: "success" },
            pending: { label: "Đang xử lý", color: "warning" },
            failed: { label: "Thất bại", color: "error" }
        };
        const statusInfo = statusMap[status] || statusMap.completed;
        return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
    };

    const handleViewReceipt = (payment) => {
        setSelectedPayment(payment);
        setReceiptDialogOpen(true);
    };

    const handleDownloadReceipt = (payment) => {
        // Mock download functionality
        console.log("Downloading receipt for:", payment.invoiceNumber);

        // Create mock PDF content
        const receiptContent = `
            HÓA ĐƠN ĐIỆN TỬ - SKAEV
            Số hóa đơn: ${payment.invoiceNumber}
            Ngày: ${payment.date}
            
            Chi tiết giao dịch:
            ${payment.description}
            ${payment.session ? `
            - Trạm sạc: ${payment.session.stationName}
            - Năng lượng: ${payment.session.energy}
            - Thời gian: ${payment.session.duration}
            - Loại cổng: ${payment.session.connector}
            ` : ''}
            
            Thanh toán:
            - Tạm tính: ${formatCurrency(payment.taxInfo.subtotal)}
            - VAT (10%): ${formatCurrency(payment.taxInfo.tax)}
            - Tổng cộng: ${formatCurrency(payment.taxInfo.total)}
            
            Phương thức: ${payment.method}
            Trạng thái: ${payment.status}
        `;

        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${payment.invoiceNumber}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrintReceipt = (payment) => {
        const printContent = `
            <html>
                <head><title>Hóa đơn ${payment.invoiceNumber}</title></head>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>HÓA ĐƠN ĐIỆN TỬ - SKAEV</h2>
                    <p><strong>Số hóa đơn:</strong> ${payment.invoiceNumber}</p>
                    <p><strong>Ngày:</strong> ${payment.date}</p>
                    <hr>
                    <h3>Chi tiết giao dịch</h3>
                    <p>${payment.description}</p>
                    ${payment.session ? `
                        <ul>
                            <li>Trạm sạc: ${payment.session.stationName}</li>
                            <li>Năng lượng: ${payment.session.energy}</li> 
                            <li>Thời gian: ${payment.session.duration}</li>
                            <li>Loại cổng: ${payment.session.connector}</li>
                        </ul>
                    ` : ''}
                    <hr>
                    <h3>Thông tin thanh toán</h3>
                    <table border="1" style="width: 100%; border-collapse: collapse;">
                        <tr><td>Tạm tính</td><td>${formatCurrency(payment.taxInfo.subtotal)}</td></tr>
                        <tr><td>VAT (10%)</td><td>${formatCurrency(payment.taxInfo.tax)}</td></tr> 
                        <tr><td><strong>Tổng cộng</strong></td><td><strong>${formatCurrency(payment.taxInfo.total)}</strong></td></tr>
                    </table>
                    <p><strong>Phương thức:</strong> ${payment.method}</p>
                    <p><strong>Trạng thái:</strong> ${payment.status}</p>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    // Calculate summary statistics from combined payments
    const totalAmount = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const completedPayments = allPayments.filter(p => p.status === 'completed');
    const averageAmount = completedPayments.length > 0 ?
        completedPayments.reduce((sum, p) => sum + p.amount, 0) / completedPayments.length : 0;

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
                        <Payment />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Lịch sử thanh toán
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Quản lý giao dịch và hóa đơn điện tử
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Tháng</InputLabel>
                        <Select
                            value={selectedMonth}
                            label="Tháng"
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <MenuItem value="2024-09">Tháng 9/2024</MenuItem>
                            <MenuItem value="2024-08">Tháng 8/2024</MenuItem>
                            <MenuItem value="2024-07">Tháng 7/2024</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="outlined" startIcon={<Download />}>
                        Xuất tất cả
                    </Button>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: "center" }}>
                            <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56, mx: "auto", mb: 2 }}>
                                <AttachMoney />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" color="primary.main">
                                {formatCurrency(totalAmount)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tổng chi tiêu
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: "center" }}>
                            <Avatar sx={{ bgcolor: "success.main", width: 56, height: 56, mx: "auto", mb: 2 }}>
                                <CheckCircle />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" color="success.main">
                                {completedPayments.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Giao dịch thành công
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: "center" }}>
                            <Avatar sx={{ bgcolor: "info.main", width: 56, height: 56, mx: "auto", mb: 2 }}>
                                <CalendarMonth />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" color="info.main">
                                {formatCurrency(averageAmount)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Chi tiêu TB/giao dịch
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: "center" }}>
                            <Avatar sx={{ bgcolor: "warning.main", width: 56, height: 56, mx: "auto", mb: 2 }}>
                                <Receipt />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" color="warning.main">
                                {paymentHistory.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tổng hóa đơn
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Payment History Table */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Chi tiết giao dịch
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Ngày</TableCell>
                                    <TableCell>Mô tả</TableCell>
                                    <TableCell>Phương thức</TableCell>
                                    <TableCell align="right">Số tiền</TableCell>
                                    <TableCell>Trạng thái</TableCell>
                                    <TableCell align="center">Hóa đơn</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {allPayments.map((payment) => (
                                    <TableRow key={payment.id} hover>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(payment.date).toLocaleDateString('vi-VN')}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {payment.invoiceNumber}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {payment.description}
                                            </Typography>
                                            {payment.session && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {payment.session.energy} • {payment.session.duration}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                {payment.methodIcon}
                                                <Typography variant="body2">
                                                    {payment.method}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body1" fontWeight="bold">
                                                {formatCurrency(payment.amount)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusChip(payment.status)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                                                <Tooltip title="Xem hóa đơn">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleViewReceipt(payment)}
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Tải xuống">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDownloadReceipt(payment)}
                                                    >
                                                        <Download />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="In hóa đơn">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handlePrintReceipt(payment)}
                                                    >
                                                        <Print />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Receipt Detail Dialog */}
            <Dialog
                open={receiptDialogOpen}
                onClose={() => setReceiptDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Receipt />
                        <Typography variant="h6">
                            Hóa đơn điện tử
                        </Typography>
                    </Box>
                </DialogTitle>

                {selectedPayment && (
                    <DialogContent>
                        <Paper sx={{ p: 3, bgcolor: "grey.50" }}>
                            {/* Header */}
                            <Box sx={{ textAlign: "center", mb: 3 }}>
                                <Typography variant="h5" fontWeight="bold" color="primary.main">
                                    SKAEV
                                </Typography>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Hệ thống sạc xe điện thông minh
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    HÓA ĐƠN ĐIỆN TỬ
                                </Typography>
                                <Typography variant="body2">
                                    Số: {selectedPayment.invoiceNumber}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Transaction Details */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Thông tin giao dịch
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            Ngày giao dịch
                                        </Typography>
                                        <Typography variant="body2">
                                            {new Date(selectedPayment.date).toLocaleDateString('vi-VN')}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            Mã giao dịch
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedPayment.id}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Service Details */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Chi tiết dịch vụ
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    {selectedPayment.description}
                                </Typography>

                                {selectedPayment.session && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary">
                                                Trạm sạc: {selectedPayment.session.stationName}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Năng lượng
                                            </Typography>
                                            <Typography variant="body2">
                                                {selectedPayment.session.energy}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Thời gian sạc
                                            </Typography>
                                            <Typography variant="body2">
                                                {selectedPayment.session.duration}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Loại cổng
                                            </Typography>
                                            <Typography variant="body2">
                                                {selectedPayment.session.connector}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Giờ sạc
                                            </Typography>
                                            <Typography variant="body2">
                                                {selectedPayment.session.startTime} - {selectedPayment.session.endTime}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                )}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Payment Details */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Chi tiết thanh toán
                                </Typography>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                    <Typography variant="body2">Tạm tính:</Typography>
                                    <Typography variant="body2">
                                        {formatCurrency(selectedPayment.taxInfo.subtotal)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                    <Typography variant="body2">VAT (10%):</Typography>
                                    <Typography variant="body2">
                                        {formatCurrency(selectedPayment.taxInfo.tax)}
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Tổng cộng:
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                        {formatCurrency(selectedPayment.taxInfo.total)}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2">Phương thức thanh toán:</Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {selectedPayment.methodIcon}
                                        <Typography variant="body2">
                                            {selectedPayment.method}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Status */}
                            <Box sx={{ textAlign: "center", mt: 3 }}>
                                {getStatusChip(selectedPayment.status)}
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    Hóa đơn được tạo tự động bởi hệ thống SkaEV
                                </Typography>
                            </Box>
                        </Paper>
                    </DialogContent>
                )}

                <DialogActions>
                    <Button onClick={() => setReceiptDialogOpen(false)}>
                        Đóng
                    </Button>
                    {selectedPayment && (
                        <>
                            <Button
                                startIcon={<Download />}
                                onClick={() => handleDownloadReceipt(selectedPayment)}
                            >
                                Tải xuống
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Print />}
                                onClick={() => handlePrintReceipt(selectedPayment)}
                            >
                                In hóa đơn
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default PaymentHistory;