import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Divider,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export const SupportRequestDetailDialog = ({
  open,
  onClose,
  request,
  getUserName,
  getStaffName
}) => {
  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Chi tiết Yêu cầu #{request.requestId}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {request.subject}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Người gửi</Typography>
            <Typography variant="body1" gutterBottom>{getUserName(request.userId)}</Typography>
            
            <Typography variant="subtitle2" color="textSecondary">Email</Typography>
            <Typography variant="body1" gutterBottom>{request.email || "N/A"}</Typography>
            
            <Typography variant="subtitle2" color="textSecondary">Số điện thoại</Typography>
            <Typography variant="body1" gutterBottom>{request.phoneNumber || "N/A"}</Typography>

            <Typography variant="subtitle2" color="textSecondary">Nhân viên xử lý</Typography>
            <Typography variant="body1" gutterBottom>
              {request.assignedTo ? getStaffName(request.assignedTo) : "Chưa phân công"}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Trạng thái</Typography>
            <Box mb={1}>
              <Chip label={request.status} size="small" />
            </Box>
            
            <Typography variant="subtitle2" color="textSecondary">Độ ưu tiên</Typography>
            <Box mb={1}>
              <Chip label={request.priority} size="small" />
            </Box>
            
            <Typography variant="subtitle2" color="textSecondary">Danh mục</Typography>
            <Box mb={1}>
              <Chip label={request.category} size="small" />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="textSecondary">Nội dung yêu cầu</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: "#f5f5f5" }}>
              <Typography variant="body1" style={{ whiteSpace: "pre-wrap" }}>
                {request.description}
              </Typography>
            </Paper>
          </Grid>

          {request.resolutionNotes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                Ghi chú giải quyết
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: "#e8f5e9" }}>
                <Typography variant="body1" style={{ whiteSpace: "pre-wrap" }}>
                  {request.resolutionNotes}
                </Typography>
              </Paper>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="textSecondary">
              Tạo lúc: {format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
              {request.updatedAt && ` | Cập nhật lần cuối: ${format(new Date(request.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}`}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export const AssignStaffDialog = ({
  open,
  onClose,
  staffList,
  selectedStaffId,
  setSelectedStaffId,
  onConfirm
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Phân công nhân viên</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          <FormControl fullWidth>
            <InputLabel>Chọn nhân viên</InputLabel>
            <Select
              value={selectedStaffId}
              label="Chọn nhân viên"
              onChange={(e) => setSelectedStaffId(e.target.value)}
            >
              {staffList.map((staff) => (
                <MenuItem key={staff.userId} value={staff.userId}>
                  {staff.fullName} ({staff.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          disabled={!selectedStaffId}
        >
          Phân công
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ResolveDialog = ({
  open,
  onClose,
  resolutionNotes,
  setResolutionNotes,
  onConfirm
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Giải quyết yêu cầu</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Ghi chú giải quyết"
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Nhập chi tiết cách giải quyết vấn đề..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="success"
          disabled={!resolutionNotes.trim()}
        >
          Xác nhận giải quyết
        </Button>
      </DialogActions>
    </Dialog>
  );
};

import { Paper } from "@mui/material"; // Added missing import
