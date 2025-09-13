// screens/AboutApp.js
import React from "react";
import { View, Text, StyleSheet, Image, Linking, ScrollView } from "react-native";

export default function AboutApp() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      <Image source={require("../assets/Oksi.png")} style={styles.logo} />

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Oksi</Text>
        <Text style={styles.version}>Version: 1.0.0</Text>
        <Text style={styles.description}>
          OKSI is a smart urban farming assistant designed to help you monitor and automate watering for your crops.
          Using real-time sensor data.
        </Text>
      </View>

      {/* Developer Info */}
      <View style={styles.section}>
        <Text style={styles.label}>Developed by:</Text>
        <Text style={styles.text}>The Oksi Team</Text>

        <Text style={styles.label}>Support:</Text>
        <Text
          style={styles.link}
          onPress={() => Linking.openURL("mailto:qsbaysic@tip.edu.ph")}
        >
          qsbaysic@tip.edu.ph
        </Text>
      </View>

      {/* Policies */}
      <View style={styles.section}>
        <Text
          style={styles.link}
          onPress={() => Linking.openURL("https://yourdomain.com/privacy")}
        >
          [View Privacy Policy]
        </Text>

        <Text
          style={styles.link}
          onPress={() => Linking.openURL("https://yourdomain.com/terms")}
        >
          [View Terms of Service]
        </Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Thank you for choosing OKSI—making urban farming easier, smarter, and more sustainable!
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
    backgroundColor: "#fff",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000",
  },
  version: {
    fontSize: 14,
    marginBottom: 10,
    color: "#555",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    color: "#000",
  },
  text: {
    fontSize: 14,
    color: "#444",
  },
  link: {
    fontSize: 14,
    color: "#3F51B5",
    marginTop: 8,
    textDecorationLine: "underline",
  },
  footer: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginTop: 20,
  },
  copy: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 20,
  },
});
