import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(true);
  const [editing, setEditing] = useState(false);

  const [username, setUsername] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");

  const avatarUri = useMemo(() => {
    return user?.user_metadata?.avatar_url || "https://placekitten.com/200/200";
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setBusy(true);

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const u = data?.session?.user ?? null;
        if (!mounted) return;

        setUser(u);

        if (u) {
          // pull profile table with username + avatar_url + fallback to auth metadata
          const { data: prof, error: profErr } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", u.id)
            .single();

          if (!mounted) return;

          const uname = prof?.username ?? u.user_metadata?.username ?? "";
          const contact = u.user_metadata?.contact_number ?? "";
          const mail = u.email ?? "";

          setUsername(uname || "");
          setContactNumber(contact || "");
          setEmail(mail || "");
        }
      } catch (e) {
        console.error("Profile load error:", e);
        Alert.alert("Error", e?.message || "Failed to load profile.");
      } finally {
        if (mounted) setBusy(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    load();

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // for saving the profile info
  const handleSave = async () => {
    if (!user) return;

    if (!username.trim()) {
      Alert.alert("Required", "Username cannot be empty.");
      return;
    }

    setBusy(true);
    try {
      const { error: profErr } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            username: username.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profErr) throw profErr;

      Alert.alert("Saved", "Username updated successfully.");
      setEditing(false);
    } catch (e) {
      console.error("Update profile error:", e);
      Alert.alert("Error", e?.message || "Failed to update username.");
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      if (!user) {
        Alert.alert("Not signed in");
        return;
      }

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Please allow photo library access to upload an avatar.");
        return;
      }

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

      setBusy(true);

      const resp = await fetch(uri);
      const arrayBuffer = await resp.arrayBuffer();

      const fileName = `${uuidv4()}.jpg`;
      const filePath = `avatars/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, new Uint8Array(arrayBuffer), {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData, error: urlErr } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (urlErr) throw urlErr;

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error("Failed to generate public URL.");

      const { error: profErr } = await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() }, { onConflict: "id" });

      if (profErr) throw profErr;

      // keep the data synch
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, avatar_url: publicUrl },
      });
      if (metaErr) throw metaErr;

      // for profile update locally
      setUser((prev) =>
        prev
          ? { ...prev, user_metadata: { ...(prev.user_metadata || {}), avatar_url: publicUrl } }
          : prev
      );

      Alert.alert("Success", "Profile picture updated.");
    } catch (e) {
      console.error("Avatar upload error:", e);
      Alert.alert("Error", e?.message || "Failed to upload image.");
    } finally {
      setBusy(false);
    }
  };

  if (busy && !user) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Ionicons name="person-circle-outline" size={56} color="#94A3B8" />
        <Text style={styles.emptyTitle}>No user logged in</Text>
        <Text style={styles.emptySub}>Please sign in to view your profile.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <TouchableOpacity activeOpacity={0.9} style={styles.avatarAction} onPress={handleAvatarUpload}>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{username || "Unnamed User"}</Text>
            <Text style={styles.metaText}>{email || "No email"}</Text>

            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Ionicons name="call-outline" size={14} color="#334155" />
                <Text style={styles.chipText}>{contactNumber || "No contact"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* details Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Account details</Text>

            {!editing ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setEditing(true)} style={styles.editPill}>
                <Ionicons name="pencil" size={16} color="#FFFFFF" />
                <Text style={styles.editPillText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editPillGhost}>
                <Ionicons name="create-outline" size={16} color="#334155" />
                <Text style={styles.editPillGhostText}>Editing</Text>
              </View>
            )}
          </View>

          {/* Username */}
          <Field
            icon="person-outline"
            label="Username"
            value={username}
            editing={editing}
            onChangeText={setUsername}
            placeholder="Enter username"
          />

          {/* Contact Number */}
          <Field
            icon="call-outline"
            label="Contact Number"
            value={contactNumber}
            editing={editing}
            onChangeText={setContactNumber}
            placeholder="Enter contact number"
            keyboardType="phone-pad"
          />

          {/* Email */}
          <Field
            icon="mail-outline"
            label="Email Address"
            value={email}
            editing={editing}
            onChangeText={setEmail}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {editing && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.actionBtn, styles.actionGhost]}
                onPress={() => {
                  // revert basic fields to current user values
                  setUsername(user?.user_metadata?.username || username);
                  setEmail(user?.email || email);
                  setContactNumber(user?.user_metadata?.contact_number || contactNumber);
                  setEditing(false);
                }}
                disabled={busy}
              >
                <Text style={styles.actionGhostText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={handleSave}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.actionPrimaryText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Busy overlay  */}
        {busy && (
          <View style={styles.busyOverlay} pointerEvents="none">
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* small reusable field (same file, no extra components) */
function Field({
  icon,
  label,
  value,
  editing,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldTop}>
        <View style={styles.fieldLabelRow}>
          <Ionicons name={icon} size={18} color="#334155" />
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>
      </View>

      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          style={styles.input}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || "—"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F7FB" },
  content: { padding: 16, paddingBottom: 26 },
  center: { alignItems: "center", justifyContent: "center" },

  /* empty */
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#0F172A" },
  emptySub: { marginTop: 6, fontSize: 13, color: "#64748B", fontWeight: "600" },

  /* header */
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  h1: { fontSize: 28, fontWeight: "900", color: "#0F172A", letterSpacing: 0.2 },
  h2: { marginTop: 6, fontSize: 13, lineHeight: 18, color: "#64748B", fontWeight: "600" },

  signOutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  /* avatar card */
  avatarCard: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    shadowColor: "#0B1220",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    marginBottom: 12,
    alignItems: "center",
  },
  avatarWrap: { width: 86, height: 86, borderRadius: 28, position: "relative" },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    backgroundColor: "#E2E8F0",
  },
  avatarAction: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 2,
  },
  nameText: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  metaText: { marginTop: 4, fontSize: 12.5, color: "#64748B", fontWeight: "600" },

  chipRow: { marginTop: 10, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },
  chipText: { fontSize: 12.5, fontWeight: "800", color: "#334155" },

  /* details card */
  card: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    shadowColor: "#0B1220",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    position: "relative",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: { fontSize: 14.5, fontWeight: "900", color: "#0F172A" },

  editPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#0F172A",
  },
  editPillText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12.5, letterSpacing: 0.2 },

  editPillGhost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },
  editPillGhostText: { color: "#334155", fontWeight: "900", fontSize: 12.5 },

  field: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },
  fieldTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldLabel: { fontSize: 12.5, fontWeight: "900", color: "#334155" },
  fieldValue: { marginTop: 8, fontSize: 14, fontWeight: "800", color: "#0F172A" },

  input: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },

  actionsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  actionBtn: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionGhost: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  actionGhostText: { fontSize: 13, fontWeight: "900", color: "#0F172A" },

  actionPrimary: { backgroundColor: "#2563EB" },
  actionPrimaryText: { fontSize: 13, fontWeight: "900", color: "#FFFFFF" },

  busyOverlay: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});