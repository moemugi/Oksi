import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SensorContext } from "../context/SensorContext";
import CircularMoisture from "../components/CircularMoisture";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function CropMonitor() {
  const [deviceStatus, setDeviceStatus] = useState("Inactive"); // default
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const {
    sensorData,
    setSensorData: setGlobalSensorData,
    setPlantStatus,
    setLastUpdated,
    notifications,
    setNotifications,
    selectedSensors,
  } = useContext(SensorContext);
  const [lastRelayState, setLastRelayState] = useState(null);
  const prevPlantStatusRef = useRef(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertModalText, setAlertModalText] = useState("");
const [activeDevice, setActiveDevice] = useState(null); // Store the active device

const isConfigured = activeDevice && deviceStatus === "Active";

  // --- Send relay command via relay_commands table ---
  const triggerRelay = async (state = "ON") => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const { error } = await supabase
        .from("relay_commands")
        .insert([{ user_id: userId, relay_state: state }]);

      if (error) console.error("Relay command insert failed:", error);
      else console.log("✅ Relay command queued:", state);

      setLastRelayState(state);
      setGlobalSensorData((prev) => ({
        ...prev,
        pump: state,
      }));
    } catch (err) {
      console.error("Relay trigger error:", err);
    }
  };

  // --- Fetch weather data ---
  const fetchWeather = async () => {
    try {
      const apiKey = "bd96cb9d18e16f8796d773ef208270be";
      const lat = 14.676;
      const lon = 121.0437;
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Weather API error:", error);
      return null;
    }
  };

  // --- Fetch latest sensor + tank data ---
