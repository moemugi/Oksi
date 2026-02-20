import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
  TextInput,
  Alert,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { SensorContext } from "../context/SensorContext";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";


const API_KEY = "bd96cb9d18e16f8796d773ef208270be";
const weatherIcons = {
  Clear: "sunny",
  Clouds: "cloudy",
  Rain: "rainy",
  Drizzle: "rainy",
  Thunderstorm: "thunderstorm",
  Snow: "snow",
  Mist: "cloudy",
};

export default function HomeScreen() {
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);


  const {
    plantStatus,
    lastUpdated,
    setPlantStatus,
    setLastUpdated,
  } = useContext(SensorContext);
  const [timeAgo, setTimeAgo] = useState("");
  const [loadedLastUpdated, setLoadedLastUpdated] = useState(false);


  // Modal & calibration states
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationConfirmed, setCalibrationConfirmed] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0); // 0=WiFi, 1=Empty, 2=Full, 3=Confirm
  const [calibrationMessage, setCalibrationMessage] = useState("");
  const [skipEmptyStep, setSkipEmptyStep] = useState(false);
  const [existingEmpty, setExistingEmpty] = useState(false);
  const [useExisting, setUseExisting] = useState(false); // user's choice in alert
  const [existingEmptyDistance, setExistingEmptyDistance] = useState(null);
  const [existingCalibrationModalVisible, setExistingCalibrationModalVisible] = useState(false);
  const [existingCalibrationDistance, setExistingCalibrationDistance] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Water analysis & history
const [waterDistance, setWaterDistance] = useState(null); // from ESP32
const [waterLevel, setWaterLevel] = useState(null); // %
const [waterHistory, setWaterHistory] = useState([]);
const [waterAnalysis, setWaterAnalysis] = useState(null);

