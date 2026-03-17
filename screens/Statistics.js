import React, { useState, useEffect, useRef, useMemo } from "react";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  StatusBar,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import useLanguage from "../hooks/useLanguage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const stylesTokens = {
  border: "rgba(15,23,42,0.10)",
};
const screenWidth = Dimensions.get("window").width - 40;

/* ---------------------------
   Walkthrough Overlay (UI-only)
---------------------------- */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const WalkthroughOverlay = ({
  visible,
  step,
  total,
  highlight,
  title,
  body,
  onNext,
  onPrev,
  onClose,
}) => {
  if (!visible || !highlight) return null;

  const { x, y, width, height } = highlight;
  const SCREEN_W = Dimensions.get("window").width;
  const SCREEN_H = Dimensions.get("window").height;

  const tooltipW = Math.min(320, SCREEN_W - 30);
  const tooltipX = clamp(
    x + width / 2 - tooltipW / 2,
    15,
    SCREEN_W - tooltipW - 15,
  );

  const preferBelow = y + height + 14 + 160 < SCREEN_H;
  const tooltipY = preferBelow ? y + height + 14 : Math.max(15, y - 14 - 160);

  const arrowSize = 10;
  const arrowStyle = preferBelow
    ? {
        position: "absolute",
        left: x + width / 2 - arrowSize,
        top: y + height + 4,
        width: 0,
        height: 0,
        borderLeftWidth: arrowSize,
        borderRightWidth: arrowSize,
        borderBottomWidth: arrowSize,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: "#FFFFFF",
      }
    : {
        position: "absolute",
        left: x + width / 2 - arrowSize,
        top: Math.max(0, y - 4 - arrowSize),
        width: 0,
        height: 0,
        borderLeftWidth: arrowSize,
        borderRightWidth: arrowSize,
        borderTopWidth: arrowSize,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: "#FFFFFF",
      };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <StatusBar translucent backgroundColor="rgba(0,0,0,0.35)" barStyle="light-content" />
      <View style={styles.wtBackdrop}>
        <View
          pointerEvents="none"
          style={[
            styles.wtHighlightBox,
            { left: x - 6, top: y - 6, width: width + 12, height: height + 12 },
          ]}
        />
        <View pointerEvents="none" style={arrowStyle} />

        <View style={[styles.wtTooltip, { width: tooltipW, left: tooltipX, top: tooltipY }]}>
          <View style={styles.wtTooltipTopRow}>
            <Text style={styles.wtStepText}>
              Step {step + 1} of {total}
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.wtCloseBtn}>
              <Ionicons name="close" size={18} color="#0B1220" />
            </TouchableOpacity>
          </View>

          <Text style={styles.wtTitle}>{title}</Text>
          <Text style={styles.wtBody}>{body}</Text>

          <View style={styles.wtBtnRow}>
            <TouchableOpacity
              onPress={onPrev}
              activeOpacity={0.9}
              disabled={step === 0}
              style={[styles.wtBtn, styles.wtBtnGray, step === 0 && { opacity: 0.5 }]}
            >
              <Text style={styles.wtBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onNext} activeOpacity={0.9} style={[styles.wtBtn, styles.wtBtnBlue]}>
              <Text style={styles.wtBtnText}>{step === total - 1 ? "Done" : "Next"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export async function generateReport(userId, deviceId) {
  // Fetch profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

  // Fetch device info
  const { data: device } = await supabase.from("devices").select("*").eq("id", deviceId).single();

  // Fetch last 24h sensor data
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: logs, error } = await supabase
    .from("sensor_data")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching logs:", error.message);
    return { profile, device, stats: {}, rows: "" };
  }

  const safeLogs = logs || [];

  const avgTemp = safeLogs.length
    ? (safeLogs.reduce((sum, l) => sum + (l.temperature || 0), 0) / safeLogs.length).toFixed(1)
    : "N/A";

  const avgSoil = safeLogs.length ? Math.max(...safeLogs.map((l) => l.soil || 0)) : "N/A";

  const maxLight = safeLogs.length ? Math.max(...safeLogs.map((l) => l.light || 0)) : "N/A";

  const rows = safeLogs
    .map(
      (l) => `
      <tr>
        <td>${new Date(l.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}</td>
        <td>${l.soil}%</td>
        <td>${l.soil < 50 ? "✔" : "No"}</td>
      </tr>`,
    )
    .join("");

  return {
    profile,
    device,
    stats: { avgTemp, avgSoil, maxLight },
    rows,
  };
}