const fetchSensorData = async (auto = false) => {
  if (deviceStatus !== "Active") {
    console.log("Device is inactive — skipping sensor fetch");
    return;
  }

  if (!auto) setLoading(true);
  else setRefreshing(true);

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      if (!auto) Alert.alert("Not signed in", "Please sign in first.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const user = session.user;
    if (!user?.id) {
      if (!auto) Alert.alert("Auth Error", "Cannot get user info.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data: sensorRows, error: sensorError } = await supabase
      .from("sensor_data")
      .select(
        "temperature,humidity,soil,rain,crop,light,battery_percent,created_at"
      )
      .eq("plant_device_id", activeDevice.device_id)
      .order("id", { ascending: false })
      .limit(1);

    if (sensorError) {
      console.error(sensorError);
      if (!auto) Alert.alert("Error", "Could not fetch sensor data.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!sensorRows || sensorRows.length === 0) {
      setGlobalSensorData(null);
      if (!auto) Alert.alert("No Data", "No sensor data found.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data: tankRows, error: tankError } = await supabase
      .from("tank_data")
      .select("tank_level, relay_state")
      .eq("user_id", user.id)
      .order("id", { ascending: false })
      .limit(1);

    if (tankError) console.error("Tank fetch error:", tankError);

    const latestSensor = sensorRows[0];
    const latestTank = tankRows && tankRows.length > 0 ? tankRows[0] : {};
    const mergedData = {
      soil: latestSensor.soil ?? 0,
      temperature: latestSensor.temperature ?? 0,
      humidity: latestSensor.humidity ?? 0,
      rain: String(latestSensor.rain).toLowerCase().includes("rain")
        ? latestSensor.rain
        : "No Rain",
      crop: latestSensor.crop ?? "N/A",
      created_at: latestSensor.created_at ?? "N/A",
      light: latestSensor.light ?? 0,
      tank: latestTank.tank_level ?? 0,
      pump: latestTank.relay_state ?? "OFF",
      battery: latestSensor.battery_percent ?? 0,
      user_id: user.id,
    };

    await saveSensorDataToStorage(mergedData);
    setGlobalSensorData(mergedData);

    const newAlerts = await generateNotifications(mergedData);
    setNotifications((prev) => {
      const unique = newAlerts.filter(
        (alert) =>
          !prev.some(
            (n) => n.title === alert.title && n.message === alert.message
          )
      );
      return [...unique, ...prev];
    });

    // --- Weighted score calculation ---
    const soilNorm = Math.min((mergedData.soil / 30) * 0.6, 1);
    const tempNorm = Math.min((mergedData.temperature / 32) * 0.64, 1);
    const humidityNorm = Math.min((mergedData.humidity / 60) * 0.6, 1);
    const lightNorm = Math.min((mergedData.light / 20000) * 0.2, 1);
    const weightedScore =
      soilNorm * 0.6 + tempNorm * 0.15 + humidityNorm * 0.15 + lightNorm * 0.1;

    let status = "";
    let statusColor = "";
    let relayState = "";

    const weather = await fetchWeather();

    if (weightedScore < 0.5) {
      status = "⚠ Stressed / Critical";
      statusColor = "#d32f2f";
      relayState = "ON";
    } else if (weightedScore < 0.6) {
      status = "⚠ Moderate Stress";
      statusColor = "#f57c00";
      relayState = "ON";
    } else if (weightedScore < 0.8) {
      status = "✅ Optimal / Healthy";
      statusColor = "#388e3c";
      relayState = "OFF";
    } else {
      status = "🌿 Very Healthy / Ideal";
      statusColor = "#2e7d32";
      relayState = "OFF";
    }

    // --- Rain/weather override ---
    const rainSensorWet =
      typeof mergedData.rain === "string" &&
      mergedData.rain.toLowerCase().includes("rain") &&
      !mergedData.rain.toLowerCase().includes("no rain");
    const isCurrentlyRaining =
      weather?.weather?.[0]?.main?.includes("Rain") || weather?.rain;

    if (rainSensorWet) {
      console.log("🌧 Actual rain detected — irrigation off.");
      relayState = "OFF";
    } else if (isCurrentlyRaining) {
      console.log(
        "🌦 Weather API reports rain — delaying irrigation for 30 minutes."
      );
      relayState = "OFF";
      setTimeout(() => {
        console.log("🔁 Rechecking soil after rain delay...");
        fetchSensorData(true);
      }, 30 * 60 * 1000);
    } else {
      console.log("☀️ No rain detected — proceeding based on soil moisture.");
    }

    // --- Trigger the relay/pump ---
    await triggerRelay(relayState);

    // --- Update plant status UI ---
    if (!prevPlantStatusRef.current || prevPlantStatusRef.current.status !== status) {
      setPlantStatus({ status, statusColor });
      setLastUpdated(new Date());
      prevPlantStatusRef.current = { status, statusColor };
    }
  } catch (err) {
    console.error("Fetch error:", err);
    if (!auto) Alert.alert("Error", "Could not fetch data.");
  }

  setLoading(false);
  setRefreshing(false);
};

  const generateNotifications = async (data) => {
    if (!selectedSensors) return [];
    const alerts = [];
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (selectedSensors.soilMoisture && data.soil < 20) {
      alerts.push({
        id: `soil-${Date.now()}`,
        type: "soilMoisture",
        title: "Soil Moisture Alert",
        time: now,
        message: `Soil moisture is low: ${data.soil}%`,
        sent: false,
      });
      await triggerRelay("ON");
    } else if (data.soil >= 25) {
      await triggerRelay("OFF");
    }

    if (selectedSensors.waterLevel && data.tank < 30) {
      alerts.push({
        id: `tank-${Date.now()}`,
        type: "waterLevel",
        title: "Water Tank Alert",
        time: now,
        message: `Water tank low: ${data.tank}% remaining`,
        sent: false,
      });
      await triggerRelay("OFF");
    }

    if (selectedSensors.rainDetection && data.rain === "Rain") {
      alerts.push({
        id: `rain-${Date.now()}`,
        type: "rainDetection",
        title: "Weather Report",
        time: now,
        message: "Rainfall detected, irrigation paused.",
        sent: false,
      });
      await triggerRelay("OFF");
    }

    if (selectedSensors.temperature && data.temperature > 35) {
      alerts.push({
        id: `temp-${Date.now()}`,
        type: "temperature",
        title: "Temperature Alert",
        time: now,
        message: `High temperature detected: ${data.temperature}°C`,
        sent: false,
      });
    }

    if (selectedSensors.humidity && data.humidity < 40) {
      alerts.push({
        id: `humidity-${Date.now()}`,
        type: "humidity",
        title: "Humidity Alert",
        time: now,
        message: `Low humidity detected: ${data.humidity}%`,
        sent: false,
      });
    }

    if (selectedSensors.pumpStatus && data.pump === "OFF") {
      alerts.push({
        id: `pump-${Date.now()}`,
        type: "pumpStatus",
        title: "Pump Alert",
        time: now,
        message: "Pump is currently turned off.",
        sent: false,
      });
    }

    if (selectedSensors.battery && data.battery < 30) {
      alerts.push({
        id: `battery-${Date.now()}`,
        type: "battery",
        title: "Battery Alert",
        time: now,
        message: `Low battery level: ${data.battery}%`,
        sent: false,
      });
    }

    return alerts;
  };

  useEffect(() => {
    let intervalId;
    if (sensorData) {
      intervalId = setInterval(() => fetchSensorData(true), 10000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sensorData]);

  useEffect(() => {
  const intervalId = setInterval(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId || !activeDevice) return; // <-- important

      const { data: deviceData, error } = await supabase
        .from("plant_device")
        .select("device_status")
        .eq("device_id", activeDevice.device_id) // filter by active device
        .maybeSingle();

      if (error) return console.error("Device status fetch error:", error);

      if (deviceData?.device_status) setDeviceStatus(deviceData.device_status);

      if (deviceData?.device_status === "Inactive") {
        setGlobalSensorData(null);
        await AsyncStorage.removeItem("sensorData");
        console.log("Device inactive — local data cleared ✅");
      }
    } catch (err) {
      console.error("Device status check error:", err);
    }
  }, 3000);

  return () => clearInterval(intervalId);
}, [activeDevice]);


useEffect(() => {
  const checkActiveDevice = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      // Get the latest active device
      const { data: plantDevice } = await supabase
        .from("plant_device")
        .select("*")
        .eq("user_id", userId)
        .eq("device_status", "Active")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!plantDevice) {
        setDeviceStatus("Inactive");
        setActiveDevice(null);
        setGlobalSensorData(null);
        console.log("No active device found ✅");
        return;
      }

      setDeviceStatus("Active");
      setActiveDevice(plantDevice);

      // Fetch sensor data for this device
      const { data: sensorRows } = await supabase
        .from("sensor_data")
        .select("*")
        .eq("plant_device_id", plantDevice.device_id) // filter by device_id
        .order("id", { ascending: false })
        .limit(1);

      if (sensorRows && sensorRows.length > 0) {
      } else {
      }
    } catch (err) {
      console.error("Device fetch error:", err);
    }
  };

  checkActiveDevice();
}, []);


  const saveSensorDataToStorage = async (data) => {
    try {
      await AsyncStorage.setItem("sensorData", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save sensor data:", err);
    }
  };

  const disconnectDevice = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        Alert.alert("Auth Error", "User not found.");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("plant_device")
        .update({ device_status: "Inactive" })
        .eq("user_id", userId);

      if (error) {
        console.error("Plant device update error:", error);
        Alert.alert("Error", "Failed to disconnect device.");
        setLoading(false);
        return;
      }

      setGlobalSensorData(null);
      await AsyncStorage.removeItem("sensorData");

      Alert.alert("Success", "Sensor successfully disconnected.");
    } catch (err) {
      console.error("Disconnect error:", err);
      Alert.alert("Error", "Could not disconnect sensor.");
    }
    setLoading(false);
  };


  // --- UI ---
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {(!sensorData || deviceStatus !== "Active") && !loading && (
        <View style={{ alignItems: "center", width: "100%" }}>
          <Image
            source={require("../assets/sensor_icon.png")}
            style={styles.logo}
          />
<TouchableOpacity
  style={[styles.button, isConfigured ? { backgroundColor: "#2e6b34" } : { backgroundColor: "#999" }]}
  onPress={() => {
    if (!isConfigured) {
      setAlertModalText("Device is inactive. Please activate it in Device Management.");
      setAlertModalVisible(true);
      return;
    }
    fetchSensorData();
  }}
>
  <Text style={styles.buttonText}>View Sensor Data</Text>
</TouchableOpacity>

        </View>
      )}

      <Modal
  transparent
  animationType="fade"
  visible={alertModalVisible}
  onRequestClose={() => setAlertModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContainer, { width: "70%" }]}>
      <Text style={{ fontSize: 16, textAlign: "center", marginBottom: 15 }}>
        {alertModalText}
      </Text>
      <TouchableOpacity
        style={[styles.saveButton, { width: "100%" }]}
        onPress={() => setAlertModalVisible(false)}
      >
        <Text style={styles.saveButtonText}>OK</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      {loading && (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <ActivityIndicator size="large" color="#2e6b34" />
          <Text style={{ marginTop: 10 }}>Please wait...</Text>
        </View>
      )}

      {sensorData && deviceStatus === "Active" && !loading && (
        <>
          <View style={styles.circleContainer}>
            <CircularMoisture value={sensorData?.soil || 0} />
            <Text style={styles.circleLabel}>Moisture Level</Text>
          </View>
          <Text style={styles.batteryLabel}>Battery Level</Text>
          <View style={styles.batteryCard}>
            <Text style={styles.batteryValue}>{sensorData.battery}%</Text>
          </View>
          <Text style={styles.sectionTitle}>Crop’s Environment</Text>
          <View style={styles.grid}>
            <View style={styles.squareCard}>
              <Text style={styles.cardLabel}>🌡 Temperature</Text>
              <Text style={styles.cardValue}>{sensorData.temperature}°C</Text>
            </View>
            <View style={styles.squareCard}>
              <Text style={styles.cardLabel}>💧 Humidity</Text>
              <Text style={styles.cardValue}>{sensorData.humidity}%</Text>
            </View>
            <View style={styles.squareCard}>
              <Text style={styles.cardLabel}>☀ Light Intensity</Text>
              <Text style={styles.cardValue}>
                {Math.min((sensorData.light / 20000) * 100, 100).toFixed(2)}%
              </Text>
            </View>
            <View style={styles.squareCard}>
              <Text style={styles.cardLabel}>🌧 Rain Sensor</Text>
              <Text style={styles.cardValue}>{sensorData.rain}</Text>
            </View>
            <View style={styles.squareCard}>
              <Text style={styles.cardLabel}>💦 Water Tank</Text>
              <Text style={styles.cardValue}>
                {sensorData.tank !== undefined ? sensorData.tank.toFixed(1) : 0}%
              </Text>
            </View>
            <View style={styles.squareCard}>
              <Text style={styles.cardLabel}>🚰 Pump Status</Text>
              <Text style={styles.cardValue}>{sensorData.pump ?? "OFF"}</Text>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#b71c1c" }]}
              onPress={disconnectDevice}
            >
              <Text style={styles.buttonText}>Disconnect Device</Text>
            </TouchableOpacity>
          </View>
          
        </>
      )}
    </ScrollView>
    
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  button: {
    backgroundColor: "#2e6b34",
    paddingVertical: 16, // bigger
    borderRadius: 25,
    width: "70%", // slightly wider
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" }, // bigger text
  logo: { width: 140, height: 140, resizeMode: "contain", marginBottom: 20 }, // bigger logo
  circleContainer: { alignItems: "center", marginVertical: 25 },
  circleLabel: {
    fontSize: 18, // bigger
    fontWeight: "bold",
    color: "#333",
    marginVertical: -15,
  },
  sectionTitle: {
    fontSize: 26, // bigger
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  squareCard: {
    width: "45%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    margin: 6,
    borderRadius: 18, // slightly bigger radius
    alignItems: "center",
    justifyContent: "center",
    padding: 15, // more padding
    elevation: 4,
  },
  batteryCard: {
    width: "40%", // bigger
    backgroundColor: "#37da5fff",
    margin: 6,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  batteryLabel: { fontSize: 21, color: "#555", textAlign: "center" }, // bigger
  batteryValue: {
    fontSize: 28, // bigger
    fontWeight: "bold",
    marginTop: 5,
    color: "#000",
  },
  cardLabel: { fontSize: 17, color: "#555", textAlign: "center" }, // bigger
  cardValue: { fontSize: 30, fontWeight: "bold", marginTop: 8, color: "#000" }, // bigger
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    width: "80%", 
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 18 }, // bigger
  input: {
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16, // bigger
  },
  pickerWrapper: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 18,
    paddingVertical: 2,
  },
  saveButton: {
    backgroundColor: "#2e6b34",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" }, // bigger
  cancelButton: {
    backgroundColor: "#b71c1c",
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  cancelButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" }, // bigger
  helpLink: {
    color: "#2e6b34",
    textAlign: "center",
    textDecorationLine: "underline",
    marginTop: 12,
    fontSize: 15, // bigger
  },
  guideBox: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  guideText: { fontSize: 15, marginBottom: 6, color: "#333" }, // bigger
});