const analyzeWaterContainer = (history) => {
  if (!history || history.length < 2) {
    return {
      usageRate: "-",
      timeToEmpty: "-",
      refillNeeded: false,
      insight: "Not enough data yet.",
    };
  }

  const first = history[0];
  const last = history[history.length - 1];

  const hoursPassed = (last.timestamp - first.timestamp) / (1000 * 60 * 60);

  if (hoursPassed <= 0) {
    return {
      usageRate: "-",
      timeToEmpty: "-",
      refillNeeded: false,
      insight: "Waiting for more readings.",
    };
  }

  const usageRate = (first.level - last.level) / hoursPassed;

  // Cap unrealistic spikes
  if (usageRate > 20) {
    return {
      usageRate: usageRate.toFixed(2),
      timeToEmpty: "-",
      refillNeeded: false,
      insight: "Usage spike detected. Monitoring...",
    };
  }

  if (usageRate <= 0.01) {
    return {
      usageRate: "0",
      timeToEmpty: "-",
      refillNeeded: false,
      insight: "Tank is stable or being refilled.",
    };
  }

  const hoursToEmpty = last.level / usageRate;

  // Immediate refill condition
  if (last.level <= 5 || hoursToEmpty <= 0) {
    return {
      usageRate: usageRate.toFixed(2),
      timeToEmpty: "0h 0m",
      refillNeeded: true,
      insight: "Immediate refill required!",
    };
  }

  // Convert hoursToEmpty to hours and minutes
// Convert hoursToEmpty to days/hours/minutes (show slash format)
const totalMinutes = Math.floor(hoursToEmpty * 60);

const totalHours = Math.floor(totalMinutes / 60);
const minutes = totalMinutes % 60;

const days = Math.floor(totalHours / 24);
const hours = totalHours % 24;

// If >= 24h show: "2647h / 110d 7h"
// else show: "5h 12m"
let timeToEmptyStr = "";
if (totalHours >= 24) {
  timeToEmptyStr = `${totalHours}h / ${days}d ${hours}h`;
} else {
  timeToEmptyStr = `${hours}h ${minutes}m`;
}


  // Insight messages
  let insightMessage = "";
  if (last.level >= 95) insightMessage = "Tank is full and ready.";
  else if (hoursToEmpty <= 1) insightMessage = "Immediate refill required!";
  else if (hoursToEmpty <= 3) insightMessage = "Refill soon.";
  else insightMessage = "Water level is sufficient.";

  return {
    usageRate: usageRate.toFixed(2),
    timeToEmpty: timeToEmptyStr,
    refillNeeded: hoursToEmpty <= 1,
    insight: insightMessage,
  };
};


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

  // WiFi info
  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const ESP32_HOST = "http://192.168.4.1";
  const getSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  };

  const markDeviceActive = async () => {
    try {
      const session = await getSession();
      if (!session) return;

      const userId = session.user.id;

      // You can replace this with ESP32 MAC later if needed
      const deviceId = "water-tank-esp32";

      const { error } = await supabase
        .from("water_device")
        .upsert(
          {
            user_id: userId,
            device_id: deviceId,
            device_status: "Active",
            last_active: new Date().toISOString(),
          },
          { onConflict: "device_id" }
        );

      if (error) {
        console.error("❌ Failed to update water device status:", error);
      } else {
        console.log("✅ Water device marked as Active");
      }
    } catch (err) {
      console.error("⚠️ markDeviceActive error:", err);
    }
  };

  // --- Weather fetch ---
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Permission to access location was denied");
          setLoading(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const [curRes, fcRes] = await Promise.all([
          axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`,
          ),
          axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`,
          ),
        ]);
        setCurrent(curRes.data);
        setForecast(fcRes.data.list.slice(0, 3));
        setCity(curRes.data.name);
      } catch (err) {
        console.error("Weather fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);
  useEffect(() => {
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data?.session?.user?.id ?? null);
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadPlantStatus = async () => {
      try {
        const savedStatus = await AsyncStorage.getItem(`plantStatus_${userId}`);
        const savedTime = await AsyncStorage.getItem(`plantStatusLastUpdated_${userId}`);

        if (savedStatus) setPlantStatus(JSON.parse(savedStatus));
        if (savedTime) setLastUpdated(new Date(savedTime));


      } catch (err) {
        console.warn("Failed to load plant status:", err);
      } finally {
        setLoadedLastUpdated(true);
      }
    };

    loadPlantStatus();
  }, [userId]);


  useEffect(() => {
    if (!userId) return;

    if (plantStatus?.status) {
      AsyncStorage.setItem(
        `plantStatus_${userId}`,
        JSON.stringify(plantStatus),
      );
    }

    if (lastUpdated) {
      AsyncStorage.setItem(
        `plantStatusLastUpdated_${userId}`,
        lastUpdated.toISOString(), // ✅ STRING
      );
    }
  }, [plantStatus, lastUpdated, userId]);



  useEffect(() => {
    if (!loadedLastUpdated) return; // wait until lastUpdated is loaded
    if (!lastUpdated) {
      setTimeAgo("Just now");
      return;
    }

    const updateAgo = () => {
      const diffMs = Date.now() - new Date(lastUpdated).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffSec < 60) setTimeAgo("Just now");
      else if (diffMin < 60)
        setTimeAgo(`${diffMin} min${diffMin > 1 ? "s" : ""} ago`);
      else if (diffHr < 24)
        setTimeAgo(`${diffHr} hr${diffHr > 1 ? "s" : ""} ago`);
      else setTimeAgo(`${diffDay} day${diffDay > 1 ? "s" : ""} ago`);
    };

    updateAgo();
    const interval = setInterval(updateAgo, 60000);
    return () => clearInterval(interval);
  }, [lastUpdated, loadedLastUpdated]);

