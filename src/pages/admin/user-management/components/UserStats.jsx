import React from "react";
import { Grid, Card, CardContent, Typography } from "@mui/material";
import PropTypes from "prop-types";

const UserStats = ({ users }) => {
  const stats = [
    { label: "Tổng số người dùng", value: users.length, color: "primary" },
    {
      label: "Quản trị viên",
      value: users.filter((u) => u.role === "admin").length,
      color: "primary",
    },
    {
      label: "Nhân viên",
      value: users.filter((u) => u.role === "staff").length,
      color: "warning",
    },
    {
      label: "Khách hàng",
      value: users.filter((u) => u.role === "customer").length,
      color: "success",
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {stats.map((stat, idx) => (
        <Grid item xs={12} sm={6} md={3} key={idx}>
          <Card>
            <CardContent>
              <Typography variant="h4" color={stat.color} fontWeight="bold">
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

UserStats.propTypes = {
  users: PropTypes.array.isRequired,
};

export default UserStats;
