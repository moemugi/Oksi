import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
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
  StatusBar,
  Platform,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { SensorContext } from "../context/SensorContext";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useLanguage from "../hooks/useLanguage";

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

const stylesTokens = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  text: "#0B0F1A",
  muted: "rgba(11,15,26,0.58)",
  border: "rgba(15,23,42,0.10)",
  shadow: "rgba(15,23,42,0.10)",
  primary: "#2A76E8",
  success: "#24991E",
  danger: "#FF2D2D",
};

/* helpers for water analysis  */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const derivePercentLevel = ({ rawLevel, distanceEmpty, distanceFull }) => {
  const lv = toNumber(rawLevel);
  if (lv == null) return null;

  const de = toNumber(distanceEmpty);
  const df = toNumber(distanceFull);

  if (de == null || df == null) {
    return lv >= 0 && lv <= 100 ? clamp(lv, 0, 100) : null;
  }

  const lo = Math.min(df, de);
  const hi = Math.max(df, de);
  const tol = 2; // cm tolerance

  const looksLikeDistance = lv >= lo - tol && lv <= hi + tol;

  if (!looksLikeDistance) {
    return lv >= 0 && lv <= 100 ? clamp(lv, 0, 100) : null;
  }

  const denom = de - df;
  if (!denom || denom === 0) return null;

  const pct = ((de - lv) / denom) * 100;
  return clamp(pct, 0, 100);
};