useEffect(() => {
  if (!userId) return; // wait until userId is loaded

  const fetchTankData = async () => {
    try {
      const { data, error } = await supabase
        .from("tank_data")
        .select("tank_level, distance_full, distance_empty, created_at")
        .eq("user_id", userId) // fetch only current user
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Supabase tank_data fetch error:", error);
        return;
      }

      if (!data || data.length < 2) {
        setWaterAnalysis(null);
        return;
      }

      const history = data
        .map((item) => {
          if (
            item.tank_level == null ||
            item.distance_full == null ||
            item.distance_empty == null
          )
            return null;

          let levelPercentRaw =
            ((item.distance_empty - item.tank_level) /
              (item.distance_empty - item.distance_full)) *
            100;

          // Ensure 0-100%
          const levelPercent = Math.max(0, Math.min(100, levelPercentRaw));
          return {
            level: levelPercent,
            timestamp: new Date(item.created_at).getTime(),
          };
        })
        .filter(Boolean)
        .reverse();

      if (history.length < 2) {
        setWaterAnalysis(null);
        return;
      }

      const analysis = analyzeWaterContainer(history);

      setWaterHistory(history);
      setWaterAnalysis({
        currentLevel: history[history.length - 1].level.toFixed(1),
        usageRate: analysis.usageRate,
        timeToEmpty: analysis.timeToEmpty,
        refillNeeded: analysis.refillNeeded,
        insight: analysis.insight,
      });
    } catch (err) {
      console.error("Error fetching tank data:", err);
    }
  };

  fetchTankData();
  const interval = setInterval(fetchTankData, 5000);
  return () => clearInterval(interval);
}, [userId]);


  // --- Save WiFi + User Info to ESP32 ---
  const saveConfig = async () => {
    if (!wifiSSID || !wifiPass) {
      Alert.alert("Error", "Please fill all WiFi fields");
      return;
    }

    setLoading(true);
    try {
      const session = await getSession();
      if (!session) {
        Alert.alert("Error", "User not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const accessToken = session.access_token;
      const res = await fetch(`${ESP32_HOST}/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          ssid: wifiSSID,
          password: wifiPass,
          user_id: userId,
          access_token: accessToken,
        }).toString(),
      });

      const data = await res.json();
      console.log("ESP32 configure response:", data);

      if (data.status === "ok") {
        if (useExisting && existingEmptyDistance != null) {
          // Send existing empty distance to ESP32 now
          try {
            const emptyRes = await fetch(`${ESP32_HOST}/useExistingEmpty`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                distance_empty: existingEmptyDistance,
              }).toString(),
            });
            const emptyData = await emptyRes.json();
            console.log("Sent existing empty to ESP32:", emptyData);

            // Jump directly to full calibration step
            setCalibrationStep(2);
            setCalibrationMessage(
              "Existing empty tank value loaded. Fill your tank for full calibration.",
            );
          } catch (err) {
            console.error("Failed to send existing empty to ESP32:", err);
            Alert.alert(
              "Error",
              "Failed to send existing tank value to ESP32.",
            );
          }
        } else {
          // No existing → go to empty calibration step
          setCalibrationStep(1);
          setCalibrationMessage(
            "Please make sure your tank is empty before calibration.",
          );
        }
      } else {
        Alert.alert("Error", "ESP32 did not confirm configuration.");
      }
    } catch (err) {
      console.error("Config error:", err);
      Alert.alert(
        "Error",
        "Could not reach ESP32. Make sure you're connected to its hotspot.",
      );
    }

    setLoading(false);
  };

  const checkCalibrationStatus = async () => {
    try {
      const session = await getSession();
      if (!session) throw new Error("User not authenticated");
      const userId = session.user.id;

      const { data, error } = await supabase
        .from("tank_data")
        .select("distance_empty")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") console.warn(error);

      if (data && data.distance_empty != null) {
        // Store the distance for later
        setExistingCalibrationDistance(data.distance_empty);
        // Show modal instead of alert
        setExistingCalibrationModalVisible(true);
      } else {
        // No previous calibration → proceed normally
        setUseExisting(false);
        setExistingEmptyDistance(null);
        setSkipEmptyStep(false);
        setCalibrationStep(0);
        setCalibrationMessage(
          "Enter your WiFi name and password to connect to the device.",
        );
        setModalVisible(true);
      }
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Offline Mode",
        "You are offline. Calibration will proceed via ESP32 only.",
      );
      setCalibrationStep(0);
      setModalVisible(true);
    }
  };


  // --- Calibration handler ---
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
        console.log("🟢 Empty calibration response:", emptyData);

        if (emptyData.status === "empty calibrated") {
          setCalibrationStep(2);
          setCalibrationMessage(
            "Empty calibration done! Fill your tank for full calibration.",
          );
        } else {
          Alert.alert(
            "Calibration Error",
            "ESP32 did not confirm empty calibration.",
          );
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
        console.log("Full calibration response:", fullData);

        if (fullData.status === "full calibrated") {
          setTimeout(() => {
            setIsCalibrating(false);
            setCalibrationStep(3);
            setCalibrationMessage(
              "Tank successfully calibrated! You may now reconnect your phone to the internet.",
            );
          }, 4000);
        } else {
          setIsCalibrating(false);
          Alert.alert(
            "Calibration Error",
            "ESP32 did not confirm full calibration.",
          );
        }
      }
    } catch (error) {
      console.error("Calibration error:", error);
      setIsCalibrating(false);
      Alert.alert(
        "Calibration Error",
        "Check your ESP32 connection and try again.",
      );
    }
  };

  const handleConfirmCalibration = async () => {
    setModalVisible(false);
    setCalibrationConfirmed(true);
    try {
      const res = await fetch(`${ESP32_HOST}/confirmCalibration`, {
        method: "POST",
      });
      const data = await res.json();
      console.log("Confirm calibration response:", data);
      if (data.status === "calibration confirmed") {
        console.log(
          "Tank successfully calibrated. ESP32 is connecting to hotspot...",
        );
        await markDeviceActive();
      } else {
        console.warn("ESP32 did not confirm calibration.");
      }
    } catch (error) {
      console.warn("Could not reach ESP32 (silent):", error);
    }
  };

  const handleRecalibrate = async () => {
    try {
      const resetRes = await fetch(`${ESP32_HOST}/resetCalibration`, {
        method: "POST",
      });
      await resetRes.json();
      setCalibrationStep(1);
      setCalibrationConfirmed(false);
      setIsCalibrating(false);
      fillAnim.setValue(0);
      Alert.alert("Calibration Reset", "You can now recalibrate the tank.");
    } catch (error) {
      console.error("Recalibration error:", error);
      Alert.alert(
        "Error",
        "Failed to reset calibration. Check your ESP32 connection.",
      );
    }
  };

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weather</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#0288d1" />
        ) : (
          <>
            <Text style={{ textAlign: "center", color: "#555" }}>
              {city || "Unknown location"}
            </Text>
            <Text style={styles.temperature}>
              {current ? `${Math.round(current.main.temp)}°C` : "--°"}
            </Text>
            <Text style={styles.description}>
              {current && current.weather[0].main}
            </Text>
            <View style={styles.weatherCards}>
              {forecast.map((item, idx) => {
                const dt = new Date(item.dt * 1000);
                let hours = dt.getHours();
                const minutes = dt.getMinutes();
                const ampm = hours >= 12 ? "PM" : "AM";
                hours = hours % 12 || 12; // convert 0 → 12, 13 → 1, etc.
                const timeStr = `${hours}${minutes ? `:${minutes}` : ""} ${ampm}`;
                const main = item.weather[0].main;
                const iconName = weatherIcons[main] || "cloud-outline";

                return (
                  <View key={idx} style={styles.weatherCard}>
                    <Text style={styles.weatherTime}>{timeStr}</Text>
                    <Ionicons name={iconName} size={40} color="#333" />
                    <Text style={styles.weatherTemp}>
                      {Math.round(item.main.temp)}°C
                    </Text>
                    <Text style={styles.weatherDesc}>{main}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Water Container Calibration</Text>
        <TouchableOpacity
          style={styles.cardButton}
          onPress={async () => {
            try {
            } catch (err) {
              console.error("Failed to mark device active:", err);
            }
            checkCalibrationStatus();
          }}
        >
          <Ionicons name="water-outline" size={32} color="#0288d1" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.cardTitle}>Set up your water container</Text>
            <Text style={styles.cardSubtitle}>
              Tap to start configuration and calibration process
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#555" />
        </TouchableOpacity>
      </View> */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Water Container Analysis</Text>
        <TouchableOpacity
          style={styles.cardButton}
          onPress={() => setWaterModalVisible(true)}
        >

          <Ionicons name="hourglass-outline" size={32} color="#0288d1" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.cardTitle}>Predict water container status</Text>
            <Text style={styles.cardSubtitle}>
              Tap to estimate when your tank needs a refill
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#555" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crop Health Status</Text>
        <View style={styles.healthCard}>
          <Ionicons name="leaf-outline" size={32} color="#4caf50" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            {plantStatus?.status ? (
              <>
                <Text
                  style={[styles.cardTitle, { color: plantStatus.statusColor }]}
                >
                  {plantStatus.status}
                </Text>
                <Text style={styles.lastUpdated}>
                  Last updated {timeAgo || "Just now"}
                </Text>
              </>
            ) : (
              <Text style={styles.cardSubtitle}>
                Plant status will appear here after viewing sensor data from Crop Monitor.
              </Text>
            )}
          </View>
        </View>
      </View>


      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {calibrationStep === 0 && (
              <>
                <Text style={styles.modalText}>Calibrate Water Sensor</Text>


                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="WiFi Name"
                    value={wifiSSID}
                    onChangeText={setWifiSSID}
                    style={styles.input}
                  />

                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="WiFi Password"
                    value={wifiPass}
                    onChangeText={setWifiPass}
                    secureTextEntry={!showPassword}
                    style={styles.input}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: "#2e6b34",
                    width: "100%",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    marginTop: 10,
                  }}
                  onPress={saveConfig}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      Proceed
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {calibrationStep === 1 && !skipEmptyStep && (
              <>
                <Text style={styles.modalText}>
                  {calibrationMessage ||
                    "Please make sure your tank is empty before calibration."}
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#ccc" }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      {
                        backgroundColor: isCalibrating ? "#a5d6a7" : "#4caf50",
                      },
                    ]}
                    onPress={handleCalibrate}
                    disabled={isCalibrating}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {isCalibrating ? "Calibrating..." : "Calibrate Empty"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {calibrationStep === 2 && (
              <>
                <Text style={styles.modalText}>
                  {calibrationMessage ||
                    "Fill your tank completely and press Calibrate Full."}
                </Text>
                <View style={styles.tankContainer}>
                  <View style={styles.tank}>
                    <Animated.View
                      style={[styles.waterFill, { height: fillHeight }]}
                    />
                  </View>
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#ccc" }]}
                    onPress={() => setCalibrationStep(1)}
                  >
                    <Text>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      {
                        backgroundColor: isCalibrating ? "#a5d6a7" : "#4caf50",
                      },
                    ]}
                    onPress={handleCalibrate}
                    disabled={isCalibrating}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {isCalibrating ? "Calibrating..." : "Calibrate Full"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {calibrationStep === 3 && (
              <>
                <Text style={styles.modalText}>
                  {calibrationMessage ||
                    "Water Level Sensor successfully calibrated! Press Confirm to save."}
                </Text>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmCalibration}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                    Confirm
                  </Text>
                </TouchableOpacity>

              </>
            )}

          </View>
        </View>
      </Modal>

<Modal
  animationType="fade"
  transparent
  visible={waterModalVisible}
  onRequestClose={() => setWaterModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View
      style={{
        width: "85%",
        padding: 20,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        alignSelf: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 10,
          textAlign: "center",
        }}
      >
        Water Container Analysis
      </Text>

      {waterAnalysis ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 15,
          }}
        >
          <Ionicons
            name="water"
            size={22}
            color="#0288d1"
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              fontWeight: "900",
              fontSize: 16,
              color: "#d32f2f",
              textAlign: "center",
            }}
          >
            {waterAnalysis.insight || "Analyzing data..."}
          </Text>
        </View>
      ) : (
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <Text style={{ fontWeight: "700" }}>Collecting data...</Text>
          <ActivityIndicator size="small" color="#0288d1" />
        </View>
      )}

      <View
        style={{
          backgroundColor: "#e3f2fd",
          padding: 15,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#b3d9fc",
        }}
      >
        {waterAnalysis && (
          <>
            <Text>Current Water Level: {waterAnalysis.currentLevel} %</Text>
            <Text>Usage Rate: {waterAnalysis.usageRate} % per hour</Text>
            <Text>Time to Empty: {waterAnalysis.timeToEmpty}</Text>
            <Text>Refill Needed: {waterAnalysis.refillNeeded ? "Yes" : "No"}</Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: "#a8e6a8ff",
          alignSelf: "center",
          paddingHorizontal: 30,
          paddingVertical: 12,
          borderRadius: 8,
          marginTop: 15,
        }}
        onPress={() => setWaterModalVisible(false)}
      >
        <Text
          style={{
            color: "#080707ff",
            fontSize: 16,
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          Close
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


      <Modal
        animationType="fade"
        transparent
        visible={existingCalibrationModalVisible}
        onRequestClose={() => setExistingCalibrationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Existing Calibration Found</Text>
            <Text style={{ textAlign: "center", marginBottom: 20 }}>
              An empty tank measurement already exists. Do you want to use it or reset?
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#4caf50", flex: 1, marginRight: 5 }]}
                onPress={() => {
                  setUseExisting(true);
                  setExistingEmptyDistance(existingCalibrationDistance);
                  setSkipEmptyStep(true);
                  setCalibrationStep(0);
                  setCalibrationMessage(
                    "Enter WiFi name and password"
                  );
                  setExistingCalibrationModalVisible(false);
                  setModalVisible(true);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Use</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#f44336", flex: 1, marginLeft: 5 }]}
                onPress={() => {
                  setUseExisting(false);
                  setExistingEmptyDistance(null);
                  setSkipEmptyStep(false);
                  setCalibrationStep(0);
                  setCalibrationMessage(
                    "Enter WiFi name and password"
                  );
                  setExistingCalibrationModalVisible(false);
                  setModalVisible(true);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  section: { padding: 15 },
  sectionTitle: { fontSize: 21, fontWeight: "bold", marginBottom: 10 },
  temperature: { fontSize: 36, fontWeight: "bold", textAlign: "center" },
  description: {
    fontSize: 18,
    textAlign: "center",
    color: "#555",
    marginVertical: 5,
  },
  weatherCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  weatherCard: {
    flex: 1,
    backgroundColor: "#e0f7fa",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 2,
    minHeight: 160,
    justifyContent: "space-around",
  },
  weatherTime: { fontWeight: "bold", marginBottom: 5 },
  weatherTemp: { fontSize: 16, fontWeight: "bold", marginTop: 5 },
  weatherDesc: { fontSize: 12, color: "#555" },
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    marginBottom: -5,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardSubtitle: { fontSize: 12, color: "#555", marginTop: 3 },
  confirmButton: {
    backgroundColor: "#4caf50",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },

  healthCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f8e9",
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 15,
  },
  lastUpdated: { fontSize: 12, color: "gray", marginTop: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fdfdfdff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
    elevation: 5,
  },
  modalText: {
    textAlign: "center",
    fontSize: 15,
    marginBottom: 20,
    color: "#000000ff",
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  tankContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  tank: {
    width: 100,
    height: 150,
    borderWidth: 2,
    borderColor: "#0288d1",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#e0f7fa",
    justifyContent: "flex-end",
  },
  waterFill: { backgroundColor: "#4fc3f7", width: "100%" },
  input: {
    width: "100%",
    height: 45,
    borderColor: "#b4b4b4ff",
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  inputWrapper: {
    width: "100%",
    position: "relative",
    marginVertical: 8,
  },

  eyeIcon: {
    position: "absolute",
    right: 10,
    top: 11, // aligns with TextInput
    padding: 5,
  },


});
