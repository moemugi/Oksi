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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import useLanguage from "../hooks/useLanguage";

/* NOTIFICATION HANDLER - MUST show alert for lock screen / banner */
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/* PERMISSION + ANDROID CHANNEL (VIBRATION ENABLED) */
const setupNotifications = async () => {
  try {
    const { status: existingStatus } =
      await ExpoNotifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await ExpoNotifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return false;

    if (Platform.OS === "android") {
      await ExpoNotifications.setNotificationChannelAsync("alerts", {
        name: "Alerts",
        importance: ExpoNotifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 400, 200, 400], // ✅ STRONG VIBRATION
        lockscreenVisibility:
          ExpoNotifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    return true;
  } catch (e) {
    console.error("setupNotifications error:", e);
    return false;
  }
};

/* FIRE REAL LOCAL NOTIFICATION (NO TRIGGER ERROR) */
const fireLocalNotification = async (title, body) => {
  try {
    const ok = await setupNotifications();
    if (!ok) return;

    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        channelId: "alerts",
      },
      trigger: {
        type: ExpoNotifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        repeats: false,
      },
    });
  } catch (e) {
    console.error("fireLocalNotification error:", e);
  }
};

export default function Notifications() {
  const { t } = useLanguage();
  const { notifications, setNotifications, selectedSensors } =
    useContext(SensorContext);

  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [userId, setUserId] = useState(null);

  /* LOAD USER */
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

  /* LOAD STORED NOTIFS */
  const loadUserNotifications = async (uid) => {
    try {
      const stored = await AsyncStorage.getItem(`notifications_${uid}`);
      if (stored) setNotifications(JSON.parse(stored));
    } catch (err) {
      console.error("Load notifications error:", err);
    }
  };

  /* SAVE NOTIFS */
  const saveUserNotifications = async (data) => {
    if (!userId) return;
    try {
      await AsyncStorage.setItem(
        `notifications_${userId}`,
        JSON.stringify(data)
      );
    } catch (err) {
      console.error("Save notifications error:", err);
    }
  };

  /* INIT NOTIFS */
  useEffect(() => {
    setupNotifications();
  }, []);

  /* FILTER + FIRE OS NOTIFS */
  useEffect(() => {
    if (!userId) return;

    const filtered = notifications.filter(
      (notif) => notif.type && selectedSensors?.[notif.type]
    );

    setFilteredNotifications(filtered);

    (async () => {
      const unsent = filtered.filter((n) => !n.sent);
      if (unsent.length === 0) return;

      for (const notif of unsent) {
        await fireLocalNotification(notif.title, notif.message);
      }

      const updated = notifications.map((n) =>
        unsent.some((u) => u.id === n.id) ? { ...n, sent: true } : n
      );

      setNotifications(updated);
      saveUserNotifications(updated);
    })();
  }, [notifications, selectedSensors, userId]);

  /* ACTIONS */
  const dismissNotification = (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveUserNotifications(updated);
  };

  const clearAll = () => {
    setNotifications([]);
    saveUserNotifications([]);
  };

  /* UI */
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
            <Text style={styles.clearAll}>
              {t?.clearAll ?? "Clear all"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {filteredNotifications.length === 0 ? (
        <Text style={styles.emptyText}>
          {t?.noNotifications ?? "No notifications"}
        </Text>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 15 },
  clearAll: { fontSize: 14, fontWeight: "bold" },
  emptyText: { textAlign: "center", marginTop: 30, fontSize: 16, color: "#666" },
  card: {
    backgroundColor: "#cfe8d5",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "bold", flex: 1 },
  time: { fontSize: 14, color: "#333", marginRight: 8 },
  closeBtn: { fontSize: 18, paddingLeft: 7 },
  message: { fontSize: 15, marginTop: 6 },
});