export default function HomeScreen() {
  const { lang, t, toggleLanguage } = useLanguage();

  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [userId, setUserId] = useState(null);

  const { plantStatus, lastUpdated, setPlantStatus, setLastUpdated } =
    useContext(SensorContext);

  const [timeAgo, setTimeAgo] = useState("");
  const [loadedLastUpdated, setLoadedLastUpdated] = useState(false);

  // Modals & calibration
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationConfirmed, setCalibrationConfirmed] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0); // 0=WiFi, 1=Empty, 2=Full, 3=Confirm
  const [calibrationMessage, setCalibrationMessage] = useState("");
  const [skipEmptyStep, setSkipEmptyStep] = useState(false);

  const [useExisting, setUseExisting] = useState(false);
  const [existingEmptyDistance, setExistingEmptyDistance] = useState(null);
  const [existingCalibrationModalVisible, setExistingCalibrationModalVisible] =
    useState(false);
  const [existingCalibrationDistance, setExistingCalibrationDistance] =
    useState(null);

  const [showPassword, setShowPassword] = useState(false);

  // Water analysis/history
  const [waterHistory, setWaterHistory] = useState([]);
  const [waterAnalysis, setWaterAnalysis] = useState(null);

  // Water fill animation
  const fillAnim = useRef(new Animated.Value(0)).current;

  // Keep interval ref to pause/resume on manual refresh
  const tankIntervalRef = useRef(null);

  const startFillingAnimation = () => {
    fillAnim.setValue(0);
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: 3500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

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

      const uid = session.user.id;
      const deviceId = "water-tank-esp32";

      const { error } = await supabase.from("water_device").upsert(
        {
          user_id: uid,
          device_id: deviceId,
          device_status: "Active",
          last_active: new Date().toISOString(),
        },
        { onConflict: "device_id" }
      );

      if (error) console.error("Failed to update water device status:", error);
    } catch (err) {
      console.error("markDeviceActive error:", err);
    }
  };

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

    if (last.level <= 5 || hoursToEmpty <= 0) {
      return {
        usageRate: usageRate.toFixed(2),
        timeToEmpty: "0h 0m",
        refillNeeded: true,
        insight: "Immediate refill required!",
      };
    }

    const totalMinutes = Math.floor(hoursToEmpty * 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    let timeToEmptyStr = "";
    if (totalHours >= 24) timeToEmptyStr = `${totalHours}h / ${days}d ${hours}h`;
    else timeToEmptyStr = `${hours}h ${minutes}m`;

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

  const tempText = useMemo(() => {
    if (!current?.main?.temp && current?.main?.temp !== 0) return "--°";
    return `${Math.round(current.main.temp)}°C`;
  }, [current]);

  const weatherMain = current?.weather?.[0]?.main ?? "";
  const weatherDesc = current?.weather?.[0]?.description ?? "";

  /* WEATHER fetch */
  const fetchWeather = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const [curRes, fcRes] = await Promise.all([
        axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
        ),
        axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
        ),
      ]);

      setCurrent(curRes.data);
      setForecast(fcRes.data.list.slice(0, 8));
      setCity(curRes.data.name);
    } catch (err) {
      console.error("Weather fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Weather fetch on mount
  useEffect(() => {
    fetchWeather();
  }, []);

  // Load user session id
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data?.session?.user?.id ?? null);
    };
    loadUser();
  }, []);

  // Load plant status cache
  useEffect(() => {
    if (!userId) return;

    const loadPlantStatus = async () => {
      try {
        const savedStatus = await AsyncStorage.getItem(`plantStatus_${userId}`);
        const savedTime = await AsyncStorage.getItem(
          `plantStatusLastUpdated_${userId}`
        );

        if (savedStatus) setPlantStatus(JSON.parse(savedStatus));
        if (savedTime) setLastUpdated(new Date(savedTime));
      } catch (err) {
        console.warn("Failed to load plant status:", err);
      } finally {
        setLoadedLastUpdated(true);
      }
    };

    loadPlantStatus();
  }, [userId, setPlantStatus, setLastUpdated]);

  // Save plant status cache
  useEffect(() => {
    if (!userId) return;

    if (plantStatus?.status) {
      AsyncStorage.setItem(`plantStatus_${userId}`, JSON.stringify(plantStatus));
    }

    if (lastUpdated) {
      AsyncStorage.setItem(
        `plantStatusLastUpdated_${userId}`,
        lastUpdated.toISOString()
      );
    }
  }, [plantStatus, lastUpdated, userId]);

  // Time ago
  useEffect(() => {
    if (!loadedLastUpdated) return;
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

  /* TANK fetch (callable) */
  const fetchTankData = async () => {
    if (!userId) return;

    try {
      const { data: deviceRow, error: deviceErr } = await supabase
        .from("tank_data")
        .select("distance_empty, distance_full")
        .eq("user_id", userId)
        .maybeSingle();

      if (deviceErr && deviceErr.code !== "PGRST116") {
        console.warn("water_device fetch warning:", deviceErr);
      }

      let calibEmpty = deviceRow?.distance_empty ?? null;
      let calibFull = deviceRow?.distance_full ?? null;

      const { data: rows, error } = await supabase
        .from("tank_data")
        .select("tank_level, distance_empty, distance_full, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Supabase tank_data fetch error:", error);
        return;
      }

      if (!rows || rows.length < 2) {
        setWaterHistory([]);
        setWaterAnalysis(null);
        return;
      }

      if (calibEmpty == null || calibFull == null) {
        const withCalib = rows.find(
          (r) => r.distance_empty != null && r.distance_full != null
        );
        if (withCalib) {
          calibEmpty = withCalib.distance_empty;
          calibFull = withCalib.distance_full;
        }
      }

      const history = rows
        .map((r) => {
          const levelPct = derivePercentLevel({
            rawLevel: r.tank_level,
            distanceEmpty: r.distance_empty ?? calibEmpty,
            distanceFull: r.distance_full ?? calibFull,
          });

          const ts = new Date(r.created_at).getTime();
          if (levelPct == null || !Number.isFinite(ts)) return null;
          return { level: levelPct, timestamp: ts };
        })
        .filter(Boolean)
        .reverse();

      if (history.length < 2) {
        setWaterHistory([]);
        setWaterAnalysis(null);
        return;
      }

      const analysis = analyzeWaterContainer(history);
      const last = history[history.length - 1];

      setWaterHistory(history);
      setWaterAnalysis({
        currentLevel: Number(last.level).toFixed(1),
        usageRate: analysis.usageRate,
        timeToEmpty: analysis.timeToEmpty,
        refillNeeded: analysis.refillNeeded,
        insight: analysis.insight,
      });
    } catch (err) {
      console.error("Error fetching tank data:", err);
    }
  };

  /* TANK POLLING  */
  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await fetchTankData();
    };

    run();
    tankIntervalRef.current = setInterval(run, 5000);

    return () => {
      mounted = false;
      if (tankIntervalRef.current) clearInterval(tankIntervalRef.current);
      tankIntervalRef.current = null;
    };
  }, [userId]);

  /* MANUAL REFRESH */
  const onRefresh = async () => {
    try {
      setRefreshing(true);

      // stop interval to avoid overlapping fetches
      if (tankIntervalRef.current) {
        clearInterval(tankIntervalRef.current);
        tankIntervalRef.current = null;
      }

      await Promise.all([fetchWeather(), fetchTankData()]);
    } catch (e) {
      console.error("Refresh error:", e);
    } finally {
      // resume polling
      if (userId && !tankIntervalRef.current) {
        tankIntervalRef.current = setInterval(fetchTankData, 5000);
      }
      setRefreshing(false);
    }
  };

  // Save WiFi + user info to ESP32
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

      const uid = session.user.id;
      const accessToken = session.access_token;

      const res = await fetch(`${ESP32_HOST}/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          ssid: wifiSSID,
          password: wifiPass,
          user_id: uid,
          access_token: accessToken,
        }).toString(),
      });

      const data = await res.json();

      if (data.status === "ok") {
        if (useExisting && existingEmptyDistance != null) {
          try {
            const emptyRes = await fetch(`${ESP32_HOST}/useExistingEmpty`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                distance_empty: String(existingEmptyDistance),
              }).toString(),
            });
            await emptyRes.json();

            setCalibrationStep(2);
            setCalibrationMessage(
              "Existing empty tank value loaded. Fill your tank for full calibration."
            );
          } catch (err) {
            console.error("Failed to send existing empty to ESP32:", err);
            Alert.alert("Error", "Failed to send existing tank value to ESP32.");
          }
        } else {
          setCalibrationStep(1);
          setCalibrationMessage(
            "Please make sure your tank is empty before calibration."
          );
        }
      } else {
        Alert.alert("Error", "ESP32 did not confirm configuration.");
      }
    } catch (err) {
      console.error("Config error:", err);
      Alert.alert(
        "Error",
        "Could not reach ESP32. Make sure you're connected to its hotspot."
      );
    }

    setLoading(false);
  };

  const checkCalibrationStatus = async () => {
    try {
      const session = await getSession();
      if (!session) throw new Error("User not authenticated");
      const uid = session.user.id;

      const { data, error } = await supabase
        .from("tank_data")
        .select("distance_empty")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") console.warn(error);

      if (data && data.distance_empty != null) {
        setExistingCalibrationDistance(data.distance_empty);
        setExistingCalibrationModalVisible(true);
      } else {
        setUseExisting(false);
        setExistingEmptyDistance(null);
        setSkipEmptyStep(false);
        setCalibrationStep(0);
        setCalibrationMessage(
          "Enter your WiFi name and password to connect to the device."
        );
        setModalVisible(true);
      }
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Offline Mode",
        "You are offline. Calibration will proceed via ESP32 only."
      );
      setCalibrationStep(0);
      setModalVisible(true);
    }
  };

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

        if (emptyData.status === "empty calibrated") {
          setCalibrationStep(2);
          setCalibrationMessage(
            "Empty calibration done! Fill your tank for full calibration."
          );
        } else {
          Alert.alert(
            "Calibration Error",
            "ESP32 did not confirm empty calibration."
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

        if (fullData.status === "full calibrated") {
          setTimeout(() => {
            setIsCalibrating(false);
            setCalibrationStep(3);
            setCalibrationMessage(
              "Tank successfully calibrated! You may now reconnect your phone to the internet."
            );
          }, 3500);
        } else {
          setIsCalibrating(false);
          Alert.alert(
            "Calibration Error",
            "ESP32 did not confirm full calibration."
          );
        }
      }
    } catch (error) {
      console.error("Calibration error:", error);
      setIsCalibrating(false);
      Alert.alert(
        "Calibration Error",
        "Check your ESP32 connection and try again."
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

      if (data.status === "calibration confirmed") {
        await markDeviceActive();
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
        "Failed to reset calibration. Check your ESP32 connection."
      );
    }
  };

  const renderForecastCard = (item, idx) => {
    const dt = new Date(item.dt * 1000);
    let hours = dt.getHours();
    const minutes = dt.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const timeStr = `${hours}${
      minutes ? `:${String(minutes).padStart(2, "0")}` : ""
    } ${ampm}`;

    const main = item.weather?.[0]?.main ?? "Clouds";
    const iconName = weatherIcons[main] || "cloud-outline";

    return (
      <View key={idx} style={styles.forecastCard}>
        <Text style={styles.forecastTime}>{timeStr}</Text>
        <View style={styles.forecastIconWrap}>
          <Ionicons name={iconName} size={20} color={stylesTokens.primary} />
        </View>
        <Text style={styles.forecastTemp}>{Math.round(item.main.temp)}°</Text>
        <Text style={styles.forecastDesc}>{main}</Text>
      </View>
    );
  };

  const waterPct = useMemo(() => {
    const n = toNumber(waterAnalysis?.currentLevel);
    return n == null ? 0 : clamp(n, 0, 100);
  }, [waterAnalysis]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER: Weather + Refresh */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderTitle}>{t.weatherSectionTitle}</Text>

          <TouchableOpacity
            style={[styles.refreshBtn, refreshing && { opacity: 0.7 }]}
            onPress={onRefresh}
            disabled={refreshing}
            activeOpacity={0.85}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={stylesTokens.primary} />
            ) : (
              <Ionicons name="refresh" size={18} color={stylesTokens.primary} />
            )}
            <Text style={styles.refreshText}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* WEATHER CARD */}
        <View style={styles.hero}>
          <View style={styles.heroMain}>
            <View style={{ flex: 1 }}>
              <View style={styles.heroTempRow}>
                {loading ? (
                  <ActivityIndicator size="small" color={stylesTokens.primary} />
                ) : (
                  <Text style={styles.heroTemp}>{tempText}</Text>
                )}
              </View>

              <Text style={styles.heroDesc}>
                {weatherMain ? weatherMain : "—"}
                {weatherDesc ? ` • ${weatherDesc}` : ""}
              </Text>

              <View style={styles.heroLocRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={stylesTokens.muted}
                />
                <Text style={styles.heroLocation}>
                  {city || t.unknownLocation}
                </Text>
              </View>
            </View>
          </View>

          {loading ? null : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forecastRow}
            >
              {forecast.map(renderForecastCard)}
            </ScrollView>
          )}
        </View>

        {/* WATER ANALYSIS CARD */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Water Container</Text>
            <Text style={styles.sectionHint}>Usage prediction</Text>
          </View>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.88}
            onPress={() => setWaterModalVisible(true)}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons
                name="water-outline"
                size={22}
                color={stylesTokens.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>{t.wateranaylsis}</Text>
              <Text style={styles.actionSubtitle}>
                {waterAnalysis ? waterAnalysis.insight : "Collecting data..."}
              </Text>

              <View style={styles.chipsRow}>
                <View style={styles.chip}>
                  <Ionicons
                    name="speedometer-outline"
                    size={14}
                    color={stylesTokens.muted}
                  />
                  <Text style={styles.chipText}>
                    {waterAnalysis ? `${waterAnalysis.usageRate}%/hr` : "—"}
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Ionicons
                    name="hourglass-outline"
                    size={14}
                    color={stylesTokens.muted}
                  />
                  <Text style={styles.chipText}>
                    {waterAnalysis ? waterAnalysis.timeToEmpty : "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${waterPct}%` },
                      waterPct <= 10 && { backgroundColor: stylesTokens.danger },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {waterAnalysis ? `${Math.round(waterPct)}%` : "—"}
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={stylesTokens.muted}
            />
          </TouchableOpacity>
        </View>

        {/* CROP HEALTH */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t.cropHealthStatus}</Text>
            <Text style={styles.sectionHint}>Status summary</Text>
          </View>

          <View style={styles.healthCard}>
            <View
              style={[
                styles.actionIconWrap,
                { backgroundColor: "rgba(36,153,30,0.12)" },
              ]}
            >
              <Ionicons
                name="leaf-outline"
                size={22}
                color={stylesTokens.success}
              />
            </View>

            <View style={{ flex: 1 }}>
              {plantStatus?.status ? (
                <>
                  <Text
                    style={[
                      styles.healthTitle,
                      { color: plantStatus.statusColor || stylesTokens.text },
                    ]}
                  >
                    {plantStatus.status}
                  </Text>
                  <Text style={styles.healthSub}>
                    Last updated {timeAgo || "Just now"}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.healthTitle}>{t.nostatusyet}</Text>
                  <Text style={styles.healthSub}>{t.viewCropMonitorStatus}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* CALIBRATION MODAL */}
        <Modal
          animationType="fade"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Water Sensor Calibration</Text>
                  <Text style={styles.modalSub}>
                    Step {Math.max(1, calibrationStep + 1)} of 4
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  hitSlop={10}
                  style={styles.modalIconBtn}
                >
                  <Ionicons name="close" size={20} color={stylesTokens.text} />
                </TouchableOpacity>
              </View>

              {calibrationStep === 0 && (
                <>
                  <Text style={styles.modalBodyText}>
                    {calibrationMessage ||
                      "Enter your WiFi name and password to connect to the device."}
                  </Text>

                  <View style={styles.field}>
                    <Text style={styles.label}>WiFi Name (SSID)</Text>
                    <TextInput
                      placeholder="e.g. PLDTHOMEFIBR..."
                      value={wifiSSID}
                      onChangeText={setWifiSSID}
                      style={styles.input}
                      placeholderTextColor="#9aa3af"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>WiFi Password</Text>
                    <View style={styles.passwordWrap}>
                      <TextInput
                        placeholder="Enter password"
                        value={wifiPass}
                        onChangeText={setWifiPass}
                        secureTextEntry={!showPassword}
                        style={[styles.input, { paddingRight: 44 }]}
                        placeholderTextColor="#9aa3af"
                      />
                      <TouchableOpacity
                        style={styles.eyeBtn}
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={10}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off" : "eye"}
                          size={18}
                          color={stylesTokens.muted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                    onPress={saveConfig}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Proceed</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {calibrationStep === 1 && !skipEmptyStep && (
                <>
                  <Text style={styles.modalBodyText}>
                    {calibrationMessage || t.emptyTankStepMessage}
                  </Text>

                  <View style={styles.row}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => setModalVisible(false)}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.secondaryBtnText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        isCalibrating && { opacity: 0.7 },
                      ]}
                      onPress={handleCalibrate}
                      disabled={isCalibrating}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryBtnText}>
                        {isCalibrating ? "Calibrating..." : "Calibrate Empty"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {calibrationStep === 2 && (
                <>
                  <Text style={styles.modalBodyText}>
                    {calibrationMessage || t.fullTankStepMessage}
                  </Text>

                  <View style={styles.tankWrap}>
                    <View style={styles.tank}>
                      <Animated.View
                        style={[styles.waterFill, { height: fillHeight }]}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => setCalibrationStep(1)}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.secondaryBtnText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        isCalibrating && { opacity: 0.7 },
                      ]}
                      onPress={handleCalibrate}
                      disabled={isCalibrating}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.primaryBtnText}>
                        {isCalibrating ? "Calibrating..." : "Calibrate Full"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {calibrationStep === 3 && (
                <>
                  <Text style={styles.modalBodyText}>
                    {calibrationMessage || t.calibrationSuccess}
                  </Text>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleConfirmCalibration}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.primaryBtnText}>{t.confirm}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.ghostBtn, { marginTop: 10 }]}
                    onPress={handleRecalibrate}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.ghostBtnText}>Reset & recalibrate</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* WATER ANALYSIS MODAL */}
        <Modal
          animationType="fade"
          transparent
          visible={waterModalVisible}
          onRequestClose={() => setWaterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{t.wateranaylsis}</Text>
                  <Text style={styles.modalSub}>Latest readings</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setWaterModalVisible(false)}
                  hitSlop={10}
                  style={styles.modalIconBtn}
                >
                  <Ionicons name="close" size={20} color={stylesTokens.text} />
                </TouchableOpacity>
              </View>

              {waterAnalysis ? (
                <>
                  <View style={styles.notice}>
                    <View style={styles.noticeIcon}>
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color={stylesTokens.primary}
                      />
                    </View>
                    <Text style={styles.noticeText}>
                      {waterAnalysis.insight || "Analyzing..."}
                    </Text>
                  </View>

                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>Current Level</Text>
                      <Text style={styles.metricValue}>
                        {waterAnalysis.currentLevel}%
                      </Text>
                    </View>

                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>Usage Rate</Text>
                      <Text style={styles.metricValue}>
                        {waterAnalysis.usageRate}% / hr
                      </Text>
                    </View>

                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>Time to Empty</Text>
                      <Text style={styles.metricValue}>
                        {waterAnalysis.timeToEmpty}
                      </Text>
                    </View>

                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>Refill Needed</Text>
                      <Text
                        style={[
                          styles.metricValue,
                          waterAnalysis.refillNeeded && {
                            color: stylesTokens.danger,
                          },
                        ]}
                      >
                        {waterAnalysis.refillNeeded ? "YES" : "NO"}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 18 }}>
                  <Text style={styles.collectTitle}>Collecting data...</Text>
                  <ActivityIndicator size="small" color={stylesTokens.primary} />
                  <Text style={styles.collectHint}>
                    {t.collecthint} (distance_empty/full) {t.collecthint2}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 12 }]}
                onPress={() => setWaterModalVisible(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryBtnText}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* EXISTING CALIBRATION MODAL */}
        <Modal
          animationType="fade"
          transparent
          visible={existingCalibrationModalVisible}
          onRequestClose={() => setExistingCalibrationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>
                    {t.existingCalibrationFound}
                  </Text>
                  <Text style={styles.modalSub}>{t.calibrationdistance}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setExistingCalibrationModalVisible(false)}
                  hitSlop={10}
                  style={styles.modalIconBtn}
                >
                  <Ionicons name="close" size={20} color={stylesTokens.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalBodyText}>{t.useOrResetExisting}</Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setUseExisting(true);
                    setExistingEmptyDistance(existingCalibrationDistance);
                    setSkipEmptyStep(true);
                    setCalibrationStep(0);
                    setCalibrationMessage("Enter WiFi name and password");
                    setExistingCalibrationModalVisible(false);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={styles.secondaryBtnText}>Use existing</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: stylesTokens.danger },
                  ]}
                  onPress={() => {
                    setUseExisting(false);
                    setExistingEmptyDistance(null);
                    setSkipEmptyStep(false);
                    setCalibrationStep(0);
                    setCalibrationMessage("Enter WiFi name and password");
                    setExistingCalibrationModalVisible(false);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryBtnText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: stylesTokens.bg },
  container: { flex: 1, backgroundColor: stylesTokens.bg },
  content: {
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "android" ? 10 : 12,
    paddingBottom: 16,
  },

  /* Header: Weather + Refresh */
  pageHeader: {
    paddingVertical: 10,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  pageHeaderTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: stylesTokens.text,
    letterSpacing: 0.2,
  },
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
    fontWeight: "900",
    color: stylesTokens.text,
  },

  /* Weather card */
  hero: {
    padding: 14,
    backgroundColor: stylesTokens.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: stylesTokens.border,
    shadowColor: stylesTokens.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 3,
  },
  heroMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroTempRow: { marginTop: 4, minHeight: 34, justifyContent: "center" },
  heroTemp: { fontSize: 34, fontWeight: "900", color: stylesTokens.text },
  heroDesc: {
    marginTop: 4,
    fontSize: 13,
    color: stylesTokens.muted,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  heroLocRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroLocation: { fontSize: 12, color: stylesTokens.muted, fontWeight: "700" },

  /* Forecast */
  forecastRow: { paddingTop: 14, paddingBottom: 2, gap: 10 },
  forecastCard: {
    width: 110,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#F2F6FF",
    borderWidth: 1,
    borderColor: "rgba(42,118,232,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  forecastTime: {
    fontSize: 12,
    fontWeight: "900",
    color: stylesTokens.text,
    marginBottom: 8,
  },
  forecastIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: "900",
    color: stylesTokens.text,
    marginTop: 8,
  },
  forecastDesc: {
    fontSize: 12,
    color: stylesTokens.muted,
    marginTop: 2,
    fontWeight: "700",
  },

  /* Sections */
  section: { paddingTop: 16 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: stylesTokens.text },
  sectionHint: { fontSize: 12, color: stylesTokens.muted, fontWeight: "800" },

  /* Cards */
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: stylesTokens.card,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: stylesTokens.border,
    shadowColor: stylesTokens.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 2,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(42,118,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(42,118,232,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 14, fontWeight: "900", color: stylesTokens.text },
  actionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: stylesTokens.muted,
    fontWeight: "700",
  },

  chipsRow: { flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F3F5FA",
    borderWidth: 1,
    borderColor: stylesTokens.border,
  },
  chipText: { fontSize: 12, color: stylesTokens.text, fontWeight: "800" },

  progressRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: stylesTokens.primary,
  },
  progressText: { fontSize: 12, color: stylesTokens.muted, fontWeight: "900" },

  healthCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: stylesTokens.card,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: stylesTokens.border,
    shadowColor: stylesTokens.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 2,
  },
  healthTitle: { fontSize: 14, fontWeight: "900", color: stylesTokens.text },
  healthSub: {
    marginTop: 4,
    fontSize: 12,
    color: stylesTokens.muted,
    fontWeight: "700",
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  modalSheet: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: stylesTokens.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: stylesTokens.border,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 7,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  modalIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F3F5FA",
    borderWidth: 1,
    borderColor: stylesTokens.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: stylesTokens.text },
  modalSub: {
    marginTop: 4,
    fontSize: 12,
    color: stylesTokens.muted,
    fontWeight: "800",
  },
  modalBodyText: {
    marginTop: 12,
    fontSize: 13,
    color: stylesTokens.muted,
    lineHeight: 18,
    fontWeight: "700",
  },

  field: { marginTop: 14 },
  label: {
    fontSize: 12,
    fontWeight: "900",
    color: stylesTokens.text,
    marginBottom: 8,
  },

  input: {
    width: "100%",
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: "#F3F5FA",
    borderWidth: 1,
    borderColor: stylesTokens.border,
    color: stylesTokens.text,
    fontWeight: "700",
  },

  passwordWrap: { position: "relative", justifyContent: "center" },
  eyeBtn: {
    position: "absolute",
    right: 12,
    height: 48,
    justifyContent: "center",
  },

  row: { flexDirection: "row", gap: 10, marginTop: 16 },

  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: stylesTokens.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F3F5FA",
    borderWidth: 1,
    borderColor: stylesTokens.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: stylesTokens.text, fontWeight: "900", fontSize: 14 },

  ghostBtn: {
    height: 46,
    borderRadius: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: stylesTokens.border,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: { color: stylesTokens.text, fontWeight: "900", fontSize: 13 },

  tankWrap: { alignItems: "center", justifyContent: "center", marginTop: 14 },
  tank: {
    width: 130,
    height: 180,
    borderWidth: 2,
    borderColor: "rgba(42,118,232,0.55)",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#EAF2FF",
    justifyContent: "flex-end",
  },
  waterFill: { backgroundColor: "rgba(42,118,232,0.55)", width: "100%" },

  notice: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#F2F6FF",
    borderWidth: 1,
    borderColor: "rgba(42,118,232,0.16)",
  },
  noticeIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: stylesTokens.text,
    fontWeight: "800",
  },

  metricsGrid: { marginTop: 12, gap: 10 },
  metricCard: {
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#F3F5FA",
    borderWidth: 1,
    borderColor: stylesTokens.border,
  },
  metricLabel: { fontSize: 12, color: stylesTokens.muted, fontWeight: "900" },
  metricValue: {
    marginTop: 6,
    fontSize: 16,
    color: stylesTokens.text,
    fontWeight: "900",
  },

  collectTitle: {
    fontWeight: "900",
    color: stylesTokens.text,
    marginBottom: 10,
    fontSize: 14,
  },
  collectHint: {
    marginTop: 10,
    fontSize: 12,
    color: stylesTokens.muted,
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "700",
  },
});