// screens/ProfileScreen.js
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* Profile Picture */}
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: "https://placekitten.com/200/200" }} // Replace with your image URI
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.cameraIcon}>
          <Ionicons name="camera" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        {/* Username */}
        <View style={styles.row}>
          <Ionicons name="person-circle" size={22} color="#333" />
          <Text style={styles.label}>Username</Text>
        </View>
        <Text style={styles.value}>Stephen Curry</Text>

        {/* Contact Number */}
        <View style={styles.row}>
          <Ionicons name="call" size={22} color="#333" />
          <Text style={styles.label}>Contact Number</Text>
        </View>
        <Text style={styles.value}>09993403436</Text>

        {/* Email Address */}
        <View style={styles.row}>
          <Ionicons name="mail" size={22} color="#333" />
          <Text style={styles.label}>Email Address</Text>
        </View>
        <Text style={styles.value}>mycurry18@gmail.com</Text>

        {/* Edit Button */}
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 40,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 10,
    backgroundColor: "#333",
    borderRadius: 20,
    padding: 5,
  },
  infoCard: {
    backgroundColor: "#C7EDC7",
    width: "85%",
    borderRadius: 12,
    padding: 20,
    position: "relative",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  label: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
  },
  value: {
    marginLeft: 30,
    fontSize: 15,
    color: "#000",
  },
  editButton: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "#3B82F6",
    padding: 10,
    borderRadius: 30,
    elevation: 3,
  },
});
