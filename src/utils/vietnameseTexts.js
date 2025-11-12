// Vietnamese text constants for the application
export const VIETNAMESE_TEXTS = {
  // Common
  common: {
    loading: "Đang tải...",
    save: "Lưu",
    cancel: "Hủy",
    delete: "Xóa",
    edit: "Chỉnh sửa",
    view: "Xem",
    search: "Tìm kiếm",
    filter: "Lọc",
    back: "Quay lại",
    next: "Tiếp theo",
    previous: "Trước đó",
    submit: "Gửi",
    confirm: "Xác nhận",
    close: "Đóng",
    open: "Mở",
    success: "Thành công",
    error: "Lỗi",
    warning: "Cảnh báo",
    info: "Thông tin",
    yes: "Có",
    no: "Không",
    select: "Chọn",
    all: "Tất cả",
    none: "Không có",
    or: "hoặc",
    and: "và",
  },

  // Authentication
  auth: {
    login: "Đăng nhập",
    logout: "Đăng xuất",
    register: "Đăng ký",
    email: "Email",
    password: "Mật khẩu",
    confirmPassword: "Xác nhận mật khẩu",
    firstName: "Tên",
    lastName: "Họ",
    phone: "Số điện thoại",
    forgotPassword: "Quên mật khẩu?",
    rememberMe: "Ghi nhớ đăng nhập",
    loginTitle: "Đăng nhập vào SkaEV",
    registerTitle: "Tạo tài khoản SkaEV",
    loginSubtitle: "Hệ thống quản lý trạm sạc xe điện",
    registerSubtitle: "Tham gia mạng lưới sạc xe điện thông minh",
    alreadyHaveAccount: "Đã có tài khoản?",
    dontHaveAccount: "Chưa có tài khoản?",
    loginHere: "Đăng nhập tại đây",
    registerHere: "Đăng ký tại đây",
    signingIn: "Đang đăng nhập...",
    registering: "Đang đăng ký...",
    loginError: "Email hoặc mật khẩu không đúng",
    registerError: "Có lỗi xảy ra khi đăng ký",
    welcomeBack: "Chào mừng trở lại",
    loginSuccess: "Đăng nhập thành công",
    registerSuccess: "Đăng ký thành công",
    demoAccounts: "Tài khoản demo",
    clickToFill: "Nhấp vào bất kỳ tài khoản demo nào để tự động điền thông tin",
    getStarted: "Bắt đầu ngay",
    getStartedToday: "Bắt đầu hôm nay",
    signUpFree: "Đăng ký miễn phí",
  },

  // Navigation & Menu
  nav: {
    dashboard: "Bảng điều khiển",
    findStations: "Tìm trạm sạc",
    bookingHistory: "Lịch sử đặt chỗ",
    paymentMethods: "Phương thức thanh toán",
    profile: "Hồ sơ cá nhân",
    stationManagement: "Quản lý trạm sạc",
    userManagement: "Quản lý người dùng",
    analytics: "Phân tích",
    advancedAnalytics: "Phân tích tổng quan",
    settings: "Cài đặt",
    welcome: "Chào mừng",
    home: "Trang chủ",
    about: "Giới thiệu",
    contact: "Liên hệ",
    help: "Trợ giúp",
  },

  // Home Page
  home: {
    title: "Mạng lưới sạc xe điện thông minh",
    subtitle:
      "Quản lý trạm sạc xe điện hiệu quả với nền tảng toàn diện của chúng tôi. Giám sát thời gian thực, đặt chỗ thông minh và thanh toán liền mạch.",
    features: {
      fastCharging: {
        title: "Sạc siêu nhanh",
        description:
          "Sạc DC siêu nhanh lên đến 250kW cho việc nạp điện nhanh chóng",
      },
      wideNetwork: {
        title: "Mạng lưới rộng khắp",
        description: "Hệ thống trạm sạc rộng khắp trên toàn thành phố",
      },
      greenEnergy: {
        title: "Năng lượng xanh",
        description: "100% từ nguồn năng lượng tái tạo cho việc sạc bền vững",
      },
      securePayments: {
        title: "Thanh toán an toàn",
        description: "Xử lý thanh toán an toàn và bảo mật với nhiều tùy chọn",
      },
    },
    stats: {
      activeStations: "Trạm đang hoạt động",
      happyCustomers: "Khách hàng hài lòng",
      chargingSessions: "Lượt sạc",
      co2Saved: "CO₂ đã tiết kiệm",
    },
    whyChoose: "Tại sao chọn SkaEV?",
    whyChooseSubtitle:
      "Các tính năng tiên tiến cho quản lý sạc xe điện hiện đại",
  readyToStart: "Đang sẵn sàng bắt đầu sạc?",
    readyToStartSubtitle:
      "Tham gia cùng hàng nghìn tài xế xe điện đang sử dụng mạng lưới sạc SkaEV",
    goToDashboard: "Vào Dashboard",
    findStations: "Tìm trạm sạc",
    copyright: "© 2025 SkaEV. Nền tảng quản lý sạc xe điện.",
  },

  // Station Management
  stations: {
    title: "Tìm trạm sạc",
    subtitle: "Khám phá các trạm sạc gần bạn và đặt lịch sạc",
    searchPlaceholder: "Tìm kiếm theo vị trí, tên trạm...",
    connectorType: "Loại cổng sạc",
    maxDistance: "Khoảng cách tối đa",
    stationsFound: "trạm được tìm thấy",
    available: "Có sẵn",
    full: "Đầy",
    offline: "Ngoại tuyến",
    away: "xa",
    upTo: "Lên đến",
    from: "Từ",
    reviews: "đánh giá",
    bookNow: "Đặt ngay",
    bookThisStation: "Đặt trạm này",
    selectStation: "Chọn một trạm",
    selectStationDescription:
      "Chọn một trạm sạc từ danh sách để xem thông tin chi tiết và đặt lịch.",
    chargingInfo: "Thông tin sạc",
    maxPower: "Công suất tối đa",
    availablePorts: "Cổng có sẵn",
    connectorTypes: "Loại cổng sạc",
    pricing: "Giá cả",
    acCharging: "Sạc AC",
    dcCharging: "Sạc DC",
    parking: "Đỗ xe",
    distance: "Khoảng cách",
    bookingSuccess:
      "Đặt chỗ thành công tại {stationName}! Mã đặt chỗ: {bookingId}",
  },

  // Booking
  booking: {
    title: "Đặt trạm sạc",
    selectTime: "Chọn thời gian",
    selectDuration: "Chọn thời lượng",
    selectConnector: "Chọn loại cổng sạc",
    estimatedCost: "Chi phí ước tính",
    bookingConfirmation: "Xác nhận đặt chỗ",
    bookingDetails: "Chi tiết đặt chỗ",
    station: "Trạm sạc",
    dateTime: "Ngày giờ",
    duration: "Thời lượng",
    connector: "Cổng sạc",
    totalCost: "Tổng chi phí",
    confirmBooking: "Xác nhận đặt chỗ",
    bookingId: "Mã đặt chỗ",
    bookingDate: "Ngày đặt",
    status: "Trạng thái",
    pending: "Đang chờ",
    confirmed: "Đã xác nhận",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  },

  // History
  history: {
    title: "Lịch sử đặt chỗ",
    subtitle: "Xem lại các lần sạc trước đây",
    noBookings: "Chưa có lịch sử đặt chỗ",
    noBookingsDescription:
      "Bạn chưa có lần đặt chỗ nào. Hãy tìm và đặt trạm sạc đầu tiên!",
    viewDetails: "Xem chi tiết",
    cancelBooking: "Hủy đặt chỗ",
    rateExperience: "Đánh giá trải nghiệm",
  },

  // Profile
  profile: {
    title: "Hồ sơ cá nhân",
    subtitle: "Quản lý thông tin tài khoản của bạn",
    personalInfo: "Thông tin cá nhân",
    contactInfo: "Thông tin liên hệ",
    preferences: "Tùy chọn",
    security: "Bảo mật",
    changePassword: "Đổi mật khẩu",
    currentPassword: "Mật khẩu hiện tại",
    newPassword: "Mật khẩu mới",
    avatar: "Ảnh đại diện",
    uploadPhoto: "Tải ảnh lên",
    saveChanges: "Lưu thay đổi",
    profileUpdated: "Cập nhật hồ sơ thành công",
    passwordChanged: "Đổi mật khẩu thành công",
  },

  // Payment
  payment: {
    title: "Phương thức thanh toán",
    subtitle: "Quản lý các phương thức thanh toán của bạn",
    addPaymentMethod: "Thêm phương thức thanh toán",
    creditCard: "Thẻ tín dụng",
    debitCard: "Thẻ ghi nợ",
    wallet: "Ví điện tử",
    bankTransfer: "Chuyển khoản ngân hàng",
    cardNumber: "Số thẻ",
    expiryDate: "Ngày hết hạn",
    cvv: "Mã CVV",
    cardHolder: "Chủ thẻ",
    defaultMethod: "Phương thức mặc định",
    setAsDefault: "Đặt làm mặc định",
    removeMethod: "Xóa phương thức",
    paymentMethods: "Phương thức thanh toán",
    noPaymentMethods: "Chưa có phương thức thanh toán",
    addFirstMethod: "Thêm phương thức thanh toán đầu tiên",
  },

  // Admin Dashboard
  admin: {
    title: "Bảng điều khiển quản trị",
    subtitle: "Tổng quan hệ thống",
    totalStations: "Tổng số trạm",
    totalUsers: "Tổng số người dùng",
    totalBookings: "Tổng số đặt chỗ",
    totalRevenue: "Tổng doanh thu",
    recentActivity: "Hoạt động gần đây",
    systemStatus: "Trạng thái hệ thống",
    quickActions: "Thao tác nhanh",
    addNewStation: "Thêm trạm mới",
    manageUsers: "Quản lý người dùng",
    viewReports: "Xem báo cáo",
    systemHealth: "Tình trạng hệ thống",
    healthy: "Tốt",
    warning: "Cảnh báo",
    critical: "Nghiêm trọng",
  },

  // Staff Dashboard
  staff: {
    title: "Bảng điều khiển nhân viên",
    subtitle: "Quản lý trạm sạc được phân công",
    myStations: "Trạm của tôi",
    todayBookings: "Đặt chỗ hôm nay",
    maintenanceAlerts: "Cảnh báo bảo trì",
    quickMaintenance: "Bảo trì nhanh",
    stationStatus: "Trạng thái trạm",
    updateStatus: "Cập nhật trạng thái",
    reportIssue: "Báo cáo sự cố",
    resolveIssue: "Giải quyết sự cố",
  },

  // User Management
  users: {
    title: "Quản lý người dùng",
    subtitle: "Quản lý tài khoản người dùng hệ thống",
    addUser: "Thêm người dùng",
    editUser: "Chỉnh sửa người dùng",
    userDetails: "Chi tiết người dùng",
    role: "Vai trò",
    status: "Trạng thái",
    lastLogin: "Đăng nhập lần cuối",
    actions: "Thao tác",
    active: "Hoạt động",
    inactive: "Không hoạt động",
    suspended: "Tạm dừng",
    customer: "Khách hàng",
    staff: "Nhân viên",
    admin: "Quản trị viên",
    searchUsers: "Tìm kiếm người dùng...",
    filterByRole: "Lọc theo vai trò",
    userCount: "người dùng",
    activate: "Kích hoạt",
    deactivate: "Vô hiệu hóa",
    resetPassword: "Đặt lại mật khẩu",
  },

  // Settings
  settings: {
    title: "Cài đặt hệ thống",
    subtitle: "Cấu hình các tham số hệ thống",
    general: "Chung",
    notifications: "Thông báo",
    security: "Bảo mật",
    integrations: "Tích hợp",
    systemName: "Tên hệ thống",
    systemDescription: "Mô tả hệ thống",
    timezone: "múi giờ",
    language: "Ngôn ngữ",
    currency: "Đơn vị tiền tệ",
    emailNotifications: "Thông báo email",
    smsNotifications: "Thông báo SMS",
    pushNotifications: "Thông báo đẩy",
    maintenanceMode: "Chế độ bảo trì",
    backupSettings: "Cài đặt sao lưu",
    apiSettings: "Cài đặt API",
    saveSettings: "Lưu cài đặt",
    settingsSaved: "Cài đặt đã được lưu",
  },

  // Error Messages
  errors: {
    generalError: "Đã xảy ra lỗi. Vui lòng thử lại.",
    networkError: "Lỗi kết nối mạng. Kiểm tra kết nối internet.",
    notFound: "Không tìm thấy trang yêu cầu.",
    unauthorized: "Bạn không có quyền truy cập.",
    forbidden: "Truy cập bị từ chối.",
    serverError: "Lỗi máy chủ nội bộ.",
    validationError: "Dữ liệu nhập không hợp lệ.",
    emailRequired: "Email là bắt buộc",
    passwordRequired: "Mật khẩu là bắt buộc",
    passwordTooShort: "Mật khẩu phải có ít nhất 6 ký tự",
    emailInvalid: "Email không hợp lệ",
    phoneInvalid: "Số điện thoại không hợp lệ",
    required: "Trường này là bắt buộc",
  },

  // Success Messages
  success: {
    loginSuccess: "Đăng nhập thành công!",
    registerSuccess: "Đăng ký thành công!",
    profileUpdated: "Cập nhật hồ sơ thành công!",
    passwordChanged: "Đổi mật khẩu thành công!",
    bookingCreated: "Đặt chỗ thành công!",
    bookingCancelled: "Hủy đặt chỗ thành công!",
    stationAdded: "Thêm trạm sạc thành công!",
    stationUpdated: "Cập nhật trạm sạc thành công!",
    userAdded: "Thêm người dùng thành công!",
    userUpdated: "Cập nhật người dùng thành công!",
    settingsSaved: "Lưu cài đặt thành công!",
  },

  // Time and Date
  time: {
    minutes: "phút",
    hours: "giờ",
    days: "ngày",
    weeks: "tuần",
    months: "tháng",
    years: "năm",
    ago: "trước",
    now: "Bây giờ",
    today: "Hôm nay",
    yesterday: "Hôm qua",
    tomorrow: "Ngày mai",
    thisWeek: "Tuần này",
    nextWeek: "Tuần tới",
    thisMonth: "Tháng này",
    nextMonth: "Tháng tới",
  },

  // Units and Measurements
  units: {
    km: "km",
    m: "m",
    kw: "kW",
    kwh: "kWh",
    volt: "V",
    amp: "A",
    celsius: "°C",
    percent: "%",
    vnd: "₫",
    perHour: "/giờ",
    perKwh: "/kWh",
  },
};

// Helper function to get text by path
export const getText = (path, fallback = "") => {
  const keys = path.split(".");
  let result = VIETNAMESE_TEXTS;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key];
    } else {
      return fallback || path;
    }
  }

  return typeof result === "string" ? result : fallback || path;
};

// Helper function to format text with variables
export const formatText = (path, variables = {}, fallback = "") => {
  let text = getText(path, fallback);

  // Replace variables in format {variableName}
  Object.keys(variables).forEach((key) => {
    const placeholder = `{${key}}`;
    text = text.replace(new RegExp(placeholder, "g"), variables[key]);
  });

  return text;
};

export default VIETNAMESE_TEXTS;
