import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  ActivityIndicator,
  Alert,
  Easing,
} from "react-native";
import { supabase } from "../lib/supabase";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_W = (SCREEN_WIDTH - 56) / 2;
const CARD_H = 170;

/* =========================================================
   PulseCard
========================================================= */
const PulseCard = ({ status, children }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.05, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [status]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
};

export default function DeviceManagementScreen() {
  const navigation = useNavigation();

  const [devices, setDevices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [userId, setUserId] = useState(null);
  const [infoModal, setInfoModal] = useState({ visible: false, message: "" });
  const [confirmModal, setConfirmModal] = useState({ visible: false });

  const activeDevice = devices.find((d) => d.id === selected);

  // Add device modal states
  const [addModal, setAddModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newCrop, setNewCrop] = useState("");
  const [newWifiSSID, setNewWifiSSID] = useState("");
  const [newWifiPassword, setNewWifiPassword] = useState("");
  const [showNewWifiPassword, setShowNewWifiPassword] = useState(false);

  // Activate device modal states
  const [activatingDevice, setActivatingDevice] = useState(null);
  const [activateModal, setActivateModal] = useState(false);
  const [activateSSID, setActivateSSID] = useState("");
  const [activatePassword, setActivatePassword] = useState("");
  const [showActivatePassword, setShowActivatePassword] = useState(false);

  /* =========================================================
     WATER CONTAINER CALIBRATION
  ========================================================= */
  const ESP32_HOST = "http://192.168.4.1";

  const [waterSetupModalVisible, setWaterSetupModalVisible] = useState(false);
  const [existingCalibrationModalVisible, setExistingCalibrationModalVisible] = useState(false);
  const [existingCalibrationDistance, setExistingCalibrationDistance] = useState(null);

  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0); // 0=WiFi, 1=Empty, 2=Full, 3=Confirm
  const [calibrationMessage, setCalibrationMessage] = useState("");
  const [skipEmptyStep, setSkipEmptyStep] = useState(false);
  const [useExisting, setUseExisting] = useState(false);
  const [existingEmptyDistance, setExistingEmptyDistance] = useState(null);

  // Water fill animation
  const fillAnim = useRef(new Animated.Value(0)).current;
  const startFillingAnimation = () => {
    fillAnim.setValue(0);
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: 4000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const getSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  };

  // ================================
  // ESP32 helpers (gets REAL device_id)
  // ================================
  const getEspStatus = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`${ESP32_HOST}/status`, { signal: controller.signal });
      const data = await res.json();
      return data; // includes device_id/mac if your ESP32 code is correct
    } finally {
      clearTimeout(timeout);
    }
  };

  // Ensure water_device row exists WITHOUT forcing Active/Inactive
  const ensureWaterDeviceRow = async ({
    deviceId,
    deviceName = "Water Container Sensor",
    wifi_reset = false,
  }) => {
    try {
      const session = await getSession();
      if (!session) return false;

      const uid = session.user.id;

      // We do NOT set device_status here.
      // We do NOT set last_active here (your schema issue).
      const payload = {
        user_id: uid,
        device_id: deviceId,
        device_name: deviceName,
        wifi_reset: wifi_reset,
      };

      const { error } = await supabase.from("water_device").upsert(payload, { onConflict: "device_id" });
      if (error) {
        console.log("ensureWaterDeviceRow error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.log("ensureWaterDeviceRow exception:", err);
      return false;
    }
  };

  const checkCalibrationStatus = async () => {
    try {
      const session = await getSession();
      if (!session) throw new Error("User not authenticated");
      const uid = session.user.id;

      const { data, error } = await supabase
        .from("tank_data")
        .select("distance_empty")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") console.log(error);

      if (data && data.distance_empty != null) {
        setExistingCalibrationDistance(data.distance_empty);
        setExistingCalibrationModalVisible(true);
      } else {
        setUseExisting(false);
        setExistingEmptyDistance(null);
        setSkipEmptyStep(false);

        setCalibrationStep(0);
        setCalibrationMessage("Enter your WiFi name and password to connect to the device.");
        setWaterSetupModalVisible(true);
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Offline Mode", "You are offline. Calibration will proceed via ESP32 only.");
      setCalibrationStep(0);
      setCalibrationMessage("Enter your WiFi name and password to connect to the device.");
      setWaterSetupModalVisible(true);
    }
  };

  const saveWaterConfig = async () => {
    if (!wifiSSID || !wifiPass) {
      Alert.alert("Error", "Please fill all WiFi fields");
      return;
    }

    try {
      const session = await getSession();
      if (!session) {
        Alert.alert("Error", "User not authenticated. Please log in again.");
        return;
      }

      setIsCalibrating(true);

      const uid = session.user.id;
      const accessToken = session.access_token;

      // Send WiFi creds to ESP32
      const res = await fetch(`${ESP32_HOST}/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          ssid: wifiSSID,
          password: wifiPass,
          user_id: uid,
          access_token: accessToken,
          device_name: "Water Container Sensor",
        }).toString(),
      });

      const data = await res.json();

      if (data.status === "ok") {
        // IMPORTANT: do NOT force device_status Active here.
        // Instead: read real device_id from ESP32 and ensure row exists.
        try {
          const st = await getEspStatus();
          const realId = st?.device_id || st?.mac;
          if (realId) {
            await ensureWaterDeviceRow({ deviceId: realId, deviceName: "Water Container Sensor", wifi_reset: false });
          }
        } catch (e) {
          // If user isn't connected to AP properly, ignore
        }

        if (useExisting && existingEmptyDistance != null) {
          try {
            const emptyRes = await fetch(`${ESP32_HOST}/useExistingEmpty`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                distance_empty: String(existingEmptyDistance),
              }).toString(),
            });

            await emptyRes.json();

            setCalibrationStep(2);
            setCalibrationMessage("Existing empty tank value loaded. Fill your tank for full calibration.");
            setSkipEmptyStep(true);
          } catch (e) {
            Alert.alert("Error", "Failed to send existing tank value to ESP32.");
            setCalibrationStep(1);
            setCalibrationMessage("Please make sure your tank is empty before calibration.");
            setSkipEmptyStep(false);
          }
        } else {
          setCalibrationStep(1);
          setCalibrationMessage("Please make sure your tank is empty before calibration.");
          setSkipEmptyStep(false);
        }
      } else {
        Alert.alert("Error", "ESP32 did not confirm configuration.");
      }
    } catch (err) {
      console.log("Config error:", err);
      Alert.alert("Error", "Could not reach ESP32. Make sure you're connected to its hotspot.");
    } finally {
      setIsCalibrating(false);
    }
  };

  const handleCalibrate = async () => {
    try {
      if (calibrationStep === 1) {
        setIsCalibrating(true);

        const emptyRes = await fetch(`${ESP32_HOST}/calibrate`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ step: "1" }).toString(),
        });

        const emptyData = await emptyRes.json();

        if (emptyData.status === "empty calibrated") {
          setCalibrationStep(2);
          setCalibrationMessage("Empty calibration done! Fill your tank for full calibration.");
        } else {
          Alert.alert("Calibration Error", "ESP32 did not confirm empty calibration.");
        }

        setIsCalibrating(false);
      } else if (calibrationStep === 2) {
        setIsCalibrating(true);
        startFillingAnimation();

        const fullRes = await fetch(`${ESP32_HOST}/calibrate`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ step: "2" }).toString(),
        });

        const fullData = await fullRes.json();

        if (fullData.status === "full calibrated") {
          setTimeout(() => {
            setIsCalibrating(false);
            setCalibrationStep(3);
            setCalibrationMessage("Tank successfully calibrated! You may now reconnect your phone to the internet.");
          }, 4000);
        } else {
          setIsCalibrating(false);
          Alert.alert("Calibration Error", "ESP32 did not confirm full calibration.");
        }
      }
    } catch (error) {
      console.log("Calibration error:", error);
      setIsCalibrating(false);
      Alert.alert("Calibration Error", "Check your ESP32 connection and try again.");
    }
  };

  const handleConfirmCalibration = async () => {
    setWaterSetupModalVisible(false);

    try {
      const res = await fetch(`${ESP32_HOST}/confirmCalibration`, { method: "POST" });
      const data = await res.json();

      if (data.status === "calibration confirmed") {
        // DO NOT force Active here anymore.
        setInfoModal({ visible: true, message: "Water container calibrated successfully." });
        setTimeout(fetchDevices, 2500);
      } else {
        setInfoModal({ visible: true, message: "ESP32 did not confirm calibration." });
      }
    } catch (error) {
      // silent ok
    }
  };

  /* =========================================================
     DEVICE LIST / AUTH
  ========================================================= */
  const fetchDevices = async () => {
    if (!userId) return;
    try {
      const { data: plantDevices } = await supabase.from("plant_device").select("*").eq("user_id", userId);
      const { data: waterDevices } = await supabase.from("water_device").select("*").eq("user_id", userId);

      const mappedPlant = (plantDevices || []).map((d) => ({
        id: d.id,
        deviceId: d.device_id,
        name: d.device_name,
        crop: d.crop_name,
        type: "Plant",
        status: d.device_status,
        table: "plant_device",
        lastActive: d.last_active,
        wifi_reset: d.wifi_reset,
      }));

      const mappedWater = (waterDevices || []).map((d) => ({
        id: d.id,
        deviceId: d.device_id,
        name: d.device_name,
        crop: "Water Tank",
        type: "Water",
        status: d.device_status,
        table: "water_device",
        lastActive: d.last_active,
        wifi_reset: d.wifi_reset,
      }));

      const allDevices = [...mappedPlant, ...mappedWater].sort((a, b) =>
        String(a.status).toLowerCase() === "active" && String(b.status).toLowerCase() !== "active" ? -1 : 1
      );

      setDevices(allDevices);
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    const getSessionOnce = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) setUserId(data.session.user.id);
    };
    getSessionOnce();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) setUserId(session.user.id);
      else {
        setUserId(null);
        setDevices([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const normalizeStatus = (s) => (String(s || "").toLowerCase() === "active" ? "Active" : "Inactive");

    const channel = supabase
      .channel("device-status-channel")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "plant_device" }, (payload) => {
        const updated = payload.new;
        setDevices((prev) =>
          prev.map((device) =>
            device.deviceId === updated.device_id
              ? { ...device, status: normalizeStatus(updated.device_status), wifi_reset: updated.wifi_reset }
              : device
          )
        );
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "water_device" }, (payload) => {
        const updated = payload.new;
        setDevices((prev) =>
          prev.map((device) =>
            device.deviceId === updated.device_id
              ? { ...device, status: normalizeStatus(updated.device_status), wifi_reset: updated.wifi_reset }
              : device
          )
        );
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  const handleSelect = (id) => {
    setSelected(selected === id ? null : id);
    if (selected !== id) {
      const device = devices.find((d) => d.id === id);
      if (device) setRenameText(device.name);
    }
  };

  const handleRename = async () => {
    if (!activeDevice) return;
    try {
      const { error } = await supabase
        .from(activeDevice.table)
        .update({ device_name: renameText })
        .eq("device_id", activeDevice.deviceId);
      if (!error) {
        setDevices((prev) => prev.map((d) => (d.id === activeDevice.id ? { ...d, name: renameText } : d)));
        setInfoModal({ visible: true, message: "Device renamed successfully." });
      }
    } catch (err) {
      setInfoModal({ visible: true, message: "Failed to rename device." });
    }
  };

  const handleDisconnect = async () => {
    if (!activeDevice) return;
    try {
      const { error } = await supabase
        .from(activeDevice.table)
        .update({ device_status: "Inactive" })
        .eq("device_id", activeDevice.deviceId);
      if (!error) {
        setDevices((prev) => prev.map((d) => (d.id === activeDevice.id ? { ...d, status: "Inactive" } : d)));
        setSelected(null);
        setInfoModal({ visible: true, message: "Device disconnected successfully." });
      }
    } catch (err) {
      setInfoModal({ visible: true, message: "Failed to disconnect device." });
    }
  };

  const handleUnregister = async () => {
    if (!activeDevice) return;

    try {
      if (activeDevice.type === "Plant") {
        await supabase.from("plant_device").delete().eq("device_id", activeDevice.deviceId);
      }
      if (activeDevice.type === "Water") {
        await supabase.from("water_device").delete().eq("device_id", activeDevice.deviceId);
      }

      setDevices((prev) => prev.filter((d) => d.id !== activeDevice.id));
      setSelected(null);
      setInfoModal({ visible: true, message: "Device unregistered successfully." });
    } catch (err) {
      setInfoModal({ visible: true, message: "Failed to unregister device." });
    }
  };

  const configureESP32 = async () => {
    try {
      const sessionRes = await supabase.auth.getSession();
      const accessToken = sessionRes?.data?.session?.access_token || "";

      const response = await fetch("http://192.168.4.1/configure", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:
          `ssid=${encodeURIComponent(newWifiSSID)}` +
          `&password=${encodeURIComponent(newWifiPassword)}` +
          `&crop=${encodeURIComponent(newCrop)}` +
          `&user_id=${encodeURIComponent(userId || "")}` +
          `&access_token=${encodeURIComponent(accessToken)}` +
          `&device_name=${encodeURIComponent(newDeviceName)}`,
      });

      return response.ok;
    } catch (err) {
      return false;
    }
  };

  const handleAddDevice = async () => {
    if (!newDeviceName || !newCrop || !newWifiSSID) {
      setInfoModal({
        visible: true,
        message: "Please fill all required fields (WiFi password is optional for open networks).",
      });
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data?.session?.user) {
      setInfoModal({ visible: true, message: "You are not logged in." });
      return;
    }

    const success = await configureESP32();
    if (!success) {
      setInfoModal({ visible: true, message: "Could not reach ESP32. Connect to Oksi-Setup WiFi." });
      return;
    }

    setNewDeviceName("");
    setNewCrop("");
    setNewWifiSSID("");
    setNewWifiPassword("");
    setAddModal(false);

    setInfoModal({ visible: true, message: "Device configured successfully. Waiting for device to come online..." });
    setTimeout(fetchDevices, 3000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: stylesVars.bg }}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.header}>Devices</Text>
            <Text style={styles.subHeader}>Active connections</Text>
          </View>
        </View>

        <View style={styles.topButtonRow}>
          <TouchableOpacity style={[styles.pillButton, styles.addPill]} onPress={() => setAddModal(true)} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.pillButtonText}>Add Device</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.pillButton, styles.waterPill]} onPress={checkCalibrationStatus} activeOpacity={0.85}>
            <Ionicons name="water-outline" size={18} color="#fff" />
            <Text style={styles.pillButtonText}>Setup Tank</Text>
          </TouchableOpacity>
        </View>

        {devices.length === 0 ? (
          <Text style={styles.noDevices}>No devices found</Text>
        ) : (
          <View style={styles.grid}>
            {devices.map((device) => {
              const isSelected = device.id === selected;

              const deviceImage =
                device.type === "Plant"
                  ? require("../assets/deviceManagement/SoilApp.png")
                  : require("../assets/deviceManagement/waterApp.png");

              const isOnline = String(device.status).toLowerCase() === "active";

              return (
                <PulseCard key={device.id} status={device.status}>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => handleSelect(device.id)}
                    style={[styles.deviceCard, isSelected && styles.deviceCardSelected]}
                  >
                    <View style={styles.deviceImgWrap}>
                      <Image source={deviceImage} style={styles.deviceImg} resizeMode="contain" />
                    </View>

                    <Text style={styles.deviceTitle} numberOfLines={1} ellipsizeMode="tail">
                      {device.name}
                    </Text>
                    <Text style={styles.deviceSub} numberOfLines={1} ellipsizeMode="tail">
                      {device.crop}
                    </Text>

                    <View style={[styles.statusChip, isOnline ? styles.chipOn : styles.chipOff]}>
                      <Text style={styles.statusChipText}>{isOnline ? "Active" : "Inactive"}</Text>
                    </View>
                  </TouchableOpacity>
                </PulseCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ===================== DEVICE DETAILS MODAL ===================== */}
      {activeDevice && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
          <KeyboardAvoidingView style={styles.modalWrapper} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />

              <TouchableOpacity style={styles.modalCloseX} onPress={() => setSelected(null)} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color={stylesVars.text} />
              </TouchableOpacity>

              <Text style={styles.detailsTitle}>{activeDevice.name}</Text>

              <Text style={styles.inputLabel}>Rename Device</Text>
              <TextInput
                style={styles.textInput}
                value={renameText}
                onChangeText={setRenameText}
                placeholder="Enter new device name"
                placeholderTextColor="#9CA3AF"
                editable={String(activeDevice.status).toLowerCase() === "active"}
              />

              {activeDevice.type === "Plant" && (
                <>
                  <Info label="Crop" value={activeDevice.crop} />
                  <Info label="Type" value={activeDevice.type} />
                </>
              )}

              <Info label="Status" value={String(activeDevice.status).toLowerCase() === "active" ? "Active" : "Inactive"} />

              {String(activeDevice.status).toLowerCase() !== "active" && (
                <Info
                  label="Last Active"
                  value={
                    activeDevice.lastActive
                      ? new Date(activeDevice.lastActive).toLocaleString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"
                  }
                />
              )}

              {String(activeDevice.status).toLowerCase() === "active" && (
                <TouchableOpacity style={styles.renameBtn} onPress={handleRename} activeOpacity={0.9}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                  <Text style={styles.renameText}>Rename</Text>
                </TouchableOpacity>
              )}

              <View style={styles.buttonGrid}>
                {String(activeDevice.status).toLowerCase() === "active" && (
                  <>
                    {activeDevice.type === "Plant" && (
                      <TouchableOpacity
                        style={[styles.primaryBtn, styles.primaryGreen]}
                        onPress={() =>
                          navigation.navigate("MonitorDevice", {
                            deviceId: activeDevice.deviceId,
                            deviceName: activeDevice.name,
                            crop: activeDevice.crop,
                          })
                        }
                        activeOpacity={0.9}
                      >
                        <Ionicons name="analytics-outline" size={18} color="#fff" />
                        <Text style={styles.btnText}>Monitor Device</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={[styles.primaryBtn, styles.dangerRed]} onPress={handleDisconnect} activeOpacity={0.9}>
                      <Ionicons name="power-outline" size={18} color="#fff" />
                      <Text style={styles.btnText}>Disconnect Device</Text>
                    </TouchableOpacity>
                  </>
                )}

                {String(activeDevice.status).toLowerCase() !== "active" && (
                  <>
                    <TouchableOpacity
                      style={[styles.primaryBtn, styles.primaryGreen]}
                      activeOpacity={0.9}
                      onPress={async () => {
                        try {
                          const { error } = await supabase
                            .from(activeDevice.table)
                            .update({ device_status: "Active", last_active: new Date().toISOString() })
                            .eq("device_id", activeDevice.deviceId);
                          if (error) throw error;

                          setDevices((prev) => prev.map((d) => (d.id === activeDevice.id ? { ...d, status: "Active" } : d)));
                          setInfoModal({ visible: true, message: "Device reconnected successfully." });
                        } catch (err) {
                          setInfoModal({ visible: true, message: "Failed to reconnect device." });
                        }
                      }}
                    >
                      <Ionicons name="refresh" size={18} color="#fff" />
                      <Text style={styles.btnText}>Reconnect Device</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryBtn, styles.primaryTeal]}
                      onPress={() => {
                        setActivatingDevice(activeDevice);
                        setActivateModal(true);
                      }}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="wifi-outline" size={18} color="#fff" />
                      <Text style={styles.btnText}>Activate Device</Text>
                    </TouchableOpacity>

                    <View style={styles.bottomRow}>
                      <TouchableOpacity
                        style={[styles.secondaryBtn, styles.dangerRed]}
                        onPress={() => setConfirmModal({ visible: true })}
                        activeOpacity={0.9}
                      >
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <Text style={styles.btnText}>Unregister</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.secondaryBtn, styles.warnAmber]}
                        activeOpacity={0.9}
                        onPress={() => {
                          setInfoModal({ visible: true, message: "Resetting WiFi… This may take a moment." });
                          setSelected(null);

                          (async () => {
                            try {
                              await supabase
                                .from(activeDevice.table)
                                .update({ wifi_reset: true, device_status: "Inactive" })
                                .eq("device_id", activeDevice.deviceId);

                              const controller = new AbortController();
                              const timeout = setTimeout(() => controller.abort(), 2500);

                              try {
                                await fetch(`${ESP32_HOST}/reset_wifi`, { method: "POST", signal: controller.signal });
                              } catch (e) {
                                // ok
                              } finally {
                                clearTimeout(timeout);
                              }

                              setInfoModal({
                                visible: true,
                                message:
                                  "WiFi reset triggered.\n\nIf you are connected to the ESP hotspot, it resets immediately.\nOtherwise, it will reset once the device checks the server flag.",
                              });
                            } catch (err) {
                              setInfoModal({ visible: true, message: "Failed to trigger WiFi reset. Please try again." });
                            }
                          })();
                        }}
                      >
                        <Ionicons name="settings-outline" size={18} color="#fff" />
                        <Text style={styles.btnText}>Reset WiFi</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ===================== INFO MODAL ===================== */}
      <Modal
        visible={infoModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModal({ visible: false, message: "" })}
      >
        <View style={styles.infoModalWrapper}>
          <View style={styles.infoModalCard}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="information" size={20} color="#2563EB" />
            </View>
            <Text style={styles.infoModalText}>{infoModal.message}</Text>
            <TouchableOpacity
              style={styles.infoModalClose}
              onPress={() => setInfoModal({ visible: false, message: "" })}
              activeOpacity={0.9}
            >
              <Text style={styles.infoModalCloseText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===================== UNREGISTER CONFIRM ===================== */}
      {confirmModal.visible && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setConfirmModal({ visible: false })}>
          <View style={styles.infoModalWrapper}>
            <View style={styles.infoModalCard}>
              <View style={styles.dangerIconCircle}>
                <Ionicons name="warning" size={20} color="#DC2626" />
              </View>
              <Text style={styles.confirmText}>Are you sure you want to unregister "{activeDevice?.name}"?</Text>
              <View style={styles.confirmRow}>
                <TouchableOpacity
                  style={[styles.confirmBtn, styles.grayBtn]}
                  onPress={() => setConfirmModal({ visible: false })}
                  activeOpacity={0.9}
                >
                  <Text style={styles.infoModalCloseText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, styles.redBtn]}
                  activeOpacity={0.9}
                  onPress={() => {
                    setConfirmModal({ visible: false });
                    handleUnregister();
                  }}
                >
                  <Text style={styles.infoModalCloseText}>Unregister</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ===================== ADD DEVICE MODAL ===================== */}
      {addModal && (
        <Modal visible={addModal} transparent animationType="fade" onRequestClose={() => setAddModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalWrapper}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />

              <TouchableOpacity style={styles.modalCloseX} onPress={() => setAddModal(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color={stylesVars.text} />
              </TouchableOpacity>

              <Text style={styles.detailsTitle}>Add Plant Device</Text>

              <Text style={styles.inputLabel}>Device Name</Text>
              <TextInput
                style={styles.textInput}
                value={newDeviceName}
                onChangeText={setNewDeviceName}
                placeholder="My Garden Device"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Crop</Text>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={newCrop} onValueChange={(value) => setNewCrop(value)} style={styles.picker}>
                  <Picker.Item label="Select crop" value="" />
                  <Picker.Item label="Okra" value="Okra" />
                  <Picker.Item label="Siling Labuyo" value="Siling Labuyo" />
                  <Picker.Item label="Okra and Siling Labuyo" value="Okra and Siling Labuyo" />
                </Picker>
              </View>

              <Text style={styles.inputLabel}>WiFi Name</Text>
              <TextInput
                style={styles.textInput}
                value={newWifiSSID}
                onChangeText={setNewWifiSSID}
                placeholder="WiFi Network Name"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>WiFi Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={newWifiPassword}
                  onChangeText={setNewWifiPassword}
                  placeholder="Leave blank if open network"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNewWifiPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewWifiPassword((v) => !v)} activeOpacity={0.7}>
                  <Ionicons name={showNewWifiPassword ? "eye-off" : "eye"} size={20} color={stylesVars.muted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.primaryActionBtn, styles.primaryGreen]} onPress={handleAddDevice} activeOpacity={0.9}>
                <Text style={styles.primaryActionText}>Add Device</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.secondaryActionBtn, styles.grayBtn]} onPress={() => setAddModal(false)} activeOpacity={0.9}>
                <Text style={styles.primaryActionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ===================== ACTIVATE DEVICE MODAL ===================== */}
      {activateModal && activatingDevice && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setActivateModal(false)}>
          <KeyboardAvoidingView style={styles.modalWrapper} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />

              <TouchableOpacity
                style={styles.modalCloseX}
                onPress={() => {
                  setActivateModal(false);
                  setActivatingDevice(null);
                  setActivateSSID("");
                  setActivatePassword("");
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color={stylesVars.text} />
              </TouchableOpacity>

              <Text style={styles.detailsTitle}>Activate {activatingDevice.name}</Text>

              <Text style={styles.inputLabel}>WiFi SSID</Text>
              <TextInput
                style={styles.textInput}
                value={activateSSID}
                onChangeText={setActivateSSID}
                placeholder="WiFi Name"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>WiFi Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={activatePassword}
                  onChangeText={setActivatePassword}
                  placeholder="Leave blank if open network"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showActivatePassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowActivatePassword((v) => !v)} activeOpacity={0.7}>
                  <Ionicons name={showActivatePassword ? "eye-off" : "eye"} size={20} color={stylesVars.muted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.primaryTeal]}
                activeOpacity={0.9}
                onPress={async () => {
                  if (!activateSSID) {
                    setInfoModal({
                      visible: true,
                      message: "Please enter WiFi SSID. (Password is optional for open networks.)",
                    });
                    return;
                  }

                  try {
                    const sessionRes = await supabase.auth.getSession();
                    const accessToken = sessionRes?.data?.session?.access_token || "";

                    if (!accessToken) {
                      setInfoModal({ visible: true, message: "User not authenticated." });
                      return;
                    }

                    const response = await fetch("http://192.168.4.1/configure", {
                      method: "POST",
                      headers: { "Content-Type": "application/x-www-form-urlencoded" },
                      body:
                        `ssid=${encodeURIComponent(activateSSID)}` +
                        `&password=${encodeURIComponent(activatePassword)}` +
                        `&user_id=${encodeURIComponent(userId || "")}` +
                        `&access_token=${encodeURIComponent(accessToken)}` +
                        `&device_name=${encodeURIComponent(activatingDevice.name)}` +
                        `&crop=${encodeURIComponent(activatingDevice.crop || "")}`,
                    });

                    if (response.ok) {
                      // IMPORTANT: do NOT force "Active" here.
                      // For water devices, just ensure row exists using REAL ESP32 device_id (MAC).
                      if (activatingDevice.type === "Water") {
                        try {
                          const st = await getEspStatus();
                          const realId = st?.device_id || st?.mac;
                          if (realId) {
                            await ensureWaterDeviceRow({ deviceId: realId, deviceName: activatingDevice.name, wifi_reset: false });
                          }
                        } catch (e) {
                          // ignore
                        }
                      }

                      setInfoModal({
                        visible: true,
                        message:
                          "Device configured successfully! Switch back to your home WiFi.\n\nIf you want it Active, press Reconnect Device (that sets device_status=Active).",
                      });

                      setActivateModal(false);
                      setActivatingDevice(null);
                      setActivateSSID("");
                      setActivatePassword("");
                      setTimeout(fetchDevices, 3000);
                    } else {
                      const text = await response.text();
                      setInfoModal({ visible: true, message: `ESP32 rejected configuration request: ${text}` });
                    }
                  } catch (err) {
                    setInfoModal({
                      visible: true,
                      message: "Could not connect to ESP32 AP. Connect to 'Oksi Water Tank' WiFi and try again.",
                    });
                  }
                }}
              >
                <Text style={styles.primaryActionText}>Activate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryActionBtn, styles.grayBtn]}
                onPress={() => {
                  setActivateModal(false);
                  setActivatingDevice(null);
                  setActivateSSID("");
                  setActivatePassword("");
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryActionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ===================== EXISTING CALIBRATION MODAL ===================== */}
      <Modal
        visible={existingCalibrationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExistingCalibrationModalVisible(false)}
      >
        <View style={styles.modalWrapper}>
          <View style={styles.modalCard}>
            <Text style={styles.detailsTitle}>Existing Calibration Found</Text>

            <Text style={styles.modalSubtext}>We detected a previous empty-tank calibration value.</Text>

            <Text style={{ fontWeight: "900", marginBottom: 12 }}>
              Empty Distance: {existingCalibrationDistance} cm
            </Text>

            <View style={styles.twoBtnRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.primaryGreen]}
                onPress={() => {
                  setUseExisting(true);
                  setExistingEmptyDistance(existingCalibrationDistance);
                  setExistingCalibrationModalVisible(false);
                  setCalibrationStep(0);
                  setCalibrationMessage("Enter WiFi credentials to continue setup.");
                  setWaterSetupModalVisible(true);
                }}
              >
                <Text style={styles.modalActionText}>Use Existing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.warnAmber]}
                onPress={() => {
                  setUseExisting(false);
                  setExistingCalibrationModalVisible(false);
                  setCalibrationStep(0);
                  setCalibrationMessage("Enter WiFi credentials to continue setup.");
                  setWaterSetupModalVisible(true);
                }}
              >
                <Text style={styles.modalActionText}>Recalibrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================== WATER SETUP / CALIBRATION MODAL ===================== */}
      <Modal
        visible={waterSetupModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWaterSetupModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalWrapper}>
          <View style={styles.modalCard}>
            <Text style={styles.detailsTitle}>Water Tank Setup</Text>

            <Text style={styles.modalSubtext}>{calibrationMessage}</Text>

            {calibrationStep === 0 && (
              <>
                <Text style={styles.inputLabel}>WiFi SSID</Text>
                <TextInput style={styles.textInput} value={wifiSSID} onChangeText={setWifiSSID} placeholder="WiFi Name" />

                <Text style={styles.inputLabel}>WiFi Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={wifiPass}
                  onChangeText={setWifiPass}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                />

                <TouchableOpacity
                  style={[styles.primaryActionBtn, styles.primaryTeal]}
                  onPress={saveWaterConfig}
                  disabled={isCalibrating}
                >
                  {isCalibrating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryActionText}>Connect</Text>}
                </TouchableOpacity>
              </>
            )}

            {(calibrationStep === 1 || calibrationStep === 2) && (
              <>
                <View style={styles.tankContainer}>
                  <View style={styles.tank}>
                    <Animated.View style={[styles.waterFill, { height: fillHeight }]} />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, styles.primaryGreen]}
                  onPress={handleCalibrate}
                  disabled={isCalibrating}
                >
                  {isCalibrating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryActionText}>
                      {calibrationStep === 1 ? "Calibrate Empty" : "Calibrate Full"}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {calibrationStep === 3 && (
              <TouchableOpacity style={[styles.primaryActionBtn, styles.primaryGreen]} onPress={handleConfirmCalibration}>
                <Text style={styles.primaryActionText}>Finish Setup</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.secondaryActionBtn, styles.grayBtn]} onPress={() => setWaterSetupModalVisible(false)}>
              <Text style={styles.primaryActionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* =========================================================
   Info row
========================================================= */
const Info = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

/* =========================================================
   Modern theme tokens
========================================================= */
const stylesVars = {
  bg: "#F6FBF7",
  card: "#FFFFFF",
  text: "#0B1220",
  muted: "#6B7280",
  border: "rgba(15,23,42,0.10)",
  shadow: "rgba(15,23,42,0.10)",
  blue: "#2563EB",
  teal: "#0EA5E9",
  green: "#16A34A",
  red: "#DC2626",
  amber: "#B45309",
  grayBtn: "#6B7280",
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  header: { fontSize: 30, fontWeight: "900", color: stylesVars.text, letterSpacing: 0.2 },
  subHeader: { fontSize: 14, color: stylesVars.muted, marginTop: 4, marginBottom: 14, fontWeight: "600" },

  topButtonRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  pillButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    elevation: 4,
  },
  addPill: { backgroundColor: stylesVars.blue },
  waterPill: { backgroundColor: stylesVars.teal },
  pillButtonText: { color: "#fff", fontWeight: "900", fontSize: 13, textAlign: "center" },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },

  deviceCard: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: stylesVars.card,
    borderRadius: 22,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  deviceCardSelected: {
    borderColor: "rgba(37,99,235,0.55)",
    borderWidth: 2,
  },

  deviceImgWrap: {
    width: "100%",
    height: 72,
    borderRadius: 18,
    backgroundColor: "rgba(46,125,50,0.06)",
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  deviceImg: { width: 54, height: 54 },

  deviceTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: stylesVars.text,
  },
  deviceSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: stylesVars.muted,
  },

  statusChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipOn: { backgroundColor: stylesVars.green },
  chipOff: { backgroundColor: stylesVars.red },
  statusChipText: { fontSize: 11, fontWeight: "900", color: "#fff" },

  noDevices: { textAlign: "center", marginTop: 50, color: stylesVars.muted, fontWeight: "700" },

  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(2,6,23,0.55)",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    backgroundColor: stylesVars.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    elevation: 8,
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: "rgba(15,23,42,0.16)",
    marginBottom: 10,
  },
  modalCloseX: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(15,23,42,0.06)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  detailsTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: stylesVars.text,
    marginBottom: 10,
    paddingRight: 40,
  },

  inputLabel: { fontSize: 13, fontWeight: "900", color: "#374151", marginBottom: 6, marginTop: 10 },
  textInput: {
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.12)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    color: stylesVars.text,
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.12)",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  picker: { height: 52, width: "100%" },

  renameBtn: {
    backgroundColor: stylesVars.green,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 2,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  renameText: { color: "#fff", textAlign: "center", fontWeight: "900" },

  buttonGrid: { flexDirection: "column", rowGap: 10, marginTop: 12 },
  primaryBtn: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    flexDirection: "row",
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    flexDirection: "row",
    gap: 8,
  },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", columnGap: 12, marginTop: 6 },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "900" },

  primaryGreen: { backgroundColor: stylesVars.green },
  primaryTeal: { backgroundColor: stylesVars.teal },
  dangerRed: { backgroundColor: stylesVars.red },
  warnAmber: { backgroundColor: stylesVars.amber },

  primaryActionBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  secondaryActionBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  primaryActionText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  infoModalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(2,6,23,0.55)",
    padding: 18,
  },
  infoModalCard: {
    width: "88%",
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    elevation: 10,
  },
  infoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(37,99,235,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dangerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(220,38,38,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  infoModalText: { fontSize: 15, color: stylesVars.text, marginBottom: 14, textAlign: "center", fontWeight: "800" },
  infoModalClose: { backgroundColor: stylesVars.blue, paddingVertical: 12, borderRadius: 14, width: "100%" },
  infoModalCloseText: { color: "#fff", fontWeight: "900", textAlign: "center" },

  confirmText: { fontSize: 15, color: stylesVars.text, marginBottom: 16, textAlign: "center", fontWeight: "900" },
  confirmRow: { flexDirection: "row", gap: 10, width: "100%" },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 14 },

  grayBtn: { backgroundColor: stylesVars.grayBtn },
  redBtn: { backgroundColor: stylesVars.red },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.12)",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  passwordInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: stylesVars.text },
  eyeBtn: { paddingHorizontal: 10, paddingVertical: 8 },

  modalSubtext: {
    marginTop: 8,
    marginBottom: 12,
    textAlign: "center",
    color: "#374151",
    fontWeight: "700",
    lineHeight: 18,
  },

  twoBtnRow: { flexDirection: "row", gap: 10, marginTop: 8, width: "100%" },
  modalActionBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modalActionText: { color: "#fff", fontWeight: "900" },

  tankContainer: { alignItems: "center", justifyContent: "center", marginVertical: 12 },
  tank: {
    width: 110,
    height: 160,
    borderWidth: 2,
    borderColor: "rgba(14,165,233,0.70)",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(14,165,233,0.10)",
    justifyContent: "flex-end",
  },
  waterFill: { backgroundColor: "rgba(14,165,233,0.75)", width: "100%" },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,23,42,0.06)",
  },
  infoLabel: { fontSize: 13, color: stylesVars.muted, fontWeight: "800" },
  infoValue: { fontSize: 13, fontWeight: "900", color: stylesVars.text },
});