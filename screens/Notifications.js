import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { SensorContext } from "../context/SensorContext";
import * as ExpoNotifications from "expo-notifications";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

// --- Create notification channel ---
const createNotificationChannel = async () => {
  if (Platform.OS === "android") {
    const soundFile = "alert.mp3"; 
    await ExpoNotifications.setNotificationChannelAsync("alerts", {
      name: "Alerts",
      importance: ExpoNotifications.AndroidImportance.HIGH,
      sound: soundFile,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
};

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: false,
  }),
});

export default function Notifications() {
  const { notifications, setNotifications, selectedSensors } =
    useContext(SensorContext);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [userId, setUserId] = useState(null);

  // --- 1️⃣ Load current user ID ---
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        loadUserNotifications(session.user.id);
      }
    })();
  }, []);

  // --- 2️⃣ Load notifications for this user ---
  const loadUserNotifications = async (uid) => {
    try {
      const stored = await AsyncStorage.getItem(`notifications_${uid}`);
      if (stored) setNotifications(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // --- 3️⃣ Save notifications for this user ---
  const saveUserNotifications = async (data) => {
    if (!userId) return;
    try {
      await AsyncStorage.setItem(`notifications_${userId}`, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save notifications:", err);
    }
  };

  useEffect(() => {
    createNotificationChannel();
  }, []);

  // --- 4️⃣ Filter and schedule notifications ---
  useEffect(() => {
    if (!userId) return;

    const filtered = notifications.filter(
      (notif) => notif.type && selectedSensors[notif.type]
    );
    setFilteredNotifications(filtered);

    filtered.forEach(async (notif) => {
      if (!notif.sent) {
        try {
          await ExpoNotifications.scheduleNotificationAsync({
            content: {
              title: notif.title,
              body: notif.message,
              sound: "default",
            },
            trigger: null,
            channelId: "alerts",
          });

          const updated = notifications.map((n) =>
            n.id === notif.id ? { ...n, sent: true } : n
          );
          setNotifications(updated);
          saveUserNotifications(updated);
        } catch (err) {
          console.error("Notification schedule error:", err);
        }
      }
    });
  }, [notifications, selectedSensors, userId]);

  const dismissNotification = (id) => {
    const updated = notifications.filter((notif) => notif.id !== id);
    setNotifications(updated);
    saveUserNotifications(updated);
  };

  const clearAll = () => {
    setNotifications([]);
    saveUserNotifications([]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.time}>{item.time}</Text>
        <TouchableOpacity onPress={() => dismissNotification(item.id)}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.message}>{item.message}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {filteredNotifications.length > 0 && (
        <View style={styles.header}>
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearAll}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {filteredNotifications.length === 0 ? (
        <Text style={styles.emptyText}>No notifications at the moment.</Text>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 15 },
  clearAll: { fontSize: 14, color: "black", fontWeight: "bold" },
  emptyText: { textAlign: "center", marginTop: 30, fontSize: 16, color: "#666" },
  card: { backgroundColor: "#cfe8d5", borderRadius: 15, padding: 15, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "bold", flex: 1, color: "#000" },
  time: { fontSize: 14, color: "#333", marginRight: 8 },
  closeBtn: { fontSize: 18, color: "#000", paddingLeft: 7 },
  message: { fontSize: 15, color: "#000", marginTop: 6 },
});
