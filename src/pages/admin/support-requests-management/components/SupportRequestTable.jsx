import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Typography
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  PersonAdd as AssignIcon,
  CheckCircle as ResolveIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const getStatusColor = (status) => {
  switch (status) {
    case "open": return "warning";
    case "in_progress": return "info";
    case "resolved": return "success";
    case "closed": return "default";
    default: return "default";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "open": return "Chờ xử lý";
    case "in_progress": return "Đang xử lý";
    case "resolved": return "Đã giải quyết";
    case "closed": return "Đã đóng";
    default: return status;
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "low": return "success";
    case "medium": return "info";
    case "high": return "warning";
    case "urgent": return "error";
    default: return "default";
  }
};

const getPriorityLabel = (priority) => {
  switch (priority) {
    case "low": return "Thấp";
    case "medium": return "Trung bình";
    case "high": return "Cao";
    case "urgent": return "Khẩn cấp";
    default: return priority;
  }
};

const SupportRequestTable = ({
  requests,
  getUserName,
  getStaffName,
  onViewDetail,
  onAssign,
  onResolve
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Tiêu đề</TableCell>
            <TableCell>Người gửi</TableCell>
            <TableCell>Danh mục</TableCell>
            <TableCell>Độ ưu tiên</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Nhân viên xử lý</TableCell>
            <TableCell>Ngày tạo</TableCell>
            <TableCell align="right">Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((req) => (
              <TableRow key={req.requestId} hover>
                <TableCell>#{req.requestId}</TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography noWrap variant="body2" fontWeight="medium">
                    {req.subject}
                  </Typography>
                </TableCell>
                <TableCell>{getUserName(req.userId)}</TableCell>
                <TableCell>
                  <Chip 
                    label={req.category} 
                    size="small" 
                    variant="outlined" 
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getPriorityLabel(req.priority)}
                    color={getPriorityColor(req.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(req.status)}
                    color={getStatusColor(req.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color={req.assignedTo ? "textPrimary" : "textSecondary"}>
                    {req.assignedTo ? getStaffName(req.assignedTo) : "Chưa phân công"}
                  </Typography>
                </TableCell>
                <TableCell>
                  {format(new Date(req.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Xem chi tiết">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => onViewDetail(req)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {req.status !== "resolved" && req.status !== "closed" && (
                    <>
                      <Tooltip title="Phân công">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => onAssign(req)}
                        >
                          <AssignIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Giải quyết">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => onResolve(req)}
                        >
                          <ResolveIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                <Typography color="textSecondary">
                  Không tìm thấy yêu cầu hỗ trợ nào
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SupportRequestTable;
