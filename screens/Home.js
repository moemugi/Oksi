import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

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

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Ask for permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Permission to access location was denied");
          setLoading(false);
          return;
        }

        // Get device location
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // Fetch weather using lat/lon
        const [curRes, fcRes] = await Promise.all([
          axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
          ),
          axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
          ),
        ]);

        setCurrent(curRes.data);
        setForecast(fcRes.data.list.slice(0, 3)); // next 3 forecast slots
        setCity(curRes.data.name); // get city name from API response
      } catch (err) {
        console.error("Weather fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Weather Section */}
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
    const hours = dt.getHours();
    const timeLabel = idx === 1 ? "Now" : `${hours}:00`;
    const main = item.weather[0].main;
    const iconName = weatherIcons[main] || "cloud-outline";
    return (
      <View key={idx} style={styles.weatherCard}>
        <Text style={styles.weatherTime}>{timeLabel}</Text>
        <Ionicons name={iconName} size={40} color="#333" /> {/* bigger icon */}
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

      {/* Water Container Calibration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Water Container Calibration</Text>
        <TouchableOpacity style={styles.cardButton}>
          <Ionicons name="water-outline" size={32} color="#0288d1" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.cardTitle}>Set up your water container</Text>
            <Text style={styles.cardSubtitle}>
              Tap to start configuration and calibration process
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Crop Health Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crop Health Status</Text>
        <View style={styles.healthCard}>
          <Ionicons name="leaf-outline" size={32} color="#4caf50" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.cardTitle}>Moisture Level: 45%</Text>
            <Text style={[styles.cardSubtitle, { color: "#d32f2f" }]}>
              ⚠ Below Optimal
            </Text>
            <Text style={styles.lastUpdated}>Last updated 5 mins ago</Text>
          </View>
        </View>
      </View>
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
  // Add these to stretch vertically
  minHeight: 160,  // sets a base height
  justifyContent: "space-around", // evenly space content vertically
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
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardSubtitle: { fontSize: 12, color: "#555", marginTop: 3 },
  healthCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f8e9",
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  lastUpdated: { fontSize: 10, color: "gray", marginTop: 5 },
});
