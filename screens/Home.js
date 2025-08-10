import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const API_KEY = "bd96cb9d18e16f8796d773ef208270be";
        const city = "Quezon City";
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        setWeather(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchWeather();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}

      {/* Weather Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weather</Text>
        <Text style={{ textAlign: "center" }}>Metro Manila, Quezon City</Text>
        <Text style={styles.temperature}>
          {weather ? `${Math.round(weather.main.temp)}°` : "--"}
        </Text>

        <View style={styles.weatherCards}>
          <View style={styles.weatherCard}>
            <Text>10 AM</Text>
            <Text>30°</Text>
            <Ionicons name="partly-sunny" size={28} color="#f5a623" />
            <Text>Partly Cloudy</Text>
          </View>
          <View style={styles.weatherCard}>
            <Text>Now</Text>
            <Text>{weather ? `${Math.round(weather.main.temp)}°` : "--"}</Text>
            <Ionicons name="rainy" size={28} color="#4A90E2" />
            <Text>Rainy</Text>
          </View>
          <View style={styles.weatherCard}>
            <Text>12 PM</Text>
            <Text>28°</Text>
            <Ionicons name="rainy" size={28} color="#4A90E2" />
            <Text>Rainy</Text>
          </View>
        </View>
      </View>

      {/* Water Container Calibration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Water Container Calibration</Text>
        <TouchableOpacity style={styles.card}>
          <Text>Set up your water container here. Click to start configuration</Text>
        </TouchableOpacity>
      </View>

      {/* Crop Health Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crop Health Status</Text>
        <View style={styles.card}>
          <Text>💧Moisture Level: 45%</Text>
          <Text>⚠ Status: Below Optimal</Text>
        </View>
        <Text style={{ fontSize: 12, color: "gray" }}>Last updated 5 mins ago</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3A854E",
    padding: 10,
  },
  headerText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  welcome: { color: "#fff", fontSize: 12, marginLeft: 5 },
  profile: { width: 30, height: 30, borderRadius: 15, marginLeft: 10 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  temperature: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  weatherCards: { flexDirection: "row", justifyContent: "space-around", marginTop: 10 },
  weatherCard: {
    backgroundColor: "#fff7e6",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    width: 90,
    elevation: 2,
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 15,
    elevation: 1,
  },
});
