import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { SensorContext } from "../context/SensorContext";
import CircularMoisture from "../components/CircularMoisture";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MonitorDevice() {
  const route = useRoute();
  const { deviceId, deviceName, crop } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRelayState, setLastRelayState] = useState(null);

  const {
    sensorData,
    setSensorData: setGlobalSensorData,
    setPlantStatus,
    setLastUpdated,
    notifications,
    setNotifications,
    selectedSensors,
  } = useContext(SensorContext);

  const prevPlantStatusRef = useRef(null);

  /* ---------------- RELAY COMMAND ---------------- */
  const triggerRelay = async (state = "ON") => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) return;

      await supabase.from("relay_commands").insert([
        {
          user_id: session.user.id,
          relay_state: state,
        },
      ]);

      setLastRelayState(state);
      setGlobalSensorData((prev) => ({
        ...prev,
        pump: state,
      }));
    } catch (err) {
      console.error("Relay trigger error:", err);
    }
  };

  /* ---------------- WEATHER ---------------- */
  const fetchWeather = async () => {
    try {
      const apiKey = "bd96cb9d18e16f8796d773ef208270be";
      const lat = 14.676;
      const lon = 121.0437;

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      return await res.json();
    } catch {
      return null;
    }
  };

  /* ---------------- SENSOR FETCH ---------------- */
  const fetchSensorData = async (auto = false) => {
    if (!auto) setLoading(true);
    else setRefreshing(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) return;

      const { data: sensorRows } = await supabase
        .from("sensor_data")
        .select(
          "temperature,humidity,soil,rain,crop,light,battery_percent,created_at"
        )
        .eq("plant_device_id", deviceId)
        .order("id", { ascending: false })
        .limit(1);

      if (!sensorRows || sensorRows.length === 0) {
        setGlobalSensorData(null);
        return;
      }

      const { data: tankRows } = await supabase
        .from("tank_data")
        .select("tank_level, relay_state")
        .eq("user_id", session.user.id)
        .order("id", { ascending: false })
        .limit(1);

      const sensor = sensorRows[0];
      const tank = tankRows?.[0] || {};

      const mergedData = {
        soil: sensor.soil ?? 0,
        temperature: sensor.temperature ?? 0,
        humidity: sensor.humidity ?? 0,
        rain:
          String(sensor.rain).toLowerCase().includes("rain") &&
          !String(sensor.rain).toLowerCase().includes("no")
            ? "Rain"
            : "No Rain",
        crop: sensor.crop ?? crop,
        created_at: sensor.created_at,
        light: sensor.light ?? 0,
        tank: tank.tank_level ?? 0,
        pump: tank.relay_state ?? "OFF",
        battery: sensor.battery_percent ?? 0,
        user_id: session.user.id,
      };

      await AsyncStorage.setItem("sensorData", JSON.stringify(mergedData));
      setGlobalSensorData(mergedData);

      const newAlerts = await generateNotifications(mergedData);
      setNotifications((prev) => {
        const unique = newAlerts.filter(
          (a) =>
            !prev.some(
              (n) => n.title === a.title && n.message === a.message
            )
        );
        return [...unique, ...prev];
      });

      /* --------- WEIGHTED STATUS --------- */
      const soilNorm = Math.min((mergedData.soil / 30) * 0.6, 1);
      const tempNorm = Math.min((mergedData.temperature / 32) * 0.64, 1);
      const humidityNorm = Math.min((mergedData.humidity / 60) * 0.6, 1);
      const lightNorm = Math.min((mergedData.light / 20000) * 0.2, 1);

      const weightedScore =
        soilNorm * 0.6 +
        tempNorm * 0.15 +
        humidityNorm * 0.15 +
        lightNorm * 0.1;

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
      } else {
        status = "✅ Healthy";
        statusColor = "#2e7d32";
        relayState = "OFF";
      }

      const raining =
        weather?.weather?.[0]?.main?.includes("Rain") ||
        mergedData.rain === "Rain";

      if (raining) relayState = "OFF";

      await triggerRelay(relayState);

      if (
        !prevPlantStatusRef.current ||
        prevPlantStatusRef.current.status !== status
      ) {
        setPlantStatus({ status, statusColor });
        setLastUpdated(new Date());
        prevPlantStatusRef.current = { status, statusColor };
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }

    setLoading(false);
    setRefreshing(false);
  };

  /* ---------------- NOTIFICATIONS (UNCHANGED) ---------------- */
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

  /* ---------------- AUTO START ---------------- */
  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(() => fetchSensorData(true), 10000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading && (
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <ActivityIndicator size="large" color="#2e6b34" />
          <Text style={{ marginTop: 10 }}>Loading device data…</Text>
        </View>
      )}

      {sensorData && !loading && (
        <>
          <View style={styles.circleContainer}>
            <CircularMoisture value={sensorData.soil} />
            <Text style={styles.circleLabel}>Moisture Level</Text>
          </View>

          <Text style={styles.batteryLabel}>Battery Level</Text>
          <View style={styles.batteryCard}>
            <Text style={styles.batteryValue}>{sensorData.battery}%</Text>
          </View>

          <Text style={styles.sectionTitle}>Crop’s Environment</Text>

          <View style={styles.grid}>
            <Info label="🌡 Temperature" value={`${sensorData.temperature}°C`} />
            <Info label="💧 Humidity" value={`${sensorData.humidity}%`} />
            <Info
              label="☀ Light"
              value={`${Math.min(
                (sensorData.light / 20000) * 100,
                100
              ).toFixed(1)}%`}
            />
            <Info label="🌧 Rain" value={sensorData.rain} />
            <Info label="💦 Tank" value={`${sensorData.tank}%`} />
            <Info label="🚰 Pump" value={sensorData.pump} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

/* ---------------- SMALL COMPONENT ---------------- */
const Info = ({ label, value }) => (
  <View style={styles.squareCard}>
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  circleContainer: { alignItems: "center", marginVertical: 25 },
  circleLabel: { fontSize: 18, fontWeight: "bold", marginTop: -15 },
  sectionTitle: { fontSize: 26, fontWeight: "bold", marginVertical: 15 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  squareCard: {
    width: "45%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    margin: 6,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  batteryLabel: { fontSize: 21 },
  batteryCard: {
    width: "40%",
    backgroundColor: "#37da5f",
    borderRadius: 18,
    alignItems: "center",
    padding: 10,
  },
  batteryValue: { fontSize: 28, fontWeight: "bold" },
  cardLabel: { fontSize: 16 },
  cardValue: { fontSize: 28, fontWeight: "bold", marginTop: 8 },
});