/* =========================================================
   ✅ FIX: Dropdown layout (no double-48% width nesting)
   - Dropdown block uses flex: 1 so parent row controls width
   - Selected text stays on ONE line, no ugly truncation
========================================================= */
function Dropdown({ label, options, value, onChange, fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <View style={[styles.pickerBlock, fullWidth && styles.fullPickerBlock]}>
      <Text style={styles.filterLabel}>{label}</Text>
      <TouchableOpacity activeOpacity={0.8} style={styles.pickerWrapper} onPress={() => setOpen(true)}>
        <Text style={styles.selectedText} numberOfLines={1}>
          {selected?.label}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#333" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <SafeAreaView style={styles.modalContainer}>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === value && <Ionicons name="checkmark" size={18} color="#4CAF50" />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              contentContainerStyle={{ paddingBottom: 12 }}
            />
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
}

// Downsample helper
function downsampleData(data, maxPoints = 20) {
  if (data.length <= maxPoints) return data;
  const step = Math.floor(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

// Generate all dates in the range
function generateDateRange(timeRange) {
  const dates = [];
  const today = new Date();
  let days = 0;

  if (timeRange === "7d") days = 7;
  else if (timeRange === "3d") days = 3;
  else if (timeRange === "30d") days = 30;
  else return [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dates.push(d);
  }

  return dates;
}

// Fill missing days with null soil value
function fillMissingDays(dates, data) {
  return dates.map((d) => {
    const label = d.toLocaleDateString([], { month: "short", day: "numeric" });
    const dayData = data.filter((x) => new Date(x.created_at).toDateString() === d.toDateString());
    const soil =
      dayData.length > 0 ? dayData.reduce((sum, x) => sum + (x.soil || 0), 0) / dayData.length : null;
    return { label, soil };
  });
}

// Main component
export default function Statistics() {
  const { lang, t, toggleLanguage } = useLanguage();

  const [previewUri, setPreviewUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const timeOptions = [
    { label: "Last 24 Hours", value: "24h" },
    { label: "Last 3 Days", value: "3d" },
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
  ];

  const cropOptions = [
    { label: "Okra", value: "Okra" },
    { label: "Siling Labuyo", value: "Siling Labuyo" },
  ];

  const [deviceOptions, setDeviceOptions] = useState([]);
  const [device, setDevice] = useState(null);
  const [deviceLoading, setDeviceLoading] = useState(true);

  const [crop, setCrop] = useState("Okra");
  const [timeRange, setTimeRange] = useState("24h");
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     ADDITIONAL CODE START: WALKTHROUGH (HIGHLIGHT OVERLAY)
  ========================================================== */
  const [walkVisible, setWalkVisible] = useState(false);
  const [walkStep, setWalkStep] = useState(0);
  const [walkHighlight, setWalkHighlight] = useState(null);

  const refHelpBtn = useRef(null);
  const refRefreshBtn = useRef(null);
  const refTimeDropdownWrap = useRef(null);
  const refCropDropdownWrap = useRef(null);
  const refDeviceDropdownWrap = useRef(null);
  const refChartWrap = useRef(null);
  const refSensorBox = useRef(null);
  const refGenerateBtn = useRef(null);

  const measureRefInWindow = (ref) =>
    new Promise((resolve) => {
      const node = ref?.current;
      if (!node || !node.measureInWindow) return resolve(null);
      node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
    });

  const walkSteps = useMemo(
    () => [
      {
        key: "help",
        ref: refHelpBtn,
        title: "Walkthrough",
        body: "Tap this button anytime to open the guide again.",
      },
      {
        key: "refresh",
        ref: refRefreshBtn,
        title: "Refresh",
        body: "Pull down or tap Refresh to reload devices and sensor data.",
      },
      {
        key: "time",
        ref: refTimeDropdownWrap,
        title: "Time Range",
        body: "Choose how far back the chart and statistics should display.",
      },
      {
        key: "crop",
        ref: refCropDropdownWrap,
        title: "Crop Filter",
        body: "Switch between crops to view their sensor logs and stats.",
      },
      {
        key: "device",
        ref: refDeviceDropdownWrap,
        title: "Device Filter",
        body: "Select a specific device or view all devices (if available).",
      },
      {
        key: "chart",
        ref: refChartWrap,
        title: "Soil Moisture Chart",
        body: "This graph visualizes soil moisture readings based on your filters.",
      },
      {
        key: "stats",
        ref: refSensorBox,
        title: "Environmental Summary",
        body: "Quick view of temperature, soil moisture, and rain status.",
      },
      {
        key: "report",
        ref: refGenerateBtn,
        title: "Generate Report",
        body: "Create a PDF report you can print or share.",
      },
    ],
    [],
  );

  const syncHighlight = async (idx) => {
    const s = walkSteps[idx];
    if (!s) return;

    setTimeout(async () => {
      const rect = await measureRefInWindow(s.ref);
      if (rect) setWalkHighlight(rect);
    }, 60);
  };

  const startWalkthrough = async () => {
    setWalkStep(0);
    setWalkVisible(true);
    setWalkHighlight(null);
    await syncHighlight(0);
  };

  const endWalkthrough = () => {
    setWalkVisible(false);
    setWalkHighlight(null);
    setWalkStep(0);
  };

  const nextStep = async () => {
    if (walkStep >= walkSteps.length - 1) {
      endWalkthrough();
      return;
    }
    const n = walkStep + 1;
    setWalkStep(n);
    setWalkHighlight(null);
    await syncHighlight(n);
  };

  const prevStep = async () => {
    if (walkStep <= 0) return;
    const p = walkStep - 1;
    setWalkStep(p);
    setWalkHighlight(null);
    await syncHighlight(p);
  };

  useEffect(() => {
    if (!walkVisible) return;
    syncHighlight(walkStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkVisible, walkStep, refreshing, loading, sensorData.length, device, crop, timeRange]);
  /* =========================
     END WALKTHROUGH CODE
  ========================== */

  /* fetching user devices */
  const fetchUserDevices = async () => {
    setDeviceLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDeviceOptions([{ label: "No devices registered yet", value: null }]);
      setDevice(null);
      setDeviceLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("plant_device")
      .select("device_id, device_name, device_status")
      .eq("user_id", user.id);

    if (error || !data || data.length === 0) {
      setDeviceOptions([{ label: "No devices registered yet", value: null }]);
      setDevice(null);
    } else {
      const formatted = data.map((d) => ({
        label: d.device_name || d.device_id,
        value: d.device_id,
      }));
      setDeviceOptions(formatted);

      const stillExists = formatted.some((x) => x.value === device);
      setDevice(stillExists ? device : formatted[0].value);
    }

    setDeviceLoading(false);
  };

  /* fetching sensor data */
  const fetchSensorData = async () => {
    setLoading(true);

    let startDate = new Date();
    if (timeRange === "24h") startDate.setHours(startDate.getHours() - 24);
    if (timeRange === "3d") startDate.setDate(startDate.getDate() - 3);
    if (timeRange === "7d") startDate.setDate(startDate.getDate() - 7);
    if (timeRange === "30d") startDate.setDate(startDate.getDate() - 30);

    let query = supabase
      .from("sensor_data")
      .select("*")
      .eq("crop", crop)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (device) {
      query = query.eq("plant_device_id", device);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch error:", error);
      setSensorData([]);
    } else {
      setSensorData(data || []);
    }

    setLoading(false);
  };

  /* initial load */
  useEffect(() => {
    fetchUserDevices();
  }, []);

  useEffect(() => {
    fetchSensorData();
  }, [timeRange, crop, device]);

  /* for manual refreshing + pull */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchUserDevices(), fetchSensorData()]);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const sampledData = downsampleData(sensorData, 20);

  let chartPoints = sampledData;

  if (timeRange === "24h") {
    chartPoints = sampledData.map((d) => ({
      label: new Date(d.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      soil: d.soil,
    }));
  } else if (timeRange === "3d" || timeRange === "7d" || timeRange === "30d") {
    const rangeDates = generateDateRange(timeRange);
    chartPoints = fillMissingDays(rangeDates, sampledData);
  }

  const chartData = {
    labels: chartPoints.map((d) => d.label),
    datasets: [
      {
        data: chartPoints.map((d) => d.soil ?? 0),
        color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const avgTemp =
    sensorData.length > 0
      ? (sensorData.reduce((sum, d) => sum + (d.temperature || 0), 0) / sensorData.length).toFixed(1)
      : "--";

  const avgSoil = sensorData.length > 0 ? Math.max(...sensorData.map((d) => d.soil || 0)) : "--";

  const rainStatus = sensorData.length > 0 ? sensorData[sensorData.length - 1].rain : "Unknown";

  // report generation
  const handleGenerateReport = async () => {
    try {
      const getBase64FromAsset = async (module) => {
        const asset = Asset.fromModule(module);
        await asset.downloadAsync();
        const fileUri = asset.localUri || asset.uri;
        const destUri = `${FileSystem.cacheDirectory}${asset.name}`;
        await FileSystem.copyAsync({ from: fileUri, to: destUri });
        const base64 = await FileSystem.readAsStringAsync(destUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/png;base64,${base64}`;
      };

      const logoBase64Uri = await getBase64FromAsset(require("../assets/OksiMainLogo.png"));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("No user logged in.");
        return;
      }

      const { data: profileData } = await supabase.from("profiles").select("username").eq("id", user.id).single();

      const displayName = profileData?.username || user.email || "Unknown User";

      let daysToFetch;
      if (timeRange === "24h") daysToFetch = 1;
      else if (timeRange === "3d") daysToFetch = 3;
      else if (timeRange === "7d") daysToFetch = 7;
      else if (timeRange === "30d") daysToFetch = 30;
      else daysToFetch = 1;

      const fromDate = new Date(Date.now() - daysToFetch * 24 * 60 * 60 * 1000).toISOString();

      const { data: statsData, error: statsError } = await supabase
        .from("sensor_data")
        .select("temperature, humidity, rain, soil, light, created_at, crop, plant_device_id")
        .eq("user_id", user.id)
        .eq("crop", crop)
        .gte("created_at", fromDate)
        .order("created_at", { ascending: false });

      if (statsError) throw statsError;
      if (!statsData || statsData.length === 0) {
        alert(`No sensor data found for the past ${daysToFetch} day(s).`);
        return;
      }

      const avgTempVal = statsData.length
        ? statsData.reduce((acc, row) => acc + (Number(row.temperature) || 0), 0) / statsData.length
        : 0;

      const avgHumidityVal = statsData.length
        ? statsData.reduce((acc, row) => acc + (Number(row.humidity) || 0), 0) / statsData.length
        : 0;

      const avgLightPercent = statsData.length
        ? statsData.reduce((acc, row) => acc + ((Number(row.light) || 0) / 20000) * 100, 0) / statsData.length
        : 0;

      const avgSoilVal = statsData.length ? Math.max(...statsData.map((row) => Number(row.soil) || 0)) : 0;

      const { data: tankData } = await supabase
        .from("tank_data")
        .select("relay_state, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      const soilTable = statsData
        .slice(0, 20)
        .map((row) => {
          const time = new Date(row.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const soilMoisture = row.soil ?? "N/A";
          const temp = row.temperature ?? "N/A";
          const humidity = row.humidity ?? "N/A";
          const light = row.light ?? "N/A";

          const irrigationRecord = (tankData || []).find(
            (tank) => Math.abs(new Date(tank.created_at) - new Date(row.created_at)) < 60000,
          );

          const irrigationEvent = irrigationRecord?.relay_state === "ON" ? "✔" : "No";

          return `
            <tr>
              <td>${time}</td>
              <td>${soilMoisture}%</td>
              <td>${temp}°C</td>
              <td>${humidity}%</td>
              <td>${(((Number(light) || 0) / 20000) * 100).toFixed(1)}%</td>
              <td>${irrigationEvent}</td>
            </tr>
          `;
        })
        .join("");

      const selectedDeviceName = deviceOptions.find((d) => d.value === device)?.label || "All Devices";

      const thresholds = {
        Okra: {
          soil: 30,
          tempMin: 18,
          tempMax: 35,
          humidityMin: 50,
          humidityMax: 70,
          lightMin: 15000,
          lightMax: 35000,
        },
        "Siling Labuyo": {
          soil: 30,
          tempMin: 30,
          tempMax: 32,
          humidityMin: 60,
          humidityMax: 100,
          lightMin: 20000,
          lightMax: 35000,
        },
      };

      const cropName = crop === "okra" ? "Okra" : "Siling Labuyo";
      const cropThreshold = thresholds[cropName] || thresholds[crop];

      const soilAnalysis =
        avgSoilVal < cropThreshold.soil
          ? "Soil moisture is below optimal level; irrigation recommended."
          : "Soil moisture is within optimal range.";

      const tempAnalysis =
        avgTempVal < cropThreshold.tempMin
          ? "Temperature is below ideal range; consider warming measures."
          : avgTempVal > cropThreshold.tempMax
            ? "Temperature is above ideal range; consider cooling/shading."
            : "Temperature is within optimal range.";

      const humidityAnalysis =
        avgHumidityVal < cropThreshold.humidityMin
          ? "Humidity is too low; consider misting or irrigation."
          : avgHumidityVal > cropThreshold.humidityMax
            ? "Humidity is too high; consider ventilation."
            : "Humidity is within optimal range.";

      const lightLux = avgLightPercent * 20000 || 0;
      const lightAnalysis =
        lightLux < cropThreshold.lightMin
          ? "Light intensity is below ideal; consider moving plants to brighter area."
          : lightLux > cropThreshold.lightMax
            ? "Light intensity is above ideal; consider shading."
            : "Light intensity is within optimal range.";

      const issues = [];
      if (avgSoilVal < cropThreshold.soil) issues.push("Soil Moisture");
      if (avgTempVal < cropThreshold.tempMin || avgTempVal > cropThreshold.tempMax) issues.push("Temperature");
      if (avgHumidityVal < cropThreshold.humidityMin || avgHumidityVal > cropThreshold.humidityMax) issues.push("Humidity");
      if (lightLux < cropThreshold.lightMin || lightLux > cropThreshold.lightMax) issues.push("Light Intensity");

      const summaryText =
        issues.length === 0
          ? "All environmental factors are within optimal range for healthy crop growth."
          : `Attention required for: ${issues.join(", ")}.`;

      const analysisHtml = `
        <div class="section">
          <h3>Data Analysis</h3>
          <p><strong>Soil Moisture:</strong> ${soilAnalysis}</p>
          <p><strong>Temperature:</strong> ${tempAnalysis}</p>
          <p><strong>Relative Humidity:</strong> ${humidityAnalysis}</p>
          <p><strong>Light Intensity:</strong> ${lightAnalysis}</p>
          <br />
          <p><strong>${summaryText}</strong></p>
        </div>
      `;

          //BAGO START
      const rangeLabel =
        timeRange === "24h"
          ? "Last 24 Hours"
          : timeRange === "3d"
          ? "Last 3 Days"
          : timeRange === "7d"
          ? "Last 7 Days"
          : "Last 30 Days";

      const htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Environmental Sensor Report</title>
            <style>
              body { font-family: "Segoe UI", Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 30px; color: #333; }
              h1 { display: flex; align-items: center; gap: 15px; color: #2e7d32; font-size: 28px; margin-bottom: 20px; }
              img.logo { width: 60px; height: 60px; border-radius: 50%; }
              .info, .section, table { max-width: 800px; margin: 0 auto; }
              .info p { margin: 5px 0; font-size: 15px; }
              .section { background-color: #ffffff; border-radius: 12px; padding: 20px; margin-top: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
              .section p { margin: 8px 0; font-size: 16px; }
              h3 { max-width: 800px; margin: 35px auto 10px auto; font-size: 20px; color: #2e7d32; border-left: 4px solid #2e7d32; padding-left: 10px; }
              table { width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; }
              th { background-color: #e8f5e9; color: #2e7d32; padding: 12px; font-size: 15px; }
              td { padding: 10px; font-size: 14px; border-top: 1px solid #e0e0e0; }
              tr:nth-child(even) td { background-color: #f9f9f9; }
              tr:hover td { background-color: #f1f8f4; }
              p.footer-note { max-width: 800px; margin: 25px auto 0 auto; font-size: 14px; color: #555; text-align: justify; }


              @media print {
                @page {margin: 15mm 12mm 15mm 12mm;  /* Top/Right/Bottom/Left (adjust as needed) */}
                body { background: white !important; padding: 0 !important; margin: 0 !important;}
                .info, .section, table, h3, p.footer-note { margin-top: 0 !important; margin-bottom: 24px !important; }
              }

            </style>
          </head>
          <body>
            <h1>
              <img src="${logoBase64Uri}" class="logo" alt="Logo" />
              Environmental Sensor Report
            </h1>

            <div class="info">
              <p><strong>Generated by:</strong> ${displayName}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
              <p><strong>Range:</strong> ${rangeLabel}</p>
              <p><strong>Crop:</strong> ${crop}</p>
              <p><strong>Device:</strong> ${selectedDeviceName}</p>
            </div>

            <div class="section">
              <p><strong>Average Temperature:</strong> ${avgTempVal.toFixed(1)} °C</p>
              <p><strong>Average Humidity:</strong> ${avgHumidityVal.toFixed(1)}%</p>
              <p><strong>Average Light Exposure:</strong> ${avgLightPercent.toFixed(1)}%</p>
              <p><strong>Average Soil Moisture:</strong> ${avgSoilVal.toFixed(1)}%</p>
            </div>

            ${analysisHtml}

            <h3>Recent Readings</h3>
            <table>
              <tr>
                <th>Time</th>
                <th>Soil Moisture (%)</th>
                <th>Temperature (°C)</th>
                <th>Humidity (%)</th>
                <th>Light %</th>
                <th>Water Pump</th>
              </tr>
              ${soilTable}
            </table>

            <p class="footer-note">
              This report summarizes the environmental conditions based on the last ${
                daysToFetch === 1 ? "24 hours" : `${daysToFetch} days`
              } of sensor data.
            </p>

          </body>
          </html>
          `;
          //BAGOOOO END

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      setPreviewUri(uri);
      setModalVisible(true);
    } catch (error) {
      console.error("Report generation failed:", error);
      alert("Failed to generate the report.");
    }
  };

  // for printing
  const handlePrint = async () => {
    if (previewUri) {
      await Print.printAsync({ uri: previewUri });
      setModalVisible(false);
    }
  };

  // for sharing
  const handleShare = async () => {
    if (previewUri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(previewUri);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* HEADER + HELP + REFRESH */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {t.plotBed} {cropOptions.find((option) => option.value === crop)?.label}
          </Text>

          <View style={styles.headerRight}>
            <TouchableOpacity ref={refHelpBtn} style={styles.helpBtn} onPress={startWalkthrough} activeOpacity={0.85}>
              <Ionicons name="help-circle-outline" size={20} color="#0B1220" />
            </TouchableOpacity>

            <TouchableOpacity
              ref={refRefreshBtn}
              style={[styles.refreshBtn, refreshing && { opacity: 0.7 }]}
              onPress={handleRefresh}
              disabled={refreshing}
              activeOpacity={0.85}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <Ionicons name="refresh" size={20} color="#0059ff" />
              )}
              <Text style={styles.refreshText}>{refreshing ? "Refreshing..." : "Refresh"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* filters */}
        <View style={styles.filters}>
          <View ref={refTimeDropdownWrap} collapsable={false} style={styles.filterHalf}>
            <Dropdown label={t.timeRange} options={timeOptions} value={timeRange} onChange={setTimeRange} fullWidth />
          </View>

          <View ref={refCropDropdownWrap} collapsable={false} style={styles.filterHalf}>
            <Dropdown label={t.crop} options={cropOptions} value={crop} onChange={setCrop} fullWidth />
          </View>
        </View>

        <View ref={refDeviceDropdownWrap} collapsable={false} style={{ marginTop: 4, marginBottom: 8 }}>
          <Dropdown label={t.Devices} options={deviceOptions} value={device} onChange={setDevice} fullWidth />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#58de5d" />
        ) : sensorData.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>{t.noData}</Text>
        ) : (
          <>
            <Text style={styles.chartTitle}>
              Soil Moisture Logs ({timeOptions.find((x) => x.value === timeRange)?.label})
            </Text>

            {/* Chart with axis titles outside */}
            <View ref={refChartWrap} collapsable={false} style={{ marginTop: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* y-axis title */}
                <View style={{ width: 48, alignItems: "center" }}>
                  <Text
                    style={{
                      transform: [{ rotate: "-90deg" }],
                      fontSize: 12,
                      color: "#555",
                      marginBottom: 9,
                    }}
                  >
                    Moisture
                  </Text>
                  <View style={{ height: 12 }} />
                  <Text
                    style={{
                      transform: [{ rotate: "-90deg" }],
                      fontSize: 12,
                      color: "#555",
                    }}
                  >
                    Soil
                  </Text>
                </View>

                {/* chart area */}
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <LineChart
                    data={chartData}
                    width={Math.max(chartPoints.length * 60, screenWidth)}
                    height={220}
                    chartConfig={{
                      backgroundColor: "#fff",
                      backgroundGradientFrom: "#fff",
                      backgroundGradientTo: "#fff",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: "#0000FF",
                      },
                    }}
                    bezier
                    style={{ borderRadius: 12 }}
                  />
                </ScrollView>
              </View>

              {/* x-axis title */}
              <Text style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "#555" }}>Time</Text>
            </View>

            <Text style={styles.sectionTitle}>
              {t.environmentalSensors} ({timeOptions.find((x) => x.value === timeRange)?.label})
            </Text>

            <View ref={refSensorBox} collapsable={false} style={styles.sensorBox}>
              <View style={styles.sensorItem}>
                <Ionicons name="thermometer-outline" size={24} color="black" />
                <Text style={styles.sensorText}>{t.avgTemp}</Text>
                <Text style={styles.sensorValue}>{avgTemp}°C</Text>
              </View>
              <View style={styles.sensorItem}>
                <Ionicons name="water-outline" size={24} color="black" />
                <Text style={styles.sensorText}>{t.maxHumidity}</Text>
                <Text style={styles.sensorValue}>{avgSoil}%</Text>
              </View>
              <View style={styles.sensorItem}>
                <Ionicons name="rainy-outline" size={24} color="black" />
                <Text style={styles.sensorText}>{t.rainStatus}</Text>
                <Text style={styles.sensorValue}>{rainStatus}</Text>
              </View>
            </View>

            <TouchableOpacity
              ref={refGenerateBtn}
              collapsable={false}
              style={styles.button}
              onPress={handleGenerateReport}
            >
              <Text style={styles.buttonText}>{t.generateReport}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* WALKTHROUGH OVERLAY */}
      <WalkthroughOverlay
        visible={walkVisible}
        step={walkStep}
        total={walkSteps.length}
        highlight={walkHighlight}
        title={walkSteps[walkStep]?.title || ""}
        body={walkSteps[walkStep]?.body || ""}
        onNext={nextStep}
        onPrev={prevStep}
        onClose={endWalkthrough}
      />

      {/* preview modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              width: "80%",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>PDF Preview</Text>

            {previewUri ? (
              <Text
                style={{
                  fontSize: 12,
                  color: "#333",
                  marginBottom: 15,
                  textAlign: "center",
                }}
                numberOfLines={2}
              >
                {previewUri}
              </Text>
            ) : (
              <Text>Loading preview...</Text>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: "#4CAF50",
                paddingVertical: 10,
                borderRadius: 8,
                marginVertical: 5,
                width: "70%",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={handlePrint}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>Print</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: "#1976D2",
                paddingVertical: 10,
                borderRadius: 8,
                marginVertical: 5,
                width: "70%",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={handleShare}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: "gray",
                paddingVertical: 10,
                borderRadius: 8,
                marginVertical: 5,
                width: "70%",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  helpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: stylesTokens.border,
  },
  helpText: { fontSize: 12, fontWeight: "800", color: "#0B1220" },

  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#F3F5FA",
    borderWidth: 1,
    borderColor: stylesTokens.border,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000000",
  },

  title: { fontSize: 18, fontWeight: "bold" },

  /* ✅ FIX: match screenshot spacing */
  filters: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  filterHalf: {
    flex: 1,
  },

  /* ✅ FIX: Dropdown block should NOT force 48% width */
  pickerBlock: {
    flex: 1,
  },
  fullPickerBlock: {
    width: "100%",
  },

  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },

  pickerWrapper: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFAFA",
  },

  /* ✅ FIX: keep selected label readable like the screenshot */
  selectedText: {
    fontSize: 14,
    color: "#111",
    flex: 1,
    paddingRight: 10,
    lineHeight: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    maxHeight: "60%",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },

  optionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optionText: { fontSize: 15, color: "#111" },

  sep: { height: 1, backgroundColor: "#EEE", marginHorizontal: 8 },

  chartTitle: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
    fontSize: 15,
  },

  sectionTitle: { marginTop: 8, fontWeight: "bold", fontSize: 16 },

  sensorBox: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F7F6EB",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },

  sensorItem: { alignItems: "center", flex: 1 },

  sensorText: { fontSize: 12, color: "#333" },

  sensorValue: { fontSize: 16, fontWeight: "bold", marginTop: 4 },

  button: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: { fontSize: 16, fontWeight: "bold", color: "#fff" },

  /* Walkthrough styles */
  wtBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.60)",
  },
  wtHighlightBox: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "rgba(37,99,235,0.95)",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  wtTooltip: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  wtTooltipTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  wtStepText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#374151",
  },
  wtCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.06)",
  },
  wtTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0B1220",
    marginBottom: 6,
  },
  wtBody: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    lineHeight: 18,
    marginBottom: 12,
  },
  wtBtnRow: {
    flexDirection: "row",
    columnGap: 10,
  },
  wtBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  wtBtnBlue: { backgroundColor: "#2563EB" },
  wtBtnGray: { backgroundColor: "#6B7280" },
  wtBtnText: { color: "#fff", fontWeight: "900" },
});
