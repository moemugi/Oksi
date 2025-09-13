import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";


// --- Supabase Config ---
const SUPABASE_URL = "https://vesmleiliahbfqpcjtix.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc21sZWlsaWFoYmZxcGNqdGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2NDQsImV4cCI6MjA3MjM5OTY0NH0.N5ePU-NWW2FxhG9y3oVTHAXSZHymuC5JtRRYQcnpm6k"; // anon key
const SUPABASE_TABLE = "sensor_data";

export default function CropMonitor() {
  const [modalVisible, setModalVisible] = useState(false);
  const [wifi, setWifi] = useState("");
  const [pass, setPass] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);


const fetchSensorData = async () => {
  setLoading(true);
  try {
    const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=*&order=created_at.desc&limit=1`;

    console.log("Fetching from:", url);

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
      },
    });

    console.log("HTTP status:", res.status);
    const data = await res.json();
    console.log("Supabase raw response:", data);

    if (Array.isArray(data) && data.length > 0) {
      const latest = data[0];
      const mergedData = {
        soil: latest.soil ?? 0,
        temperature: latest.temperature ?? "N/A",
        humidity: latest.humidity ?? "N/A",
        rain: latest.rain ?? "N/A",
        crop: latest.crop ?? "N/A",
        light: 40, // placeholder
        tank: 75,  // placeholder
        pump: "Closed", // placeholder
      };
      setSensorData(mergedData);
    } else {
      Alert.alert("No Data", "No sensor data found in Supabase yet.");
    }
  } catch (err) {
    console.error("Data fetch error:", err);
    Alert.alert("Error", "Could not fetch data from Supabase.");
  }
  setLoading(false);
};


  // ⚙️ Send WiFi credentials + crop to ESP32
  const saveConfig = async () => {
    if (!wifi || !pass || !selectedCrop) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setModalVisible(false);
    setLoading(true);

    try {
      const res = await fetch("http://192.168.4.1/configure", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `ssid=${wifi}&password=${pass}&crop=${selectedCrop}`,
      });

      const configRes = await res.json();
      console.log("Config response:", configRes);

      Alert.alert(
        "Configured",
        "ESP32 saved your WiFi. Now reconnect your phone to the internet (hotspot) so ESP32 can upload data."
      );
    } catch (err) {
      console.error("Config error:", err);
      Alert.alert(
        "Error",
        "Could not configure ESP32. Make sure your phone is connected to ESP32 WiFi when setting this."
      );
    }

    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!sensorData && !loading && (
        <View style={{ alignItems: "center", width: "100%" }}>
          <Image
            source={require("../assets/sensor_icon.png")}
            style={styles.logo}
          />
          <TouchableOpacity style={styles.button} onPress={fetchSensorData}>
            <Text style={styles.buttonText}>View Sensor Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#444" }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.buttonText}>Configure the Sensor </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <ActivityIndicator size="large" color="#2e6b34" />
          <Text style={{ marginTop: 10 }}>Please wait...</Text>
        </View>
      )}

      {sensorData && !loading && (
        <>
          <View style={styles.circleContainer}>
            <View style={styles.circle}>
              <Text style={styles.circleValue}>{sensorData.soil}%</Text>
              <Text style={styles.circleLabel}>Moisture Level</Text>
            </View>
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
              <Text style={styles.cardValue}>{sensorData.light}%</Text>
            </View>

            <View style={styles.squareCard}>
              <Text style={styles.cardLabel}>🌧 Rain Sensor</Text>
              <Text style={styles.cardValue}>{sensorData.rain}</Text>
            </View>

            <View style={styles.squareCard}>
              <Text style={styles.cardLabel}>💦 Water Tank</Text>
              <Text style={styles.cardValue}>{sensorData.tank}%</Text>
            </View>

            <View style={styles.squareCard}>
              <Text style={styles.cardLabel}>🚰 Pump Status</Text>
              <Text style={styles.cardValue}>{sensorData.pump}</Text>
            </View>
          </View>
        </>
      )}

      {/* Modal for Config */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
  <Text style={styles.modalTitle}>Configure ESP32</Text>

  <TextInput
    style={styles.input}
    placeholder="Hotspot Name (SSID)"
    value={wifi}
    onChangeText={setWifi}
  />
  <TextInput
    style={styles.input}
    placeholder="Password"
    value={pass}
    onChangeText={setPass}
    secureTextEntry
  />

  <View style={styles.pickerWrapper}>
    <Picker
      selectedValue={selectedCrop}
      onValueChange={(itemValue) => setSelectedCrop(itemValue)}
    >
      <Picker.Item label="Select Crop" value="" />
      <Picker.Item label="Okra" value="okra" />
      <Picker.Item label="Siling Labuyo" value="sili" />
    </Picker>
  </View>

  

  <TouchableOpacity style={styles.saveButton} onPress={saveConfig}>
    <Text style={styles.saveButtonText}>Save</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.cancelButton}
    onPress={() => setModalVisible(false)}
  >
    <Text style={styles.cancelButtonText}>Cancel</Text>
  </TouchableOpacity>
  {/* 👇 Link to show guide */}
  <TouchableOpacity onPress={() => setShowGuide(!showGuide)}>
    <Text style={styles.helpLink}>
      {showGuide
        ? "Hide guide"
        : "How to connect and receive data from ESP32"}
    </Text>
  </TouchableOpacity>

  {/* 👇 Collapsible guide */}
  {showGuide && (
    <View style={styles.guideBox}>
      <Text style={styles.guideText}>1. Power on the Sensor.</Text>
      <Text style={styles.guideText}>
        2. On your phone, go to WiFi settings and connect to the ESP32 access
        point (default: <Text style={{ fontWeight: "bold" }}>Oksi_AP</Text>).
      </Text>
      <Text style={styles.guideText}>
        3. Turn on ypur hotspot and return to this app and enter your Hotspot SSID, password, and crop.
      </Text>
      <Text style={styles.guideText}>
        4. Tap "Save". The ESP32 will restart and connect to your hotspot.
      </Text>
      <Text style={styles.guideText}>
        5. Reconnect your phone to the internet/data so the app can retrieve data from the sensor.
      </Text>
    </View>
  )}
</View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  button: {
    backgroundColor: "#2e6b34",
    paddingVertical: 12,
    borderRadius: 25,
    width: "65%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
  },
  circleContainer: { alignItems: "center", marginVertical: 20 },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 12,
    borderColor: "#2e6b34",
    alignItems: "center",
    justifyContent: "center",
  },
  circleValue: { fontSize: 24, fontWeight: "bold", color: "#2e6b34" },
  circleLabel: { fontSize: 14, color: "#333" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  squareCard: {
    width: "45%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    margin: 5,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    elevation: 3,
  },
  cardLabel: { fontSize: 13, color: "#555", textAlign: "center" },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
    color: "#2e6b34",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  pickerWrapper: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#2e6b34",
    paddingVertical: 10,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 5,
  },
  saveButtonText: { color: "#fff", fontWeight: "bold" },
  cancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 5,
  },
  cancelButtonText: { color: "#000", fontWeight: "bold" },
  helpLink: {
  color: "#2e6b34",
  marginBottom: 10,
  textDecorationLine: "underline",
  textAlign: "center",
},
guideBox: {
  backgroundColor: "#f0f0f0",
  borderRadius: 8,
  padding: 10,
  marginBottom: 10,
},
guideText: {
  fontSize: 13,
  color: "#333",
  marginBottom: 5,
},

});
