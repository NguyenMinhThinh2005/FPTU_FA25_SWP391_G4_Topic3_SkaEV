import React, { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    Avatar,
    TextField,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
    Chip,
    Container,
    Tabs,
    Tab,
    Stack,
    LinearProgress,
    Paper,
} from "@mui/material";
import {
    Person,
    Email,
    Phone,
    LocationOn,
    Edit,
    ElectricCar,
    History,
    Analytics,
    TrendingUp,
    BatteryFull,
    Speed,
    Eco,
    CalendarToday,
} from "@mui/icons-material";
import useAuthStore from "../../store/authStore";
import { useMasterDataSync } from "../../hooks/useMasterDataSync";
import { formatCurrency } from "../../utils/helpers";

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`profile-tabpanel-${index}`}
            aria-labelledby={`profile-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const CustomerProfile = () => {
    const { user, updateProfile } = useAuthStore();
    const { bookingHistory, stats: bookingStats } = useMasterDataSync();
    const [tabValue, setTabValue] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : "Khách hàng",
        email: user?.email || "customer@skaev.com",
        phone: user?.profile?.phone || "+84 901 234 567",
        address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    });

    // Mock vehicle data
    const [vehicles] = useState([
        {
            id: "VF001",
            make: "VinFast",
            model: "VF8",
            year: 2024,
            licensePlate: "51A-123.45",
            batteryCapacity: 87.7, // kWh
            range: 420, // km
            efficiency: 4.8, // km/kWh
            isDefault: true,
        },
        {
            id: "VF002",
            make: "Tesla",
            model: "Model Y",
            year: 2023,
            licensePlate: "51B-678.90",
            batteryCapacity: 75.0, // kWh
            range: 380, // km
            efficiency: 5.1, // km/kWh
            isDefault: false,
        },
    ]);

    // Data is now managed by master data sync hook
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleSaveProfile = () => {
        updateProfile(profileData);
        setEditMode(false);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
                Hồ sơ cá nhân
            </Typography>

            {/* Tabs Navigation */}
            <Card sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    indicatorColor="primary"
                >
                    <Tab icon={<Person />} label="Thông tin cá nhân" />
                    <Tab icon={<ElectricCar />} label="Quản lý xe" />
                    <Tab icon={<History />} label="Lịch sử sạc" />
                    <Tab icon={<Analytics />} label="Thống kê & Báo cáo" />
                </Tabs>
            </Card>

            {/* Tab 1: Profile Information */}
            <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    {/* Profile Card */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent sx={{ textAlign: "center", p: 3 }}>
                                <Avatar
                                    sx={{ width: 120, height: 120, mx: "auto", mb: 2 }}
                                    src="/assets/avatar-customer.jpg"
                                >
                                    <Person sx={{ fontSize: 60 }} />
                                </Avatar>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    {profileData.name}
                                </Typography>
                                <Chip label="Tài xế" color="primary" />
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        variant={editMode ? "contained" : "outlined"}
                                        startIcon={<Edit />}
                                        onClick={() => setEditMode(!editMode)}
                                        fullWidth
                                    >
                                        {editMode ? "Lưu thay đổi" : "Chỉnh sửa"}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Profile Details */}
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Thông tin chi tiết
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Họ và tên"
                                            value={profileData.name}
                                            disabled={!editMode}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            InputProps={{
                                                startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            value={profileData.email}
                                            disabled={!editMode}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            InputProps={{
                                                startAdornment: <Email sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Số điện thoại"
                                            value={profileData.phone}
                                            disabled={!editMode}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            InputProps={{
                                                startAdornment: <Phone sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Địa chỉ"
                                            value={profileData.address}
                                            disabled={!editMode}
                                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                            InputProps={{
                                                startAdornment: <LocationOn sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    </Grid>
                                </Grid>

                                {editMode && (
                                    <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                                        <Button variant="outlined" onClick={() => setEditMode(false)}>
                                            Hủy
                                        </Button>
                                        <Button variant="contained" onClick={handleSaveProfile}>
                                            Lưu thay đổi
                                        </Button>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* Tab 2: Vehicle Management */}
            <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                    {vehicles.map((vehicle) => (
                        <Grid item xs={12} md={6} key={vehicle.id}>
                            <Card sx={{ position: "relative" }}>
                                <CardContent>
                                    {vehicle.isDefault && (
                                        <Chip
                                            label="Xe chính"
                                            color="primary"
                                            size="small"
                                            sx={{ position: "absolute", top: 16, right: 16 }}
                                        />
                                    )}

                                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                        <Avatar sx={{ bgcolor: "primary.light", mr: 2 }}>
                                            <ElectricCar />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">
                                                {vehicle.make} {vehicle.model}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {vehicle.year} • {vehicle.licensePlate}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Box sx={{ textAlign: "center", p: 1 }}>
                                                <BatteryFull color="success" />
                                                <Typography variant="body2" fontWeight="medium">
                                                    {vehicle.batteryCapacity} kWh
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Dung lượng pin
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{ textAlign: "center", p: 1 }}>
                                                <Speed color="info" />
                                                <Typography variant="body2" fontWeight="medium">
                                                    {vehicle.range} km
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Quãng đường
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Box sx={{ textAlign: "center", p: 1 }}>
                                                <Eco color="primary" />
                                                <Typography variant="body2" fontWeight="medium">
                                                    {vehicle.efficiency} km/kWh
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Hiệu suất năng lượng
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                                        Chỉnh sửa thông tin
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}

                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
                            <CardContent sx={{ textAlign: "center" }}>
                                <Avatar sx={{ bgcolor: "grey.100", width: 80, height: 80, mx: "auto", mb: 2 }}>
                                    <ElectricCar sx={{ fontSize: 40, color: "grey.400" }} />
                                </Avatar>
                                <Typography variant="h6" gutterBottom>
                                    Thêm xe mới
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Đăng ký thêm xe điện để quản lý tốt hơn
                                </Typography>
                                <Button variant="contained" startIcon={<ElectricCar />}>
                                    Thêm xe
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* Tab 3: Charging History */}
            <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                    {/* Statistics Cards */}
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: "center" }}>
                                <Typography variant="h4" color="primary.main" fontWeight="bold">
                                    {bookingStats.total}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tổng phiên sạc
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: "center" }}>
                                <Typography variant="h4" color="success.main" fontWeight="bold">
                                    {bookingStats.completed}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Hoàn thành
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: "center" }}>
                                <Typography variant="h4" color="info.main" fontWeight="bold">
                                    {bookingStats.totalEnergyCharged} kWh
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tổng năng lượng
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: "center" }}>
                                <Typography variant="h4" color="warning.main" fontWeight="bold">
                                    {formatCurrency(bookingStats.totalAmount)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tổng chi phí
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* History List */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Lịch sử sạc gần đây
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <List>
                                    {bookingHistory.slice(0, 5).map((booking) => (
                                        <ListItem key={booking.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 1 }}>
                                            <ListItemIcon>
                                                <Avatar sx={{ bgcolor: "primary.light" }}>
                                                    <ElectricCar />
                                                </Avatar>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={booking.stationName}
                                                secondary={
                                                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                                        <Chip
                                                            icon={<CalendarToday />}
                                                            label={new Date(booking.createdAt).toLocaleDateString("vi-VN")}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        <Chip
                                                            label={`${booking.energyDelivered || 0} kWh`}
                                                            size="small"
                                                            color="info"
                                                        />
                                                        <Chip
                                                            label={formatCurrency(booking.totalAmount || 0)}
                                                            size="small"
                                                            color="success"
                                                        />
                                                    </Stack>
                                                }
                                            />
                                            <Chip
                                                label={booking.status === "completed" ? "Hoàn thành" : "Đã hủy"}
                                                color={booking.status === "completed" ? "success" : "error"}
                                                size="small"
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* Tab 4: Analytics & Reports */}
            <TabPanel value={tabValue} index={3}>
                <Grid container spacing={3}>
                    {/* Monthly Summary */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Tóm tắt tháng này
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Stack spacing={2}>
                                    <Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                            <Typography variant="body2">Phiên sạc</Typography>
                                            <Typography variant="body2" fontWeight="bold">{bookingStats.completed} phiên</Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={75} />
                                    </Box>

                                    <Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                            <Typography variant="body2">Năng lượng sạc</Typography>
                                            <Typography variant="body2" fontWeight="bold">{bookingStats.totalEnergyCharged} kWh</Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={60} color="success" />
                                    </Box>

                                    <Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                            <Typography variant="body2">Chi phí</Typography>
                                            <Typography variant="body2" fontWeight="bold">{formatCurrency(bookingStats.totalAmount)}</Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={45} color="warning" />
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Efficiency Metrics */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Chỉ số hiệu quả
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Paper sx={{ p: 2, textAlign: "center" }}>
                                            <TrendingUp color="success" sx={{ fontSize: 32, mb: 1 }} />
                                            <Typography variant="h6" fontWeight="bold">6,857</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                VNĐ/kWh trung bình
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper sx={{ p: 2, textAlign: "center" }}>
                                            <Speed color="info" sx={{ fontSize: 32, mb: 1 }} />
                                            <Typography variant="h6" fontWeight="bold">{(parseFloat(bookingStats.totalEnergyCharged) / parseFloat(bookingStats.completed) || 20.4).toFixed(1)}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                kWh/phiên trung bình
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            <Typography variant="body2">
                                                💡 <strong>Mẹo tiết kiệm:</strong> Sạc vào khung giờ thấp điểm (22:00-06:00) để được giá ưu đãi!
                                            </Typography>
                                        </Alert>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Cost Analysis */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Phân tích chi phí theo tháng
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Bạn đã tiết kiệm được <strong>15%</strong> so với tháng trước nhờ sử dụng hiệu quả các trạm sạc!
                                </Alert>

                                <Grid container spacing={2}>
                                    {[
                                        { month: "Tháng 7", amount: 1850000, energy: 280, sessions: 14 },
                                        { month: "Tháng 8", amount: 1750000, energy: 265, sessions: 13 },
                                        { month: "Tháng 9", amount: bookingStats.totalAmount, energy: bookingStats.totalEnergyCharged, sessions: bookingStats.completed },
                                    ].map((data, index) => (
                                        <Grid item xs={12} sm={4} key={index}>
                                            <Paper sx={{ p: 2 }}>
                                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                                    {data.month}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Chi phí: <strong>{formatCurrency(data.amount)}</strong>
                                                </Typography>
                                                <Typography variant="body2">
                                                    Năng lượng: <strong>{data.energy} kWh</strong>
                                                </Typography>
                                                <Typography variant="body2">
                                                    Phiên sạc: <strong>{data.sessions} lần</strong>
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>
        </Container>
    );
};

export default CustomerProfile;