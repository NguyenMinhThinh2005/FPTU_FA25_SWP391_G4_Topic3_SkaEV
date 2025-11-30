import React from "react";
import { Card, CardContent, Grid, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import PropTypes from "prop-types";

const UserFilters = ({ query, setQuery, roleFilter, setRoleFilter }) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Lọc theo vai trò</InputLabel>
              <Select
                value={roleFilter}
                label="Lọc theo vai trò"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="staff">Nhân viên</MenuItem>
                <MenuItem value="customer">Khách hàng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

UserFilters.propTypes = {
  query: PropTypes.string.isRequired,
  setQuery: PropTypes.func.isRequired,
  roleFilter: PropTypes.string.isRequired,
  setRoleFilter: PropTypes.func.isRequired,
};

export default UserFilters;
