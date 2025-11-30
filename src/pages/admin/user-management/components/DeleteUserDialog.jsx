import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
} from "@mui/material";
import { Warning } from "@mui/icons-material";
import PropTypes from "prop-types";

const DeleteUserDialog = ({ open, onClose, userToDelete, handleDelete }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Xác nhận xóa</DialogTitle>
      <DialogContent>
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          Hành động này không thể hoàn tác!
        </Alert>
        <Typography>
          Bạn có chắc chắn muốn xóa người dùng{" "}
          <strong>{userToDelete?.fullName}</strong> ({userToDelete?.email})?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" color="error" onClick={handleDelete}>
          Xóa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

DeleteUserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userToDelete: PropTypes.object,
  handleDelete: PropTypes.func.isRequired,
};

export default DeleteUserDialog;
