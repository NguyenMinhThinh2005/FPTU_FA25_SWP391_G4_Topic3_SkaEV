import React from "react";
import { Box, CircularProgress, Alert, Button, Card, CardContent, Tabs, Tab } from "@mui/material";
import { ArrowBack, EvStation, Schedule, AccessTime, CheckCircle } from "@mui/icons-material";
import { useUserDetail } from "./user-management/hooks/useUserDetail";
import UserDetailHeader from "./user-management/components/UserDetailHeader";
import CustomerTabs from "./user-management/components/CustomerTabs";
import NotificationDialog from "./user-management/components/NotificationDialog";
import StaffDetailTabs from "../../components/admin/StaffDetailTabs";
import AdminDetailTabs from "../../components/admin/AdminDetailTabs";

const UserDetail = () => {
  const {
    navigate,
    loading,
    user,
    currentTab,
    setCurrentTab,
    chargingHistory,
    paymentHistory,
    statistics,
    vehicles,
    notificationDialogOpen,
    setNotificationDialogOpen,
    notificationForm,
    setNotificationForm,
    handleSendNotification
  } = useUserDetail();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Không tìm thấy người dùng!</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/admin/users")} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <UserDetailHeader 
        user={user} 
        vehicles={vehicles} 
        statistics={statistics} 
        onBack={() => navigate("/admin/users")} 
      />

      {/* Customer Tabs */}
      {user.role === "customer" && (
        <CustomerTabs 
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          chargingHistory={chargingHistory}
          paymentHistory={paymentHistory}
          statistics={statistics}
          vehicles={vehicles}
        />
      )}

      {/* Staff Tabs */}
      {user.role === "staff" && (
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
              <Tab label="Trạm được giao" icon={<EvStation />} iconPosition="start" />
              <Tab label="Lịch làm việc" icon={<Schedule />} iconPosition="start" />
            </Tabs>
          </Box>
          <CardContent>
            <StaffDetailTabs userId={user.userId} currentTab={currentTab} />
          </CardContent>
        </Card>
      )}

      {/* Admin Tabs */}
      {user.role === "admin" && (
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
              <Tab label="Hoạt động" icon={<AccessTime />} iconPosition="start" />
              <Tab label="Quyền hạn" icon={<CheckCircle />} iconPosition="start" />
            </Tabs>
          </Box>
          <CardContent>
            <AdminDetailTabs userId={user.userId} currentTab={currentTab} />
          </CardContent>
        </Card>
      )}

      <NotificationDialog 
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        user={user}
        form={notificationForm}
        setForm={setNotificationForm}
        onSend={handleSendNotification}
      />
    </Box>
  );
};

export default UserDetail;
