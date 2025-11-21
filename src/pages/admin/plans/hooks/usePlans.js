import { useState, useEffect } from "react";
import servicePlansAPI from "../../../../services/api/servicePlansAPI";

export const usePlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    planName: "",
    planType: "prepaid",
    description: "",
    pricePerKwh: "",
    monthlyFee: "",
    discountPercentage: "",
    maxPowerKw: "",
    priorityAccess: false,
    freeCancellation: false,
    features: "",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await servicePlansAPI.getAll();
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      setError("Không thể tải danh sách gói dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        planName: plan.planName,
        planType: plan.planType,
        description: plan.description || "",
        pricePerKwh: plan.pricePerKwh,
        monthlyFee: plan.monthlyFee || "",
        discountPercentage: plan.discountPercentage || "",
        maxPowerKw: plan.maxPowerKw || "",
        priorityAccess: plan.priorityAccess,
        freeCancellation: plan.freeCancellation,
        features: plan.features || "",
      });
    } else {
      setEditingPlan(null);
      setFormData({
        planName: "",
        planType: "prepaid",
        description: "",
        pricePerKwh: "",
        monthlyFee: "",
        discountPercentage: "",
        maxPowerKw: "",
        priorityAccess: false,
        freeCancellation: false,
        features: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPlan(null);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      const planData = {
        ...formData,
        pricePerKwh: parseFloat(formData.pricePerKwh),
        monthlyFee: formData.monthlyFee ? parseFloat(formData.monthlyFee) : null,
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : null,
        maxPowerKw: formData.maxPowerKw ? parseFloat(formData.maxPowerKw) : null,
      };

      if (editingPlan) {
        await servicePlansAPI.update(editingPlan.planId, planData);
        setSuccess("Cập nhật gói dịch vụ thành công");
      } else {
        await servicePlansAPI.create(planData);
        setSuccess("Tạo gói dịch vụ mới thành công");
      }

      handleCloseDialog();
      fetchPlans();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving plan:", error);
      setError("Có lỗi xảy ra khi lưu gói dịch vụ");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa gói dịch vụ này?")) {
      try {
        await servicePlansAPI.delete(id);
        setSuccess("Xóa gói dịch vụ thành công");
        fetchPlans();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error("Error deleting plan:", error);
        setError("Có lỗi xảy ra khi xóa gói dịch vụ");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await servicePlansAPI.toggleStatus(id);
      setSuccess("Cập nhật trạng thái thành công");
      fetchPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error toggling status:", error);
      setError("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  return {
    plans,
    loading,
    openDialog,
    editingPlan,
    error,
    success,
    formData,
    setFormData,
    setError,
    setSuccess,
    handleOpenDialog,
    handleCloseDialog,
    handleSubmit,
    handleDelete,
    handleToggleStatus
  };
};
