import { useState, useEffect } from "react";
import axiosInstance from "../../../../services/axiosConfig";

export const useSupportRequestsManagement = () => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/support-requests?pageNumber=1&pageSize=100`);
      
      if (response.data.success) {
        setRequests(response.data.data.requests);
      }
    } catch (error) {
      console.error("Error fetching support requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers?pageNumber=1&pageSize=200`);
      
      if (response.data.success) {
        setUsers(response.data.data.users);
        setStaff(response.data.data.users.filter(u => u.role === "staff"));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedRequest || !selectedStaffId) return;

    try {
      const response = await axiosInstance.patch(
        `/admin/support-requests/${selectedRequest.requestId}/assign`,
        { staffId: parseInt(selectedStaffId) }
      );

      if (response.data.success) {
        setSnackbar({ open: true, message: "Đã phân công thành công!", severity: "success" });
        setAssignDialogOpen(false);
        fetchRequests();
      }
    } catch (error) {
      console.error("Error assigning staff:", error);
      setSnackbar({ open: true, message: "Lỗi phân công nhân viên!", severity: "error" });
    }
  };

  const handleResolve = async () => {
    if (!selectedRequest || !resolutionNotes) return;

    try {
      const response = await axiosInstance.patch(
        `/admin/support-requests/${selectedRequest.requestId}/resolve`,
        { resolutionNotes }
      );

      if (response.data.success) {
        setSnackbar({ open: true, message: "Đã giải quyết yêu cầu!", severity: "success" });
        setResolveDialogOpen(false);
        setResolutionNotes("");
        fetchRequests();
      }
    } catch (error) {
      console.error("Error resolving request:", error);
      setSnackbar({ open: true, message: "Lỗi giải quyết yêu cầu!", severity: "error" });
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/support-requests/${requestId}/status`,
        { status: newStatus }
      );

      if (response.data.success) {
        setSnackbar({ open: true, message: `Đã cập nhật trạng thái: ${newStatus}`, severity: "success" });
        fetchRequests();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setSnackbar({ open: true, message: "Lỗi cập nhật trạng thái!", severity: "error" });
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.userId === userId);
    return user ? user.fullName : `User ${userId}`;
  };

  const getStaffName = (staffId) => {
    const staffMember = users.find(u => u.userId === staffId);
    return staffMember ? staffMember.fullName : "Chưa phân công";
  };

  const filteredRequests = requests.filter((req) => {
    // Status filter
    if (statusFilter !== "all" && req.status !== statusFilter) return false;
    
    // Priority filter
    if (priorityFilter !== "all" && req.priority !== priorityFilter) return false;
    
    // Category filter
    if (categoryFilter !== "all" && req.category !== categoryFilter) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.subject.toLowerCase().includes(query) ||
        req.description.toLowerCase().includes(query) ||
        getUserName(req.userId).toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const stats = {
    total: requests.length,
    open: requests.filter(r => r.status === "open").length,
    inProgress: requests.filter(r => r.status === "in_progress").length,
    resolved: requests.filter(r => r.status === "resolved").length,
    urgent: requests.filter(r => r.priority === "urgent").length,
  };

  return {
    loading,
    requests,
    users,
    staff,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    selectedRequest,
    setSelectedRequest,
    detailDialogOpen,
    setDetailDialogOpen,
    assignDialogOpen,
    setAssignDialogOpen,
    resolveDialogOpen,
    setResolveDialogOpen,
    selectedStaffId,
    setSelectedStaffId,
    resolutionNotes,
    setResolutionNotes,
    snackbar,
    setSnackbar,
    handleAssignStaff,
    handleResolve,
    handleUpdateStatus,
    getUserName,
    getStaffName,
    filteredRequests,
    stats,
    fetchRequests
  };
};
