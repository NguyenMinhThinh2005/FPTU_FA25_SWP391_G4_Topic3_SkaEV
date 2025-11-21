import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import PropTypes from 'prop-types';

const ActionDialogs = ({ actionDialog, setActionDialog, handleActionComplete }) => {
  return (
    <>
      <Dialog
        open={actionDialog.open && actionDialog.type === "edit"}
        onClose={() =>
          setActionDialog({ open: false, type: "", station: null })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa trạm: {actionDialog.station?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Quản lý cài đặt trạm, trụ sạc và các thông số vận hành.
          </Typography>
          <TextField
            fullWidth
            label="Tên trạm"
            defaultValue={actionDialog.station?.name}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select defaultValue={actionDialog.station?.status}>
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="inactive">Không hoạt động</MenuItem>
              <MenuItem value="maintenance">Bảo trì</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog({ open: false, type: "", station: null })
            }
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              handleActionComplete(
                "Quản lý trạm",
                actionDialog.station?.name
              )
            }
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={actionDialog.open && actionDialog.type === "maintenance"}
        onClose={() =>
          setActionDialog({ open: false, type: "", station: null })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Lên lịch bảo trì: {actionDialog.station?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Lên lịch bảo trì cho các trụ và cổng sạc.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Trụ</InputLabel>
            <Select>
              {actionDialog.station?.charging?.poles?.map((pole) => (
                <MenuItem key={pole.id} value={pole.id}>
                  {pole.name} ({pole.type} - {pole.power}kW)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Mô tả vấn đề"
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog({ open: false, type: "", station: null })
            }
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              handleActionComplete(
                "Lên lịch bảo trì",
                actionDialog.station?.name
              )
            }
          >
            Lên lịch bảo trì
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={actionDialog.open && actionDialog.type === "delete"}
        onClose={() =>
          setActionDialog({ open: false, type: "", station: null })
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xóa trạm</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Hành động này không thể hoàn tác!
          </Alert>
          <Typography variant="body2">
            Bạn có chắc chắn muốn xóa{" "}
            <strong>{actionDialog.station?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog({ open: false, type: "", station: null })
            }
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              handleActionComplete(
                "Xóa trạm",
                actionDialog.station?.name
              )
            }
          >
            Xóa trạm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

ActionDialogs.propTypes = {
  actionDialog: PropTypes.object.isRequired,
  setActionDialog: PropTypes.func.isRequired,
  handleActionComplete: PropTypes.func.isRequired,
};

export default ActionDialogs;
