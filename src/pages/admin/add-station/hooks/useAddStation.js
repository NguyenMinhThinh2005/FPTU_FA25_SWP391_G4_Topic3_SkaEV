import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useStationStore from "../../../../store/stationStore";

export const useAddStation = () => {
  const navigate = useNavigate();
  const { addStation } = useStationStore();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    description: "",
    address: "",
    
    // Charging Configuration
    totalPorts: 4,
    fastChargePorts: 2,
    standardPorts: 2,
    pricePerKwh: 3500,
    
    // Operating Details
    operatingHours: "24/7",
    status: "active",
    
    // Amenities
    amenities: [],
    
    // Contact Information
    contactPhone: "",
    contactEmail: "",
    managerName: "",
  });

  const amenitiesOptions = [
    "WiFi",
    "Restroom",
    "Parking",
    "Cafe",
    "Shopping",
    "ATM",
    "Security",
    "Maintenance",
    "EV Service",
    "Food Court",
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.name.trim()) newErrors.name = "Tên trạm sạc là bắt buộc";
        if (!formData.address.trim()) newErrors.address = "Địa chỉ là bắt buộc";
        break;
        
      case 1: // Charging Configuration
        if (formData.totalPorts < 1) newErrors.totalPorts = "Tổng số cổng sạc phải lớn hơn 0";
        if (formData.fastChargePorts < 0) newErrors.fastChargePorts = "Số cổng sạc nhanh không được âm";
        if (formData.standardPorts < 0) newErrors.standardPorts = "Số cổng sạc tiêu chuẩn không được âm";
        if (formData.fastChargePorts + formData.standardPorts > formData.totalPorts) {
          newErrors.totalPorts = "Tổng số cổng sạc nhanh và tiêu chuẩn không được vượt quá tổng số cổng";
        }
        if (formData.pricePerKwh < 0) newErrors.pricePerKwh = "Giá mỗi kWh không được âm";
        break;
        
      case 2: // Amenities & Services
        // No validation needed for amenities
        break;
        
      case 3: // Confirmation
        // Final validation
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setLoading(true);
    
    try {
      // Build payload matching backend CreateStationDto
      const stationData = {
        stationName: formData.name,
        address: formData.address,
        city: "TP. Hồ Chí Minh", // Default city
        latitude: 10.7769, // Default coordinates for Ho Chi Minh City
        longitude: 106.7009,
        operatingHours: formData.operatingHours,
        amenities: formData.amenities,
        stationImageUrl: null,
        status: formData.status,
        totalPorts: Number(formData.totalPorts) || 0,
        fastChargePorts: Number(formData.fastChargePorts) || 0,
        standardPorts: Number(formData.standardPorts) || 0,
        pricePerKwh: Number(formData.pricePerKwh) || 0,
        fastChargePowerKw: formData.fastChargePorts > 0 ? 120 : null,
        standardChargePowerKw: formData.standardPorts > 0 ? 22 : null,
      };

      await addStation(stationData);
      
      // Show success message and navigate back to Station Management
      alert("Trạm sạc đã được thêm thành công!");
      navigate("/admin/stations");
      
    } catch (error) {
      console.error("Error adding station:", error);
      alert("Có lỗi xảy ra khi thêm trạm sạc. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return {
    activeStep,
    loading,
    errors,
    formData,
    amenitiesOptions,
    handleInputChange,
    handleNext,
    handleBack,
    handleSubmit,
    navigate
  };
};
