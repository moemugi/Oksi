import React, { useState, useEffect } from "react";
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
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";


import * as Print from "expo-print";
import * as Sharing from "expo-sharing";


const screenWidth = Dimensions.get("window").width - 40;
export async function generateReport(userId, deviceId) {
  // 1. Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();


  // 2. Fetch device info
  const { data: device } = await supabase
    .from("devices")
    .select("*")
    .eq("id", deviceId)
    .single();


  // 3. Fetch last 24h sensor data
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


  // fallback if no data
  const safeLogs = logs || [];


  //  Process stats
  const avgTemp = safeLogs.length
    ? (
        safeLogs.reduce((sum, l) => sum + (l.temperature || 0), 0) /
        safeLogs.length
      ).toFixed(1)
    : "N/A";


  const avgSoil = safeLogs.length
    ? Math.max(...safeLogs.map((l) => l.soil || 0))
    : "N/A";


  const maxLight = safeLogs.length
    ? Math.max(...safeLogs.map((l) => l.light || 0))
    : "N/A";


  const rows = safeLogs
    .map(
      (l) => `
      <tr>
        <td>${new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
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


// Dropdown component
function Dropdown({ label, options, value, onChange, fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) || options[0];


  return (
    <View style={[ styles.pickerBlock, fullWidth && styles.fullPickerBlock,]}>
      <Text style={styles.filterLabel}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.pickerWrapper}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.selectedText} numberOfLines={2}>
          {selected?.label}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#333" />
      </TouchableOpacity>


      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
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
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color="#4CAF50" />
                  )}
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
    const dayData = data.filter(
      (x) => new Date(x.created_at).toDateString() === d.toDateString(),
    );
    const soil =
      dayData.length > 0
        ? dayData.reduce((sum, x) => sum + (x.soil || 0), 0) / dayData.length
        : null;
    return { label, soil };
  });
}


// Main component
export default function Statistics() {
  const [previewUri, setPreviewUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
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
  




  useEffect(() => {
  const fetchUserDevices = async () => {
    setDeviceLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDeviceOptions([]);
      setDeviceLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("plant_device")
      .select("device_id, device_name, device_status")
      .eq("user_id", user.id);

    if (error) {
      console.error("Device fetch error:", error);
      setDeviceOptions([]);
    } else if (!data || data.length === 0) {
      setDeviceOptions([]);
    } else {
      const formatted = data.map((d) => ({
        label: d.device_name || d.device_id, //  UI shows name
        value: d.device_id,                  //  logic uses MAC
      }));
      setDeviceOptions(formatted);
      setDevice(formatted[0].value); // auto-select first device
    }

    setDeviceLoading(false);
  };

  fetchUserDevices();
}, []);




  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);


      // Calculate start date
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


    fetchData();
  }, [timeRange, crop, device]);


  const sampledData = downsampleData(sensorData, 20);


  // Prepare chart points with labels
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


  // Environmental stats
  const avgTemp =
    sensorData.length > 0
      ? (
          sensorData.reduce((sum, d) => sum + d.temperature, 0) /
          sensorData.length
        ).toFixed(1)
      : "--";


  const avgSoil =
    sensorData.length > 0
      ? Math.max(...sensorData.map((d) => d.soil || 0))
      : "--";


  const rainStatus =
    sensorData.length > 0 ? sensorData[sensorData.length - 1].rain : "Unknown";
  const handleGenerateReport = async () => {
    try {
      // 1️⃣ Load logo safely
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


      const logoBase64Uri = await getBase64FromAsset(
        require("../assets/OksiMainLogo.png"),
      );


      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("No user logged in.");
        return;
      }


      // Get username
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();


      const displayName = profileData?.username || user.email || "Unknown User";


      //  Correct time range logic
      let daysToFetch;
      if (timeRange === "24h") {
        daysToFetch = 1;
      } else if (timeRange === "3d") {
        daysToFetch = 3;
      } else if (timeRange === "7d") {
        daysToFetch = 7;
      } else if (timeRange === "30d") {
        daysToFetch = 30;
      } else {
        daysToFetch = 1;
      }


      const fromDate = new Date(
        Date.now() - daysToFetch * 24 * 60 * 60 * 1000,
      ).toISOString();


      // Fetch sensor data
      const { data: statsData, error: statsError } = await supabase
        .from("sensor_data")
        .select("temperature, humidity, rain, soil, light, created_at, crop")
        .eq("user_id", user.id)
        .eq("crop", crop) // filter report by selected crop
        .gte("created_at", fromDate)
        .order("created_at", { ascending: false });


      if (statsError) throw statsError;
      if (!statsData || statsData.length === 0) {
        alert(`No sensor data found for the past ${daysToFetch} day(s).`);
        return;
      }


      // Compute stats
      const safeTemps = statsData.map((i) => Number(i.temperature) || 0);
      const safeHumidity = statsData.map((i) => Number(i.humidity) || 0);
      const safeLight = statsData.map((i) => Number(i.light) || 0);


      // Convert lux → percent (assuming 20,000 lux = 100%)
      const lightPercentValues = safeLight.map((v) => (v / 20000) * 100);


      // Compute average light %
      const avgTemp = statsData.length
        ? statsData.reduce(
            (acc, row) => acc + (Number(row.temperature) || 0),
            0,
          ) / statsData.length
        : 0;


      const avgHumidity = statsData.length
        ? statsData.reduce((acc, row) => acc + (Number(row.humidity) || 0), 0) /
          statsData.length
        : 0;


      // Convert lux → percent (assuming 20,000 lux = 100%)
      const avgLightPercent = statsData.length
        ? statsData.reduce(
            (acc, row) => acc + ((Number(row.light) || 0) / 20000) * 100,
            0,
          ) / statsData.length
        : 0;


      const avgSoil = statsData.length
        ? Math.max(...statsData.map((row) => Number(row.soil) || 0))
        : 0;


      const { data: tankData, error: tankError } = await supabase
        .from("tank_data")
        .select("relay_state, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });


      const soilTable = statsData
        .slice(0, 20) // limit rows if too many
        .map((row) => {
          const time = new Date(row.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const soilMoisture = row.soil ?? "N/A";
          const temp = row.temperature ?? "N/A";
          const humidity = row.humidity ?? "N/A";
          const light = row.light ?? "N/A";


          // Find matching tank_data entry closest to this soil reading
          const irrigationRecord = tankData.find(
            (tank) =>
              Math.abs(new Date(tank.created_at) - new Date(row.created_at)) <
              60000, // within 1 min window
          );


          // Determine if irrigation was ON at that time
          const irrigationEvent =
            irrigationRecord?.relay_state === "ON" ? "✔" : "No";


          return `
      <tr>
        <td>${time}</td>
        <td>${soilMoisture}%</td>
        <td>${temp}°C</td>
        <td>${humidity}%</td>
        <td>${((light / 20000) * 100).toFixed(1)}%</td>
        <td>${irrigationEvent}</td>
      </tr>
    `;
        })
        .join("");

      const selectedDeviceName =
      deviceOptions.find((d) => d.value === device)?.label || "All Devices";
      

      const thresholds = {
      Okra: {
        soil: 30, // <30% VWC
        tempMin: 18,
        tempMax: 35,
        humidityMin: 50,
        humidityMax: 70,
        lightMin: 15000, // lux
        lightMax: 35000, // ideal
      },
      "Siling Labuyo": {
        soil: 30, // <30% VWC
        tempMin: 30,
        tempMax: 32,
        humidityMin: 60,
        humidityMax: 100, // only lower limit given
        lightMin: 20000, // lux
        lightMax: 35000, // assume upper ideal
      },
    };


    const cropName = crop === "okra" ? "Okra" : "Siling Labuyo";
const cropThreshold = thresholds[cropName];

// --- Generate Analysis ---
const soilAnalysis =
  avgSoil < cropThreshold.soil
    ? "Soil moisture is below optimal level; irrigation recommended."
    : "Soil moisture is within optimal range.";

const tempAnalysis =
  avgTemp < cropThreshold.tempMin
    ? "Temperature is below ideal range; consider warming measures."
    : avgTemp > cropThreshold.tempMax
    ? "Temperature is above ideal range; consider cooling/shading."
    : "Temperature is within optimal range.";

const humidityAnalysis =
  avgHumidity < cropThreshold.humidityMin
    ? "Humidity is too low; consider misting or irrigation."
    : avgHumidity > cropThreshold.humidityMax
    ? "Humidity is too high; consider ventilation."
    : "Humidity is within optimal range.";

const lightAnalysis =
  avgLightPercent * 20000 < cropThreshold.lightMin
    ? "Light intensity is below ideal; consider moving plants to brighter area."
    : avgLightPercent * 20000 > cropThreshold.lightMax
    ? "Light intensity is above ideal; consider shading."
    : "Light intensity is within optimal range.";

// --- Determine Issues for Summary ---
const issues = [];
if (avgSoil < cropThreshold.soil) issues.push("Soil Moisture");
if (avgTemp < cropThreshold.tempMin || avgTemp > cropThreshold.tempMax) issues.push("Temperature");
if (avgHumidity < cropThreshold.humidityMin || avgHumidity > cropThreshold.humidityMax) issues.push("Humidity");
if (avgLightPercent * 20000 < cropThreshold.lightMin || avgLightPercent * 20000 > cropThreshold.lightMax) issues.push("Light Intensity");

const summaryText =
  issues.length === 0
    ? "All environmental factors are within optimal range for healthy crop growth."
    : `Attention required for: ${issues.join(", ")}.`;

// --- HTML Sections ---
const analysisHtml = `
<div class="section">
  <h3>Data Analysis</h3>
  <p><strong>Soil Moisture:</strong> ${soilAnalysis}</p>
  <p><strong>Temperature:</strong> ${tempAnalysis}</p>
  <p><strong>Relative Humidity:</strong> ${humidityAnalysis}</p>
  <p><strong>Light Intensity:</strong> ${lightAnalysis}</p>
  <br>
  <p><strong>${summaryText}</p>
</div>
`;

// --- test Content --- const summaryHtml = `
 // --- test HTML Content ---<div class="section">
// --- test HTML Content ---  <h3>Summary</h3>
 // --- test HTML Content --- <p>${summaryText}</p>
// --- test HTML Content ---</div>
// --- test HTML Content ---`;

// --- Full HTML Content ---
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
    <p><strong>Range:</strong> Last ${daysToFetch} ${daysToFetch === 1 ? "Day" : "Days"}</p>
    <p><strong>Crop:</strong> ${cropName}</p>
    <p><strong>Device:</strong> ${selectedDeviceName}</p>
  </div>

  <div class="section">
    <p><strong>Average Temperature (Last ${daysToFetch} ${daysToFetch === 1 ? "Day" : "Days"}):</strong> ${avgTemp.toFixed(1)} °C</p>
    <p><strong>Average Humidity (Last ${daysToFetch} ${daysToFetch === 1 ? "Day" : "Days"}):</strong> ${avgHumidity.toFixed(1)}%</p>
    <p><strong>Average Light Exposure (Last ${daysToFetch} ${daysToFetch === 1 ? "Day" : "Days"}):</strong> ${avgLightPercent.toFixed(1)}%</p>
    <p><strong>Average Soil Moisture (Last ${daysToFetch} ${daysToFetch === 1 ? "Day" : "Days"}):</strong> ${avgSoil.toFixed(1)}%</p>
  </div>

  ${analysisHtml}

  <h3>Recent Soil Moisture Readings (Last ${daysToFetch} ${daysToFetch === 1 ? "Day" : "Days"})</h3>
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
    This report summarizes the environmental conditions based on the last ${daysToFetch === 1 ? "24 hours" : `${daysToFetch} days`} of sensor data.
  </p>

</body>
</html>
`;


      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      setPreviewUri(uri);
      setModalVisible(true);
    } catch (error) {
      console.error("Report generation failed:", error);
      alert("Failed to generate the report.");
    }
  };


  const handlePrint = async () => {
    if (previewUri) {
      await Print.printAsync({ uri: previewUri });
      setModalVisible(false);
    }
  };


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
      >
        <Text style={styles.title}>
          Plot Bed: {cropOptions.find((option) => option.value === crop)?.label}
        </Text>
        {/* Filters */}
        <View style={styles.filters}>
          <Dropdown
            label="Time Range"
            options={timeOptions}
            value={timeRange}
            onChange={setTimeRange}
          />
          <Dropdown
            label="Crop"
            options={cropOptions}
            value={crop}
            onChange={setCrop}
          />
        </View>


          <View style={{marginTop: 4, marginBottom: 8 }}>
              <View style={styles.fullPickerBlock}>
            <Dropdown
              label="Device"
              options={deviceOptions}
              value={device}
              onChange={setDevice}
              fullWidth
            />
          </View>
          </View>


     
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : sensorData.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No data available for this period.
          </Text>
        ) : (
          <>
            <Text style={styles.chartTitle}>
              Soil Moisture Logs (
              {timeOptions.find((t) => t.value === timeRange).label})
            </Text>


            {/* Chart with axis titles outside */}
            <View style={{ marginTop: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Y-axis title (Soil Moisture) in its own column */}
                <View style={{ width: 48, alignItems: "center" }}>
                  <Text
                    style={{
                      transform: [{ rotate: "-90deg" }],
                      fontSize: 12,
                      color: "#555",
                      marginBottom: 9, // space between the two lines
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
                {/* Scrollable chart area */}
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


              {/* X-axis title (Time) below the chart, full width of screen, centered */}
              <Text
                style={{
                  marginTop: 8,
                  textAlign: "center",
                  fontSize: 12,
                  color: "#555",
                }}
              >
                Time
              </Text>
            </View>
            <Text style={styles.sectionTitle}>
              Environmental Sensors (
              {timeOptions.find((t) => t.value === timeRange).label})
            </Text>


            <View style={styles.sensorBox}>
              <View style={styles.sensorItem}>
                <Ionicons name="thermometer-outline" size={24} color="black" />
                <Text style={styles.sensorText}>Average Temp</Text>
                <Text style={styles.sensorValue}>{avgTemp}°C</Text>
              </View>
              <View style={styles.sensorItem}>
                <Ionicons name="water-outline" size={24} color="black" />
                <Text style={styles.sensorText}>Max Humidity</Text>
                <Text style={styles.sensorValue}>{avgSoil}%</Text>
              </View>
              <View style={styles.sensorItem}>
                <Ionicons name="rainy-outline" size={24} color="black" />
                <Text style={styles.sensorText}>Rain Status</Text>
                <Text style={styles.sensorValue}>{rainStatus}</Text>
              </View>
            </View>


            <TouchableOpacity
              style={styles.button}
              onPress={() => handleGenerateReport(timeRange)}
            >
              <Text style={styles.buttonText}>Generate Report</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>


      {/* Preview Modal */}
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
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
            >
              PDF Preview
            </Text>


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


            {/* Centered Buttons */}
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
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>
                Print
              </Text>
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
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>
                Share
              </Text>
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
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


// Styles unchanged
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  button: {
    backgroundColor: "#2E7D32",
    padding: 14,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalButton: {
    backgroundColor: "#2E7D32",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  modalButtonText: { color: "#fff", fontWeight: "bold" },
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  filters: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  pickerBlock: { width: "48%" },
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
  selectedText: { fontSize: 14, color: "#111", flexShrink: 1, lineHeight: 18 },
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


  filtersRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 10,
},






fullPickerBlock: {
  width: "100%",
},






deviceFilter: {
  width: "100%",
  marginBottom: 16,
},


title: {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 12,
},


});
