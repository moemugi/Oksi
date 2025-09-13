import React, { useState } from "react";
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
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width - 40;

function Dropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <View style={styles.pickerBlock}>
      <Text style={styles.filterLabel}>{label}</Text>

      {/* Closed state: shows selected label */}
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

      {/* Modal dropdown */}
      <Modal
        visible={open}
        transparent={true}
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

export default function Statistics() {
  const timeOptions = [
    { label: "Last 24 Hours", value: "24h" },
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
  ];

  const deviceOptions = [
    { label: "Device 1", value: "device1" },
    { label: "Device 2", value: "device2" },
    { label: "Device 3", value: "device3" },
  ];

  const [timeRange, setTimeRange] = useState(timeOptions[0].value);
  const [device, setDevice] = useState(deviceOptions[0].value);

  // placeholder chart data
  const chartData = {
    labels: ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"],
    datasets: [
      {
        data: [30, 27, 25, 22, 28, 26],
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plot Bed: Okra</Text>

      {/* Two-column dropdowns (labels on top, dropdown under) */}
      <View style={styles.filters}>
        <Dropdown
          label="Time Range"
          options={timeOptions}
          value={timeRange}
          onChange={setTimeRange}
        />
        <Dropdown
          label="Device"
          options={deviceOptions}
          value={device}
          onChange={setDevice}
        />
      </View>

      <Text style={styles.chartTitle}>
        Plot Bed Moisture & Watering Logs {"\n"}({timeOptions.find(t => t.value === timeRange).label})
      </Text>

      <View style={styles.chartCard}>
        <LineChart
          data={chartData}
          width={screenWidth}
          height={220}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#0000FF" },
          }}
          bezier
          style={{ borderRadius: 12 }}
        />
      </View>

      <Text style={styles.sectionTitle}>Environmental Sensors (Last 24 Hours)</Text>

      <View style={styles.sensorBox}>
        <View style={styles.sensorItem}>
          <Ionicons name="thermometer-outline" size={24} color="black" />
          <Text style={styles.sensorText}>Average Temperature</Text>
          <Text style={styles.sensorValue}>32°C</Text>
        </View>

        <View style={styles.sensorItem}>
          <Ionicons name="water-outline" size={24} color="black" />
          <Text style={styles.sensorText}>Max Humidity</Text>
          <Text style={styles.sensorValue}>47%</Text>
        </View>

        <View style={styles.sensorItem}>
          <Ionicons name="sunny-outline" size={24} color="black" />
          <Text style={styles.sensorText}>Max Light Exposure</Text>
          <Text style={styles.sensorValue}>65%</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Generate Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },

  filters: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  pickerBlock: { width: "48%" }, // two columns, each ~48%
  filterLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6, color: "#333" },

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

  chartTitle: { textAlign: "center", fontWeight: "bold", marginBottom: 8, fontSize: 15 },
  chartCard: {
    backgroundColor: "#F4F8FF",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
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
});
