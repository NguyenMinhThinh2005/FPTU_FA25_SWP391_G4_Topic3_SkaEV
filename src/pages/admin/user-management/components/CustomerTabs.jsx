import React from 'react';
import { Box, Card, CardContent, Tabs, Tab } from '@mui/material';
import { 
  BatteryChargingFull, Payment, TrendingUp, DirectionsCar 
} from '@mui/icons-material';
import CustomerChargingHistory from './CustomerChargingHistory';
import CustomerPaymentHistory from './CustomerPaymentHistory';
import CustomerStats from './CustomerStats';
import CustomerVehicles from './CustomerVehicles';

const CustomerTabs = ({ 
  currentTab, 
  setCurrentTab, 
  chargingHistory, 
  paymentHistory, 
  statistics, 
  vehicles 
}) => {
  return (
    <Card>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
          <Tab label="Lịch sử sạc" icon={<BatteryChargingFull />} iconPosition="start" />
          <Tab label="Lịch sử thanh toán" icon={<Payment />} iconPosition="start" />
          <Tab label="Thống kê chi tiết" icon={<TrendingUp />} iconPosition="start" />
          <Tab label="Phương tiện" icon={<DirectionsCar />} iconPosition="start" />
        </Tabs>
      </Box>

      <CardContent>
        {currentTab === 0 && <CustomerChargingHistory chargingHistory={chargingHistory} />}
        {currentTab === 1 && <CustomerPaymentHistory paymentHistory={paymentHistory} />}
        {currentTab === 2 && <CustomerStats statistics={statistics} />}
        {currentTab === 3 && <CustomerVehicles vehicles={vehicles} />}
      </CardContent>
    </Card>
  );
};

export default CustomerTabs;
