import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Linking,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";

export default function AboutApp() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO */}
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Image source={require("../assets/Oksi.png")} style={styles.logo} />
        </View>

        <Text style={styles.appName}>OKSI</Text>
        <Text style={styles.tagline}>Your Smart Urban Farming Companion</Text>

        <View style={styles.metaRow}>
          <View style={styles.pill}>
            <MaterialIcons name="verified" size={14} color="#16a34a" />
            <Text style={styles.pillText}>Version 1.0.0</Text>
          </View>
          <View style={styles.pill}>
            <MaterialIcons name="eco" size={14} color="#16a34a" />
            <Text style={styles.pillText}>Urban Farming</Text>
          </View>
        </View>
      </View>

      {/* CARDS */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: "#EAF7EF" }]}>
            <MaterialIcons name="info" size={18} color="#16a34a" />
          </View>
          <Text style={styles.sectionTitle}>About OKSI</Text>
        </View>

        <Text style={styles.description}>
          OKSI is your smart urban farming assistant. Monitor real-time sensor
          data, automate watering, and grow healthier crops with less effort.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: "#EAF2FF" }]}>
            <FontAwesome name="users" size={16} color="#2563eb" />
          </View>
          <Text style={styles.sectionTitle}>Team & Support</Text>
        </View>

        <Text style={styles.label}>Developed by</Text>
        <Text style={styles.text}>The OKSI Team</Text>

        <Text style={styles.label}>Support</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => Linking.openURL("mailto:agropulse053@gmail.com")}
          style={styles.actionRow}
        >
          <View style={styles.actionLeft}>
            <MaterialIcons name="email" size={18} color="#0f172a" />
            <Text style={styles.actionText}>agropulse053@gmail.com</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: "#FFF3E6" }]}>
            <MaterialIcons name="gavel" size={18} color="#f59e0b" />
          </View>
          <Text style={styles.sectionTitle}>Legal</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => Linking.openURL("https://yourdomain.com/privacy")}
          style={styles.actionRow}
        >
          <View style={styles.actionLeft}>
            <MaterialIcons name="policy" size={18} color="#0f172a" />
            <Text style={styles.actionText}>Privacy Policy</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => Linking.openURL("https://yourdomain.com/terms")}
          style={styles.actionRow}
        >
          <View style={styles.actionLeft}>
            <MaterialIcons name="description" size={18} color="#0f172a" />
            <Text style={styles.actionText}>Terms of Service</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Thank you for choosing OKSI—making urban farming easier, smarter, and
          more sustainable.
        </Text>
        <Text style={styles.copy}>&copy; 2025 OKSI. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },
  container: {
    padding: 18,
    paddingBottom: 28,
  },

  hero: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: { elevation: 6 },
    }),
  },
  logo: {
    width: 72,
    height: 72,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EAF7EF",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
      },
      android: { elevation: 3 },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    marginTop: 10,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  text: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },

  actionRow: {
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginTop: 10,
  },

  footer: {
    marginTop: 18,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  footerText: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  copy: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 10,
    textAlign: "center",
  },
});