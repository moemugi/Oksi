import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  AppState,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { supabase } from "../lib/supabase";

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const PLACEHOLDER_AVATAR =
    "https://vesmleiliahbfqpcjtix.supabase.co/storage/v1/object/public/avatars/avatars/placeholder.png";

  // validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => subscription.remove();
  }, []);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validatePassword = (value) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      value,
    );

  const validateForm = () => {
    let newErrors = {};

    if (!username || username.length < 3 || username.length > 25) {
      newErrors.username = "Username must be between 3 and 25 characters.";
    }

    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email.";
    }

    if (!validatePassword(password)) {
      newErrors.password =
        "Password must be at least 8 characters and include lowercase, uppercase, number, and special character.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const signUpWithEmail = async () => {
    setErrors({});
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Check if username exists
      const { data: existingUser, error: usernameCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (usernameCheckError) throw usernameCheckError;

      if (existingUser) {
        setErrors((prev) => ({
          ...prev,
          username: "This username is already taken. Please choose another.",
        }));
        setLoading(false);
        return;
      }

      // 2. Create account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, avatar_url: PLACEHOLDER_AVATAR },
        },
      });

      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("already registered")) {
          setErrors((prev) => ({
            ...prev,
            email:
              "This email is already registered. Please log in or use a different email.",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            email: error.message || "Unable to sign up with this email.",
          }));
        }
        setLoading(false);
        return;
      }

      const user = data.user;
      if (!user) {
        // Email confirmation enabled → stop here
        setSuccessModalVisible(true);
        setLoading(false);
        return;
      }

      // 3. Insert into profiles
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        username,
        avatar_url: PLACEHOLDER_AVATAR,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        // Account is already created in auth.users
        setErrors((prev) => ({
          ...prev,
          username:
            "Your account was created, but this username is taken. Please log in and update your profile.",
        }));
        setLoading(false);
        return;
      }

      setSuccessModalVisible(true);
    } catch (err) {
      console.error(err);

      //likely a network issue or unexpected server error
      setErrors((prev) => ({
        ...prev,
        email: "Something went wrong. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Image source={require("../assets/Oksi.png")} style={styles.logo} />
      <Text style={styles.subtitle}>Create your Account</Text>

      {/* Inputs */}
      <View
        style={[
          styles.inputContainer,
          errors.username && { borderColor: "red", borderWidth: 1 },
        ]}
      >
        <Icon name="person" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
      </View>
      {errors.username && (
        <Text style={styles.errorText}>{errors.username}</Text>
      )}

      <View
        style={[
          styles.inputContainer,
          errors.email && { borderColor: "red", borderWidth: 1 },
        ]}
      >
        <Icon name="email" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <View style={styles.inputContainer}>
        <Icon name="phone" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Contact Number"
          value={contact}
          onChangeText={setContact}
          style={styles.input}
          keyboardType="phone-pad"
        />
      </View>

      <View
        style={[
          styles.inputContainer,
          errors.password && { borderColor: "red", borderWidth: 1 },
        ]}
      >
        <Icon name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon
            name={showPassword ? "visibility-off" : "visibility"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>
      {errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      <View
        style={[
          styles.inputContainer,
          errors.confirmPassword && { borderColor: "red", borderWidth: 1 },
        ]}
      >
        <Icon name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Icon
            name={showConfirmPassword ? "visibility-off" : "visibility"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>
      {errors.confirmPassword && (
        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={signUpWithEmail}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Signing up..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      {}
      <Modal
        transparent={true}
        animationType="fade"
        visible={successModalVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sign Up Successful!</Text>
            {}

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: "#4CAF50", marginTop: 15 },
              ]}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.replace("Login");
              }}
            >
              <Text style={styles.modalButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 20,
  },
  backButton: { alignSelf: "flex-start", marginTop: 40, marginBottom: 10 },
  logo: { width: 200, height: 150, resizeMode: "contain", marginBottom: 20 },
  subtitle: { fontSize: 14, color: "#444", marginBottom: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: "100%",
  },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 10 },
  button: {
    backgroundColor: "#2e6b34",
    paddingVertical: 12,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  errorText: {
    color: "red",
    fontSize: 12,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalText: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  modalButtonText: { color: "white", fontWeight: "bold" },
});
