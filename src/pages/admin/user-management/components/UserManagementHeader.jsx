import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Add } from "@mui/icons-material";
import PropTypes from "prop-types";

const UserManagementHeader = ({ onAddUser }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Quản lý người dùng
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý khách hàng, nhân viên và quản trị viên; phân quyền vai trò
        </Typography>
      </Box>
      <Button variant="contained" startIcon={<Add />} onClick={onAddUser}>
        Thêm người dùng
      </Button>
    </Box>
  );
};

UserManagementHeader.propTypes = {
  onAddUser: PropTypes.func.isRequired,
};

export default UserManagementHeader;
