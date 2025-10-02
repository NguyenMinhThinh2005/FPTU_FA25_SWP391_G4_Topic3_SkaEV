import React, { useState, useEffect } from "react";
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
    useEffect(() => {
        if (bookingHistory.length === 0) {
            initializeMockData();
        }
    }, [bookingHistory.length, initializeMockData]);

    // Transform booking data to payment history with realistic logic
    const paymentHistory = (bookingHistory || [])
        .filter(booking =>
            booking &&
            booking.status === 'completed' &&
            (booking.totalAmount > 0 || booking.energyDelivered > 0) &&
            booking.id
        )
        .map(booking => {
            const parkingFee = (booking.chargingDuration || 45) * 500; // 500 VND per minute
            const energyCost = booking.totalAmount || ((booking.energyDelivered || 15) * 8500);
            const totalCost = energyCost + parkingFee;

            const paymentMethods = [
                { name: "SkaEV Wallet", icon: <AccountBalanceWallet />, color: "primary" },
                { name: "Visa ****1234", icon: <CreditCard />, color: "info" },
                { name: "MoMo Wallet", icon: <AccountBalanceWallet />, color: "success" },
                { name: "Banking Transfer", icon: <LocalAtm />, color: "warning" }
            ];
            const randomMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

            return {
                id: `PAY-${booking.id ? booking.id.replace('BOOK', '') : Date.now()}`,
                date: booking.bookingDate || new Date().toISOString().split('T')[0],
                amount: totalCost,
                method: randomMethod.name,
                methodIcon: randomMethod.icon,
                methodColor: randomMethod.color,
                status: "completed",
                description: `Sạc tại ${booking.stationName || 'Trạm sạc'}`,
                session: {
                    stationName: `${booking.stationName || 'Trạm sạc'} - ${booking.connector?.location || 'Trụ A01'}`,
                    energy: `${booking.energyDelivered || 15} kWh`,
                    duration: `${booking.chargingDuration || 45} phút`,
                    connector: "CCS2",
                    startTime: booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '10:00',
                    endTime: booking.completedAt ? new Date(booking.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '11:00',
                    energyCost: energyCost,
                    parkingFee: parkingFee
                },
                invoiceNumber: `INV-${(booking.bookingDate || '2024-09-01').replace(/-/g, '')}-${(booking.id || 'BOOK001').slice(-3)}`,
                taxInfo: {
                    subtotal: Math.round(totalCost / 1.1),
                    tax: Math.round(totalCost * 0.1),
                    total: totalCost
                }
            };
        });

    // Add subscription payment for variety
    const subscriptionPayments = [
        {
            id: "PAY-SUB-001",
            date: "2024-09-01",
            amount: 199000,
            method: "Banking Transfer",
            methodIcon: <LocalAtm />,
            methodColor: "warning",
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

    // Combine all payments and sort by date (newest first)
    const allPayments = [...paymentHistory, ...subscriptionPayments]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate summary statistics with safety checks
    const totalAmount = (allPayments || []).reduce((sum, p) => sum + (p?.amount || 0), 0);
    const completedPayments = (allPayments || []).filter(p => p?.status === 'completed');
    const averageAmount = completedPayments.length > 0 ?
        completedPayments.reduce((sum, p) => sum + (p?.amount || 0), 0) / completedPayments.length : 0;
    const totalSessions = (paymentHistory || []).length; // Only count actual charging sessions

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
        console.log("Downloading receipt for:", payment.invoiceNumber);
        alert(`Đã tải xuống hóa đơn ${payment.invoiceNumber}`);
    };

    const handlePrintReceipt = (payment) => {
        console.log("Printing receipt for:", payment.invoiceNumber);
        alert(`Đã in hóa đơn ${payment.invoiceNumber}`);
    };

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

            {/* Summary Cards - Updated with realistic data */}
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
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                +15.2% so với tháng trước
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
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                Tỷ lệ thành công: 100%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: "center" }}>
                            <Avatar sx={{ bgcolor: "info.main", width: 56, height: 56, mx: "auto", mb: 2 }}>
                                <ElectricBolt />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" color="info.main">
                                {formatCurrency(Math.round(averageAmount))}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Chi tiêu TB/giao dịch
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                {totalSessions} phiên sạc
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
                                {allPayments.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tổng hóa đơn
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                Điện tích lũy
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
                                {(allPayments || []).map((payment) => (
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
                                            {payment.subscription && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {payment.subscription.packageName} • {payment.subscription.sessions} phiên
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Avatar sx={{ width: 24, height: 24, bgcolor: `${payment.methodColor}.main` }}>
                                                    {payment.methodIcon}
                                                </Avatar>
                                                <Typography variant="body2">
                                                    {payment.method}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatCurrency(payment.amount)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusChip(payment.status)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                                                <Tooltip title="Xem chi tiết">
                                                    <IconButton size="small" onClick={() => handleViewReceipt(payment)}>
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Tải xuống">
                                                    <IconButton size="small" onClick={() => handleDownloadReceipt(payment)}>
                                                        <Download />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="In hóa đơn">
                                                    <IconButton size="small" onClick={() => handlePrintReceipt(payment)}>
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
            <Dialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Chi tiết hóa đơn
                    <Typography variant="body2" color="text.secondary">
                        {selectedPayment?.invoiceNumber}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {selectedPayment && (
                        <Box>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Ngày giao dịch:</Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {new Date(selectedPayment.date).toLocaleDateString('vi-VN')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Phương thức:</Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {selectedPayment.method}
                                    </Typography>
                                </Grid>
                                {selectedPayment.session && (
                                    <>
                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography variant="subtitle2" fontWeight="bold">Chi tiết phiên sạc</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Trạm sạc:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {selectedPayment.session.stationName}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Thời gian:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {selectedPayment.session.startTime} - {selectedPayment.session.endTime}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Năng lượng:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {selectedPayment.session.energy}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Thời lượng:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {selectedPayment.session.duration}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography variant="subtitle2" fontWeight="bold">Chi phí chi tiết</Typography>
                                        </Grid>
                                        <Grid item xs={8}>
                                            <Typography variant="body2">Chi phí năng lượng:</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="body2" align="right">
                                                {formatCurrency(selectedPayment.session.energyCost)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={8}>
                                            <Typography variant="body2">Phí đỗ xe:</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="body2" align="right">
                                                {formatCurrency(selectedPayment.session.parkingFee)}
                                            </Typography>
                                        </Grid>
                                    </>
                                )}
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">Tạm tính:</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="body2" align="right">
                                        {formatCurrency(selectedPayment.taxInfo.subtotal)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">VAT (10%):</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="body2" align="right">
                                        {formatCurrency(selectedPayment.taxInfo.tax)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="h6" fontWeight="bold">Tổng cộng:</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="h6" fontWeight="bold" align="right" color="primary.main">
                                        {formatCurrency(selectedPayment.amount)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReceiptDialogOpen(false)}>
                        Đóng
                    </Button>
                    <Button variant="outlined" startIcon={<Download />} onClick={() => handleDownloadReceipt(selectedPayment)}>
                        Tải xuống
                    </Button>
                    <Button variant="outlined" startIcon={<Print />} onClick={() => handlePrintReceipt(selectedPayment)}>
                        In hóa đơn
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default PaymentHistory;