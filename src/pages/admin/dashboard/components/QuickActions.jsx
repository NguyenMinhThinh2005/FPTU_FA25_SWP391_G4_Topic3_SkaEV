import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Button,
} from "@mui/material";
import {
  Analytics,
  People,
  LocationOn,
} from "@mui/icons-material";
import PropTypes from 'prop-types';

const QuickActions = ({ navigate }) => {
  return (
    <Card elevation={2} sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Thao tác nhanh
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2}>
          <Button
            variant="contained"
            startIcon={<Analytics />}
            fullWidth
            size="large"
            onClick={() => navigate("/admin/analytics")}
            sx={{ py: 1.5 }}
          >
            Xem phân tích
          </Button>
          <Button
            variant="outlined"
            startIcon={<People />}
            fullWidth
            size="large"
            onClick={() => navigate("/admin/users")}
            sx={{ py: 1.5 }}
          >
            Quản lý người dùng
          </Button>
          <Button
            variant="outlined"
            startIcon={<LocationOn />}
            fullWidth
            size="large"
            onClick={() => navigate("/admin/stations")}
            sx={{ py: 1.5 }}
          >
            Quản lý trạm
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

QuickActions.propTypes = {
  navigate: PropTypes.func.isRequired,
};

export default QuickActions;
