import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Editable fields
  const [username, setUsername] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");

  

  // Load session reliably on React Native and keep it in sync
useEffect(() => {
  let mounted = true;
  const load = async () => {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const u = data?.session?.user ?? null;
    if (!mounted) return;
    setUser(u);

    if (u) {
      // fetch profile row
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("id", u.id)
        .single();
      if (!error && prof) {
        setUsername(prof.username || "");
        setEmail(u.email || "");
        setContactNumber(u.user_metadata?.contact_number || "");
      } else {
        // fallback to metadata if no profile yet
        setUsername(u.user_metadata?.username || "");
        setEmail(u.email || "");
        setContactNumber(u.user_metadata?.contact_number || "");
      }
    }
    setLoading(false);
  };

  const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
    if (!mounted) return;
    const u = session?.user ?? null;
    setUser(u);
  });

  load();
  return () => {
    mounted = false;
    sub.subscription.unsubscribe();
  };
}, []);

const handleSave = async () => {
  if (!user) return;
  setLoading(true);
  try {
    // Update only profiles.username
    const { error: profErr } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id, // must match the auth user id
          username: username || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profErr) throw profErr;

    Alert.alert("Success", "Username updated successfully.");
    setEditing(false);
  } catch (e) {
    console.error("Update profile error:", e);
    Alert.alert("Error", e.message || "Failed to update username.");
  } finally {
    setLoading(false);
  }
};


  const handleAvatarUpload = async () => {
    try {
      if (!user) {
        Alert.alert("Not signed in");
        return;
      }

      // Permissions for iOS
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow photo library access to upload an avatar."
        );
        return;
      }

      // Open picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        Alert.alert("Error", "No image selected.");
        return;
      }

// Prepare file as Uint8Array instead of blob
const resp = await fetch(uri);
const arrayBuffer = await resp.arrayBuffer();
const fileName = `${uuidv4()}.jpg`;
const filePath = `avatars/${user.id}/${fileName}`;

// Upload to Supabase Storage
const { error: uploadError } = await supabase.storage
  .from("avatars")
  .upload(filePath, new Uint8Array(arrayBuffer), {
    contentType: "image/jpeg",
  });

if (uploadError) throw uploadError;

// Get public URL
const { data: urlData, error: urlErr } = supabase.storage
  .from("avatars")
  .getPublicUrl(filePath);

if (urlErr) throw urlErr;

const publicUrl = urlData.publicUrl;

// Update profile row
const { error: profErr } = await supabase
  .from("profiles")
  .upsert({ id: user.id, avatar_url: publicUrl }, { onConflict: "id" });

if (profErr) throw profErr;

// Update auth metadata too
await supabase.auth.updateUser({
  data: { avatar_url: publicUrl },
});

// Update local state
setUser((prev) =>
  prev ? { ...prev, user_metadata: { ...prev.user_metadata, avatar_url: publicUrl } } : prev
);


      Alert.alert("Success", "Profile picture updated!");
    } catch (e) {
      console.error("Avatar upload error:", e);
      Alert.alert("Error", e.message || "Failed to upload image.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Text>No user logged in</Text>
      </View>
    );
  }

  const avatarUri =
    user.user_metadata?.avatar_url || "https://placekitten.com/200/200";

  return (
    <View style={styles.container}>
      {/* Profile Picture */}
      <View style={styles.profileContainer}>
        <Image source={{ uri: avatarUri }} style={styles.profileImage} />
        <TouchableOpacity style={styles.cameraIcon} onPress={handleAvatarUpload}>
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
        {editing ? (
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />
        ) : (
          <Text style={styles.value}>{username || "No username"}</Text>
        )}

        {/* Contact Number */}
        <View style={styles.row}>
          <Ionicons name="call" size={22} color="#333" />
          <Text style={styles.label}>Contact Number</Text>
        </View>
        {editing ? (
          <TextInput
            style={styles.input}
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />
        ) : (
          <Text style={styles.value}>{contactNumber || "N/A"}</Text>
        )}

        {/* Email Address */}
        <View style={styles.row}>
          <Ionicons name="mail" size={22} color="#333" />
          <Text style={styles.label}>Email Address</Text>
        </View>
        {editing ? (
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        ) : (
          <Text style={styles.value}>{email}</Text>
        )}

        {/* Buttons */}
        {editing ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditing(false)}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.saveText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(true)}
          >
            <Ionicons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", paddingTop: 40 },
  profileContainer: { alignItems: "center", marginBottom: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#eee" },
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
  row: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  label: { marginLeft: 8, fontWeight: "600", fontSize: 14, color: "#333" },
  value: { marginLeft: 30, fontSize: 15, color: "#000" },
  input: {
    marginLeft: 30,
    fontSize: 15,
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#666",
    paddingVertical: 2,
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
  buttonRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20 },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F44336",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  saveText: { color: "#fff", marginLeft: 5, fontWeight: "600" },
});