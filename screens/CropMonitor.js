import React, { useState } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function CropMonitor() {
  const [modalVisible, setModalVisible] = useState(false);
  const [wifi, setWifi] = useState('');
  const [pass, setPass] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Save Config to ESP32 ---
  // --- Save Config to ESP32 ---
const saveConfig = () => {
  if (!wifi || !pass || !selectedCrop) {
    Alert.alert("Error", "Please fill all fields");
    return;
  }

  setModalVisible(false);
  setLoading(true);

  // 1. Send WiFi + Crop config to ESP32
  fetch("http://192.168.4.1/configure", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `ssid=${wifi}&password=${pass}&crop=${selectedCrop}`,
  })
    .then((res) => res.json())
    .then((configRes) => {
      console.log("Config response:", configRes);

      // 2. Fetch sensor data
      return fetch("http://192.168.4.1/data");
    })
    .then((res) => res.json())
    .then((data) => {
      console.log("Sensor Data:", data);

      // Merge ESP32 data with const values
      const mergedData = {
        soil: data.soil,
        temperature: data.temperature,
        humidity: data.humidity,
        rain: data.rain,
        // constants
        light: 40,
        tank: 75,
        pump: "Closed",
      };

      setSensorData(mergedData);
      setLoading(false);
      Alert.alert("Success", "Configuration saved and data fetched!");
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
      Alert.alert("Error", "Failed to connect to ESP32. Please try again.");
    });
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!sensorData && !loading && (
    <View style={{ alignItems: 'center', width: '100%' }}>
  <Image
    source={require('../assets/sensor_icon.png')}
    style={styles.logo}
  />
  <TouchableOpacity
    style={styles.button}
    onPress={() => setModalVisible(true)}
  >
    <Text style={styles.buttonText}>Configure</Text>
  </TouchableOpacity>
</View>

  )}

      {loading && (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <ActivityIndicator size="large" color="#2e6b34" />
          <Text style={{ marginTop: 10 }}>Connecting, please wait...</Text>
        </View>
      )}

      {/* Show sensor data only after config */}
      {sensorData && !loading && (
        <>
          {/* Circle Gauge */}
          <View style={styles.circleContainer}>
            <View style={styles.circle}>
              <Text style={styles.circleValue}>{sensorData.soil}%</Text>
              <Text style={styles.circleLabel}>Moisture Level</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Crop’s Environment</Text>

          {/* Grid of Cards */}
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
            <Text style={styles.modalTitle}>Configure Settings</Text>

            <TextInput
              style={styles.input}
              placeholder="WiFi Name (SSID)"
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

            {/* Crop Picker */}
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

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveConfig}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  button: {
    backgroundColor: '#2e6b34',
    paddingVertical: 12,
    borderRadius: 25,
    width: '65%',
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logo: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 20 },

  // Circle
  circleContainer: { alignItems: 'center', marginVertical: 20 },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 12,
    borderColor: '#2e6b34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleValue: { fontSize: 24, fontWeight: 'bold', color: '#2e6b34' },
  circleLabel: { fontSize: 14, color: '#333' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },

  // Grid
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  cardLabel: { fontSize: 13, color: "#555", textAlign: "center" },
  cardValue: { fontSize: 18, fontWeight: "bold", marginTop: 5, color: "#2e6b34" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10
  },
  pickerWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10
  },
  saveButton: {
    backgroundColor: '#2e6b34',
    paddingVertical: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 5
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 5
  },
  cancelButtonText: { color: '#000', fontWeight: 'bold' }
});