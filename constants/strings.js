import DeviceManagementScreen from "../screens/DeviceManagement";

export const STRINGS = {
  EN: {
    GUIDE_HOME_DESC:
     "On this page you can view the current",
    GUIDE_WATER_ANALYSIS_DESC:
     "Here you can view the current water usage of the container, see when it will be empty, and know when it needs to be refilled.",
    /* ===== MAIN HEADERS ===== */
    APP_GUIDE_TITLE: "App Guide",
    APP_GUIDE_DESC: "Tap a section, then swipe screenshots left or right.",
    SENSOR_GUIDE_TITLE: "Sensor Guide",
    NOTES_TITLE: "Notes & Reminders",
    BACK: "Back",
    NEXT: "Next",

    GUIDE_SIDEBAR_DESCs:
    "Here are the additional settings available in the sidebar, where you can access notification settings, profile settings, device management, and the application guide.",

    /* ===== SIGN IN ===== */
    GUIDE_SIGN_IN_TITLE: "Sign In / Create an Account",
    GUIDE_SIGN_IN_SUB: "Log in securely with OTP verification.",
    GUIDE_SIGN_IN_SLIDE1: "Enter your credentials to sign in.",
    GUIDE_SIGN_IN_SLIDE2: "Tap 'Proceed' to enter your OTP.",
    GUIDE_SIGN_IN_SLIDE3: "Enter the OTP sent to your email.",

    /* ===== GENERAL SETTINGS ===== */
    GUIDE_GENERAL_TITLE: "General Settings",
    GUIDE_GENERAL_SUB: "Manage notifications and profile information.",
    GUIDE_HOME_TITLE: "Home",
    GUIDE_WATER_ANALYSIS_TITLE: "Water Container Analysis",
    GUIDE_SIDEBAR_DESC:
      "Access notification settings, profile settings, device management, and the application guide.",
    GUIDE_NOTIFICATION_TITLE: "Notification Settings",
    GUIDE_NOTIFICATION_DESC: "Select which notifications you want to receive.",
    GUIDE_NOTIFICATION_VIEW_DESC:
      "Here you can view the notifications you have selected to receive.",
    GUIDE_PROFILE_TITLE: "Profile Settings",
    GUIDE_PROFILE_DESC: "View and edit profile information.",

    /* ===== DEVICE MANAGEMENT ===== */
    GUIDE_DEVICE_TITLE: "Device Management",
    GUIDE_DEVICE_SUB: "Set up and manage connected devices.",
    GUIDE_DEVICE_TAP_DESC:
      "to view paired devices.",

    GUIDE_ADD_DEVICE_DESC1: "If no device is shown, click :",
    GUIDE_ADD_DEVICE_DESC2: "to add a plant device.",

    GUIDE_ADD_DEVICE_DESC:
      "Enter device name, select crop, and enter WiFi name and password.",
    GUIDE_MANAGE_DEVICE_DESC:
      "To Rename, Monitor, or Disconnect a device, tap the device.",
    GUIDE_DEVICE_SUCCESS_DESC:
      "A confirmation message will appear after adding a new device.",
    GUIDE_DEVICE_STATUS_DESC:
      "View all added devices and their pairing status.",
    GUIDE_DEVICE_STATUS_DESC11:
    "Once you have successfully added a new device, a pop-up message will appear confirming that the device has been added.",
    GUIDE_DEVICE_STATUS_DESC12:
    "You will then see all the devices you have added, along with their pairing status.",
    

    /* ===== CALIBRATION ===== */
    GUIDE_CALIBRATION_TITLE: "Calibration",
    GUIDE_CALIBRATION_SUB: "Set up the water container calibration.",
    GUIDE_SETUP_TANK_DESC:
      "to start setting up the tank.",
     GUIDE_SETUP_TANK_DESC11: "If you clicked on",
     GUIDE_SETUP_TANK_DESC111: "and this pop-up message appears, you can choose between",
     GUIDE_SETUP_TANK_DESC1111: "to reset the tank calibration.",
     GUIDE_SETUP_TANK_DESC11111: "If there is no set up tank, Click on ",
     GUIDE_SETUP_TANK_DESC111111: "Once clicked, a pop-up form will appear.",
     GUIDE_SETUP_TANK_DESC1111111: "When starting the tank calibration, make sure the tank is empty, then click",
    GUIDE_SETUP_TANK_DESC22: "Once clicked, a pop-up form will appear.",
    GUIDE_SETUP_TANK_DESC2: "When starting the tank calibration, make sure the tank is empty, then click",
    GUIDE_SETUP_TANK_DESC222: "When tank has already been filled up, click on",


    /* ===== CROP MONITOR ===== */
    GUIDE_CROP_TITLE: "Crop Monitor",
    GUIDE_CROP_SUB: "Connect to the sensor and view readings.",
    GUIDE_CROP_ACCESS_DESC:
        "To monitor the crop, select the currently active device. If the device is inactive, the Crop Monitor cannot be accessed.",
        GUIDE_CROP_ACCESS_DESC1:
        "After selecting a device, click",
        GUIDE_CROP_ACCESS_DESC2:
        "to view the crop monitoring dashboard.",
        GUIDE_CROP_ACCESS_DESC3:
        "This is the overview of the",
        GUIDE_CROP_ACCESS_DESC4:
        "Here, you can view the current soil status, check the device battery level, and see the",
        GUIDE_CROP_ACCESS_DESC5:
        "As you scroll down, you can also view the current tank level and the pump status.",

    /* ===== STATISTICS ===== */
    GUIDE_STATS_TITLE: "Statistics and Report",
    GUIDE_STATS_SUB: "Review history and export reports.",
    GUIDE_STATS_STEP1_DESC:
      "Go to Statistics, choose time range, then select a crop.",
    GUIDE_STATS_STEP2_DESC:
      "to print or share.",
    GUIDE_STATS_OVERVIEW_DESC:
      "This is the overview of the generated report.",

    /* ===== SENSOR GUIDE ===== */
    SENSOR_USE_TITLE: "How to use the device",
    SENSOR_USE_SUB: "Steps on how to operate the device.",
    SENSOR_SLIDE1: "Turn on the device and ensure it has power.",
    SENSOR_SLIDE2: "A blue LED indicates the device is powered on.",
    SENSOR_SLIDE3: "The second device must be plugged into a 220V power outlet, as it controls the water pump. It also includes an LED indicator for power status.",

    /* ===== SENSOR NOTES ===== */
    NOTE_1:
      "Always plug in the pump controller before operating the system.",
    NOTE_2:
      "Ensure the blue LED is ON before monitoring.",
    NOTE_3:
      "Keep the controller away from water splashes.",
    NOTE_4:
      "Disconnect power before maintenance.",



    devicerenamelabel: "Rename Device",
    DeviceManagement: "Device Management",
    devicesHeader: "Devices",
    devicenomanagement: "No devices found",
    addDeviceButton: "Add Device",
    activeConnections: "Active Connections",
    setupWaterTank: "Setup Water Tank",
    setuptank: "Setup Tank",
    disconnectDevice: "Disconnect Device",
    confirmDisconnect: "Are you sure you want to disconnect this device?",
    renameDevicePlaceholder: "Enter new device name",
    DeviceRenamed: "Device renamed successfully.",
    RenameFailed: "Failed to rename device.",
    DeviceDisconnected: "Device disconnected successfully.",
    DisconnectFailed: "Failed to disconnect device.",
    DeviceUnregistered: "Device unregistered successfully.",
    UnregisterFailed: "Failed to unregister device.",
    WiFiResetting: "Resetting WiFi Connection… This may take a moment.",
    WiFiResetSuccess: "WiFi reset successfully",
    WiFiResetFail: "Failed to reset WiFi. Please try again.",
    AddDeviceSuccess: "Device configured successfully. Waiting for device to come online...",
    AddDeviceIncomplete: "Please fill all required fields (WiFi password is optional for open networks).",
    NotLoggedIn: "You are not logged in.",
    UserNotAuthenticated: "User not authenticated.",
    DeviceConfigFail: "Could not reach ESP32. Connect to Oksi-Setup WiFi.",
    DeviceConfigured: "Device configured successfully! Switch back to your home WiFi.",
    ExistingCalibrationFound: "Existing Calibration Found",
    ExistingCalibrationMessage: "We detected a previous empty-tank calibration value.",
    UseExisting: "Use Existing",
    Recalibrate: "Recalibrate",
    WaterTankSetup: "Water Tank Setup",
    WiFiSSID: "WiFi SSID",
    WiFiPassword: "WiFi Password",
    Connect: "Connect",
    CalibrateEmpty: "Calibrate Empty",
    CalibrateFull: "Calibrate Full",
    FinishSetup: "Finish Setup",
    Cancel: "Cancel",
    MonitorDevice: "Monitor Device",
    DisconnectDevice: "Disconnect Device",
    ReconnectDevice: "Reconnect Device",
    ActivateDevice: "Activate Device",
    Unregister: "Unregister",
    DeviceRejected: "Device rejected configuration request",
    TankCalibrated: "Water container calibrated successfully.",
    CalibrationError: "Calibration Error",


    // Existing strings
    language: "Language",
    notificationSettings: "Notification Settings",
    profileSettings: "Profile Settings",
    appGuide: "Application Guide",
    aboutApp: "About the App",
    logout: "Log Out",
    hello: "Hello,",
    guest: "Guest",
    soilMoisture: "Soil Moisture",
    temperature: "Temperature",
    rainDetection: "Rain Detection",
    lightIntensity: "Light Intensity",
    waterLevel: "Water Tank Level",
    pumpStatus: "Pump Status",
    confirmLogout: "Confirm Log Out",
    logoutMessage: "Are you sure you want to log out?",
    cancel: "Cancel",
    logOutButton: "Log Out",
    profileScreenTitle: "Profile Settings",
    aboutAppScreenTitle: "About the App",
    appGuideScreenTitle: "Application Guide",
    DeviceManagement: "Device Management",
    

    // HomeScreen texts


    weatherSectionTitle: "Weather",
    unknownLocation: "Unknown location",
    cropHealthStatus: "Crop Health Status",
    waterContainerCalibration: "Water Container Calibration",
    waterContainerCalibration: "Water Container Calibration",
    wateranaylsis: "Water Container Analysis",

    collecthint: "If this never updates, your tank_data rows likely do not include calibration",
    collecthint2: "and your tank_level is not a percent. Store calibration in water_device or include it in tank_data",

    plantStatusPlaceholder: "Plant status will appear here after viewing sensor data from Crop Monitor.",
    lastUpdated: "Last updated",
    nostatusyet: "No status yet",
    calibrateWaterSensor: "Calibrate Water Sensor",
    hotspotSSID: "Hotspot SSID",
    hotspotPassword: "Hotspot Password",
    proceed: "Proceed",
    pleaseFillWiFi: "Please fill all WiFi fields",
    emptyTankStepMessage: "Please make sure your tank is empty before calibration.",
    fullTankStepMessage: "Fill your tank completely and press Calibrate Full.",
    calibrationSuccess: "Water Level Sensor successfully calibrated! Press Confirm to save.",
    calibrateEmpty: "Calibrate Empty",
    calibrateFull: "Calibrate Full",
    confirm: "Confirm",
    recalibrate: "Recalibrate",
    back: "Back",
    existingCalibrationFound: "Existing Calibration Found",
    useOrResetExisting: "An empty tank measurement already exists. Do you want to use it or reset?",
    offlineMode: "You are offline. Calibration will proceed via ESP32 only.",
    calibrationError: "Calibration Error",
    esp32NotConfirmed: "ESP32 did not confirm calibration.",
    errorESP32Connection: "Could not reach ESP32. Make sure you're connected to its hotspot.",
    resetCalibration: "Calibration Reset",
    recalibrateInfo: "You can now recalibrate the tank.",
    userNotAuthenticated: "User not authenticated. Please log in again.",
    esp32ConfigError: "ESP32 did not confirm configuration.",
    viewCropMonitorStatus: "View Crop Monitor to generate plant health status.",
    calibrationdistance: "Use previous empty distance?",
    useexisting: "Use existing",


    //notificaitons
    clearAll: "Clear All",
    noNotifications: "No notifications at the moment.",

    //statistics
    plotBed: "Plot Bed:",
    timeRange: "Time Range",
    crop: "Crop",
    noData: "No data available for this period.",
    environmentalSensors: "Environmental Sensors",
    avgTemp: "Average Temp",
    maxHumidity: "Max Humidity",
    rainStatus: "Rain Status",
    generateReport: "Generate Report",
    print: "Print",
    share: "Share",
    close: "Close",
    Devices: "Device",
    registeredddevice: "No devices registered yet",

    //crop monitor
    viewSensorData: "View Sensor Data",
    configureSensor: "Configure the Sensor",
    hotspotName: "Hotspot Name (SSID)",
    password: "Password",
    save: "Save",
    cancel: "Cancel",
    howToConnect: "How to connect and receive data from Oksi",
    hideGuide: "Hide guide",
    step1: "1. Power on the Sensor.",
    step2: "2. Connect your phone to ESP32 AP (default: Oksi).",
    step3: "3. Turn on your hotspot and fill SSID, password, and crop.",
    step4: '4. Tap "Save". ESP32 restarts and connects to your hotspot.',
    step5: "5. Reconnect your phone to internet to fetch sensor data.",
    sensorNotConfigured: "Sensor not configured",
    pleaseconfigure: "Please configure the sensor first.",
    retry: "Retry",
    pleaseWait: "Please wait...",
    disconnectDevice: "Disconnect Device",
    batteryLevel: "Battery Level",
    cropsEnvironment: "Crop’s Environment",
    temperature: "Temperature",
    humidity: "Humidity",
    lightIntensity: "Light Intensity",
    rainSensor: "Rain Sensor",
    waterTank: "Water Tank",
    pumpStatus: "Pump Status",
    sensorDisconnected: "Sensor Disconnected!",



  },

  FIL: {

    GUIDE_DEVICE_STATUS_DESC11:
    "Once na successfully mo nang na-add ang bagong device, may pop-up message na lalabas para i-confirm na na-add na ang device.",

    GUIDE_CROP_ACCESS_DESC: "Para i-monitor ang crop, piliin ang active na device. Kung inactive, hindi ma-access ang Crop Monitor.",
    GUIDE_CROP_ACCESS_DESC1: "Pag napili ang device, i-click",
    GUIDE_CROP_ACCESS_DESC2: "para makita ang crop monitoring dashboard.",
    GUIDE_CROP_ACCESS_DESC3: "Ito ang overview ng",
    GUIDE_CROP_ACCESS_DESC4: "Dito, puwede mong makita ang current soil status, device battery level, at ang",
    GUIDE_CROP_ACCESS_DESC5: "Pag nag-scroll ka pababa, makikita mo rin ang current tank level at pump status.",

    GUIDE_SETUP_TANK_DESC11: "Kung kinlick mo ang",
    GUIDE_SETUP_TANK_DESC111: " at lalabas itong pop-up message",
    GUIDE_SETUP_TANK_DESC1111: "para i-reset ang tank calibration.",
    GUIDE_SETUP_TANK_DESC11111: "Kung walang naka-setup na tank, i-click ang ",
    GUIDE_SETUP_TANK_DESC111111: "Pag-click mo, lalabas ang pop-up form.",
    GUIDE_SETUP_TANK_DESC1111111: "Pag sinisimulan ang tank calibration, siguraduhing empty ang tank, tapos i-click",
    GUIDE_SETUP_TANK_DESC22: "Pag-click mo, lalabas ang pop-up form.",
    GUIDE_SETUP_TANK_DESC2: "Pag start ang tank calibration, siguraduhing empty ang tank, tapos click",
    GUIDE_SETUP_TANK_DESC222: "Kapag napuno na ang tank, i-click ang",

    GUIDE_DEVICE_STATUS_DESC12:
    "Makikita mo na ngayon lahat ng devices na na-add mo, pati na rin ang kanilang pairing status.",
  
    GUIDE_SIDEBAR_DESCs:
      "Makikita dito sa sidebar ang mga additional settings tulad ng notification settings, profile settings, device management, at application guide.",

    GUIDE_HOME_DESC:
      "Dito makikita ang",
    GUIDE_WATER_ANALYSIS_DESC:
      "Makikita dito ang water usage ng container at kung kailan ito mauubos at kailangang i-refill.",

    GUIDE_ADD_DEVICE_DESC1: "Kung walang device, click :",
    GUIDE_ADD_DEVICE_DESC2: "para mag add plant device.",
    
    /* ===== MAIN HEADERS ===== */
    APP_GUIDE_TITLE: "App Guide",
    APP_GUIDE_DESC: "Tap ang section, then swipe left or right.",
    SENSOR_GUIDE_TITLE: "Sensor Guide",
    NOTES_TITLE: "Notes & Reminders",
    BACK: "Back",
    NEXT: "Next",

    /* ===== SIGN IN ===== */
    GUIDE_SIGN_IN_TITLE: "Sign In / Create Account",
    GUIDE_SIGN_IN_SUB: "Mag-login gamit ang OTP.",
    GUIDE_SIGN_IN_SLIDE1: "Ilagay ang credentials para mag-login.",
    GUIDE_SIGN_IN_SLIDE2: "Tap 'Proceed' para ilagay ang OTP.",
    GUIDE_SIGN_IN_SLIDE3: "Ilagay ang OTP na na-send sa email mo.",

    /* ===== GENERAL SETTINGS ===== */
    GUIDE_GENERAL_TITLE: "General Settings",
    GUIDE_GENERAL_SUB: "Manage notifications at profile.",
    GUIDE_HOME_TITLE: "Home",
    GUIDE_WATER_ANALYSIS_TITLE: "Water Container Analysis",
    GUIDE_SIDEBAR_DESC:
      "Dito makikita ang notification settings, profile, device management, at app guide.",
    GUIDE_NOTIFICATION_TITLE: "Notification Settings",
    GUIDE_NOTIFICATION_DESC: "Piliin ang notifications na gusto mong matanggap.",
    GUIDE_NOTIFICATION_VIEW_DESC:
      "Makikita dito ang napiling notifications.",
    GUIDE_PROFILE_TITLE: "Profile Settings",
    GUIDE_PROFILE_DESC: "Tingnan at i-edit ang profile information.",

    /* ===== DEVICE MANAGEMENT ===== */
    GUIDE_DEVICE_TITLE: "Device Management",
    GUIDE_DEVICE_SUB: "Mag-setup at manage ng devices.",
    GUIDE_DEVICE_TAP_DESC:
      "para makita ang paired devices.",
    GUIDE_ADD_DEVICE_DESC:
      "Click Add Device kung wala pang device. Ilagay ang name, piliin ang crop, at WiFi details.",
    GUIDE_MANAGE_DEVICE_DESC:
      "Pwede mong i-Rename, Monitor, o i-Disconnect ang device.",
    GUIDE_DEVICE_SUCCESS_DESC:
      "May lalabas na confirmation kapag successful ang pag-add.",
    GUIDE_DEVICE_STATUS_DESC:
      "Makikita dito lahat ng devices at status nila.",

    /* ===== CALIBRATION ===== */
    GUIDE_CALIBRATION_TITLE: "Calibration",
    GUIDE_CALIBRATION_SUB: "Mag-setup ng water tank calibration.",
    GUIDE_SETUP_TANK_DESC:
      "para simulan ang setup.",
    


    

    /* ===== CROP MONITOR ===== */
    GUIDE_CROP_TITLE: "Crop Monitor",
    GUIDE_CROP_SUB: "Tingnan ang sensor readings.",
    GUIDE_CROP_ACCESS_DESC:
      "Pumili ng active device para ma-access ang Crop Monitor.",
    GUIDE_CROP_DASHBOARD_DESC:
      "Tap Crop Monitor para makita ang dashboard.",
    GUIDE_CROP_OVERVIEW_DESC:
      "Makikita ang soil status, battery level, temperature, humidity, light, at rain data.",
    GUIDE_CROP_SCROLL_DESC:
      "Mag-scroll pababa para makita ang tank level at pump status.",

    /* ===== STATISTICS ===== */
    GUIDE_STATS_TITLE: "Statistics & Report",
    GUIDE_STATS_SUB: "Tingnan ang history at mag-generate ng report.",
    GUIDE_STATS_STEP1_DESC:
      "Pumunta sa Statistics, piliin ang time range at crop.",
    GUIDE_STATS_STEP2_DESC:
      "para i-print o i-share.",
    GUIDE_STATS_OVERVIEW_DESC:
      "Ito ang overview ng generated report.",

    /* ===== SENSOR GUIDE ===== */
    SENSOR_USE_TITLE: "How to Use the Device",
    SENSOR_USE_SUB: "Mga steps kung paano gamitin ang device.",
    SENSOR_SLIDE1: "I-on ang device at siguraduhing may power.",
    SENSOR_SLIDE2: "Blue LED means naka-on ang device.",
    SENSOR_SLIDE3: "Ang second device dapat nakaplug sa 220V power outlet kasi ito ang nagko-control ng water pump. May LED indicator rin ito para sa power status.",

    /* ===== SENSOR NOTES ===== */
    NOTE_1: "Isaksak muna ang pump controller bago gamitin.",
    NOTE_2: "Siguraduhing naka-ON ang blue LED.",
    NOTE_3: "Iwasang mabasa ang controller.",
    NOTE_4: "I-unplug bago mag-maintenance.",

    devicerenamelabel: "Irename Device",
    setuptank: "Isetup ang Tank",
    DeviceManagement: "Management ng Device",
    devicesHeader: "Mga Device",
    devicenomanagement: "Walang mahanap na device",
    addDeviceButton: "Magdagdag ng Device",
    activeConnections: "Mga Active Koneksyon",
    setupWaterTank: "I-setup ang Tangke ng Tubig",
    disconnectDevice: "I-disconnect ang Device",
    confirmDisconnect: "Sigurado ka bang gusto mong i-disconnect ang device na ito?",
    renameDevicePlaceholder: "Ilagay ang bagong pangalan ng device",
    DeviceRenamed: "Matagumpay na napangalanan ang device.",
    RenameFailed: "Nabigong palitan ang pangalan ng device.",
    DeviceDisconnected: "Matagumpay na nakaputol ang koneksyon ng device.",
    DisconnectFailed: "Nabigong putulin ang koneksyon ng device.",
    DeviceUnregistered: "Matagumpay na na-unregister ang device.",
    UnregisterFailed: "Nabigong i-unregister ang device.",
    WiFiResetting: "Ire-reset ang WiFi… Maaaring magtagal ng kaunti.",
    WiFiResetSuccess: "Matagumpay na na-reset ang WiFi",
    WiFiResetFail: "Nabigong i-reset ang WiFi. Pakisubukang muli.",
    AddDeviceSuccess: "Matagumpay na na-configure ang device. Hintayin itong maging online...",
    AddDeviceIncomplete: "Paki-fill ang lahat ng kinakailangang field (Opsyonal ang WiFi password para sa open networks).",
    NotLoggedIn: "Hindi ka naka-login.",
    UserNotAuthenticated: "Hindi nakumpirma ang user.",
    DeviceConfigFail: "Hindi maabot ang ESP32. Kumonekta sa Oksi-Setup WiFi.",
    DeviceConfigured: "Matagumpay na na-configure ang device! Bumalik sa iyong home WiFi.",
    ExistingCalibrationFound: "May Natagpuang na Kalibrasyon",
    ExistingCalibrationMessage: "Nakakita kami ng naunang empty-tank calibration value.",
    UseExisting: "Gamitin ang Umiiral",
    Recalibrate: "Muling I-kalibrate",
    WaterTankSetup: "Setup ng Water Tank",
    WiFiSSID: "WiFi SSID",
    WiFiPassword: "WiFi Password",
    Connect: "Kumonekta",
    CalibrateEmpty: "I-kalibrate ang Empty",
    CalibrateFull: "I-kalibrate ang Full",
    FinishSetup: "Tapusin ang Setup",
    Cancel: "Kanselahin",
    MonitorDevice: "I-monitor ang Device",
    DisconnectDevice: "Putulin ang Koneksyon ng Device",
    ReconnectDevice: "Muling Ikonekta ang Device",
    ActivateDevice: "I-activate ang Device",
    Unregister: "I-unregister",
    DeviceRejected: "Tinanggihan ng device ang configuration request",
    TankCalibrated: "Matagumpay na nakalibrate ang water container.",
    CalibrationError: "Error sa Kalibrasyon",

    // Existing strings
    language: "Wika",
    notificationSettings: "Setting ng Notipikasyon",
    profileSettings: "Setting ng Profile",
    appGuide: "Gabay sa Application",
    aboutApp: "Tungkol sa App",
    logout: "Mag-log Out",
    hello: "Kumusta,",
    guest: "Bisita",
    soilMoisture: "Moisture ng Lupa",
    temperature: "Temperatura",
    rainDetection: "Detection ng Ulan",
    lightIntensity: "Liwanag",
    waterLevel: "Water Level sa Tangke",
    pumpStatus: "Status ng Pump",
    confirmLogout: "Iconfirm ang Pag-log Out",
    logoutMessage: "Sigurado ka bang gusto mong mag-log out?",
    cancel: "Kanselahin",
    logOutButton: "Mag-log Out",
    profileScreenTitle: "Setting ng Profile",
    aboutAppScreenTitle: "Tungkol sa App",
    appGuideScreenTitle: "Gabay sa Application",
    DeviceManagement: "Management ng Device",


    // HomeScreen texts
    useexisting: "Gamiting ang existing",
    calibrationdistance: "Gamitin ang previous empty distance?",
    collecthint: "Kung ito ay hindi nag-a-update, malamang ang iyong tank_data rows ay walang calibration",
    collecthint2: "at ang iyong tank_level ay hindi isang porsyento. I-store ang calibration sa water_device o isama ito sa tank_data.",

    viewCropMonitorStatus: "Iview ang Crop Monitor para sa ng status ng halaman.",
    nostatusyet: "Waalang status",
    watercontainer: "Container ng Tubig",
    weatherSectionTitle: "Panahon",
    unknownLocation: "Hindi tukoy ang lokasyon",
    cropHealthStatus: "Kalusugan ng Pananim",
    waterContainerCalibration: "Pag-calibrate ng Tangke ng Tubig",
    wateranaylsis: "Analysis ng Water Container",
    setupWaterContainer: "I-set up ang iyong tangke ng tubig",
    startCalibration: "Pindutin upang simulan ang proseso ng calibration",
    plantStatusPlaceholder: "Ang status ng halaman ay lalabas dito tingnan ang sensor data mula sa Crop Monitor.",
    lastUpdated: "Huling na-update",
    calibrateWaterSensor: "I-calibrate ang Water Sensor",
    hotspotSSID: "SSID ng Hotspot",
    hotspotPassword: "Password ng Hotspot",
    proceed: "Magpatuloy",
    pleaseFillWiFi: "Paki-fill ang lahat ng WiFi fields",
    emptyTankStepMessage: "Siguraduhing walang laman ang iyong tangke bago mag-calibrate.",
    fullTankStepMessage: "Punuin ang iyong tangke at pindutin ang Calibrate Full.",
    calibrationSuccess: "Matagumpay na na-calibrate ang Water Level Sensor! Pindutin ang Confirm upang i-save.",
    calibrateEmpty: "I-Calibrate ang Empty",
    calibrateFull: "I-Calibrate ang Full",
    confirm: "Kumpirmahin",
    recalibrate: "Muling i-Calibrate",
    back: "Bumalik",
    existingCalibrationFound: "May Naunang Calibration",
    useOrResetExisting: "May existing na empty tank measurement. Gusto mo bang gamitin o i-reset?",
    offlineMode: "Offline ka. Magpapatuloy ang calibration sa pamamagitan ng ESP32 lamang.",
    calibrationError: "Error sa Calibration",
    esp32NotConfirmed: "Hindi kinumpirma ng ESP32 ang calibration.",
    errorESP32Connection: "Hindi maabot ang ESP32. Siguraduhing konektado ka sa hotspot nito.",
    resetCalibration: "Na-reset ang Calibration",
    recalibrateInfo: "Maaari mo nang muling i-calibrate ang tangke.",
    userNotAuthenticated: "Hindi authenticated ang user. Mag-log in muli.",
    esp32ConfigError: "Hindi kinumpirma ng ESP32 ang configuration.",

    
    //notificaitons
    clearAll: "I-clear Lahat",
    noNotifications: "Walang notification sa ngayon.",

    //statistics
    registeredddevice: "Walang naka registered na device",
    plotBed: "Plot ng Halaman:",
    timeRange: "Mga Range ng Oras",
    crop: "Pananim",
    noData: "Walang data para sa period na ito.",
    environmentalSensors: "Mga Sensor ng Kapaligiran",
    avgTemp: "Average na Temperatura",
    maxHumidity: "Pinakamataas na Humidity",
    rainStatus: "Status ng Ulan",
    generateReport: "Mag Generate ng Report",
    print: "I-print",
    share: "Ibahagi",
    close: "Isara",
    Devices: "Mga Device",

    //crop monitor
    viewSensorData: "Tingnan ang Data ng Sensor",
    configureSensor: "I-configure ang Sensor",
    hotspotName: "Pangalan ng Hotspot (SSID)",
    password: "Password",
    save: "I-save",
    cancel: "Kanselahin",
    howToConnect: "Paano kumonekta at tumanggap ng data mula sa Oksi",
    hideGuide: "Itago ang gabay",
    step1: "1. Buksan ang Sensor.",
    step2: "2. Kumonekta sa ESP32 AP (default: Oksi).",
    step3: "3. Buksan ang hotspot at ilagay ang SSID, password, at crop.",
    step4: '4. Pindutin ang "I-save". Magre-restart ang ESP32 at kumonekta sa hotspot.',
    step5: "5. Kumonekta muli sa internet upang makuha ang data ng sensor.",
    sensorNotConfigured: "Hindi naka-configure ang sensor.",
    pleaseconfigure: "I-configure muna ito.",
    retry: "Ulitin",
    pleaseWait: "Mangyaring maghintay...",
    disconnectDevice: "I-disconnect ang Device",
    batteryLevel: "Antas ng Baterya",
    cropsEnvironment: "Kapaligiran ng Pananim",
    temperature: "Temperatura",
    humidity: "Halumigmig",
    lightIntensity: "Liwanag",
    rainSensor: "Sensor ng Ulan",
    waterTank: "Tangke ng Tubig",
    pumpStatus: "Status ng Pump",
    sensorDisconnected: "Na-disconnect ang Sensor!",



        
  },
};