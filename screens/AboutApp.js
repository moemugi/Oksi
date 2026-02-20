import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Linking,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";

export default function AboutApp() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require("../assets/Oksi.png")} style={styles.logo} />
      <Text style={styles.tagline}>Your Smart Urban Farming Companion</Text>

      {/* About Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="info" size={24} color="#4CAF50" />
          <Text style={styles.sectionTitle}>About Oksi</Text>
        </View>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.description}>
          OKSI is your smart urban farming assistant. Monitor real-time sensor
          data, automate watering, and grow healthier crops effortlessly!
        </Text>
      </View>

      {/* Team Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome name="users" size={24} color="#2196F3" />
          <Text style={styles.sectionTitle}>Team & Support</Text>
        </View>
        <Text style={styles.label}>Developed by</Text>
        <Text style={styles.text}>The Oksi Team</Text>

        <Text style={styles.label}>Support</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL("mailto:qsbaysic@tip.edu.ph")}
        >
          <Text style={styles.link}>qsbaysic@tip.edu.ph</Text>
        </TouchableOpacity>
      </View>

      {/* Legal Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="gavel" size={24} color="#FF9800" />
          <Text style={styles.sectionTitle}>Legal</Text>
        </View>
        <TouchableOpacity
          onPress={() => Linking.openURL("https://yourdomain.com/privacy")}
        >
          <Text style={styles.link}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL("https://yourdomain.com/terms")}
        >
          <Text style={styles.link}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Thank you for choosing OKSI—making urban farming easier, smarter, and
        more sustainable!
      </Text>
      <Text style={styles.copy}>&copy; 2025 OKSI. All rights reserved.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F0F4F8",
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: "contain",
    marginBottom: 10,
  },
  tagline: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4CAF50",
    marginBottom: 25,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
    color: "#1B1B1B",
  },
  version: {
    fontSize: 13,
    color: "#777",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    color: "#333",
  },
  text: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  link: {
    fontSize: 14,
    color: "#2196F3",
    marginTop: 6,
    textDecorationLine: "underline",
  },
  footer: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 25,
    paddingHorizontal: 10,
  },
  copy: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 30,
  },
});
