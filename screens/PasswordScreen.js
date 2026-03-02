import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { supabase } from "../lib/supabase";

export default function PasswordScreen({ navigation }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  // Listen for PASSWORD_RECOVERY deep link/session
  useEffect(() => {
    const getRecoverySession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (session && session.user) {
          setEmail(session.user.email); // fill email from session
        } else {
          Alert.alert("Error", "No recovery session found.");
          navigation.replace("Login");
        }
      } catch (err) {
        console.error(err);
        navigation.replace("Login");
      }
    };

    getRecoverySession();
  }, []);

  const validatePassword = (pwd) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pwd);

  const handleSubmit = async () => {
    setErrors({});

    if (!password || !confirmPassword) {
      setErrors({ general: "Both fields are required." });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    if (!validatePassword(password)) {
      setErrors({
        password:
          "Password must be 8+ chars, include uppercase, number, and special char.",
      });
      return;
    }

    setLoading(true);

    try {
      // Reset password using Supabase recovery session
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrors({ general: error.message });
        return;
      }

      Alert.alert(
        "Success",
        "Password updated successfully.",
        [{ text: "OK", onPress: () => navigation.replace("Login") }]
      );

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.messagesubtitle}>Reset Your Password</Text>

      {/* Password Input */}
      <View style={[styles.inputContainer, errors.password && styles.inputError]}>
        <Icon name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors({ ...errors, password: "" });
          }}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? "visibility-off" : "visibility"} size={20} color="#666" />
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      {/* Confirm Password Input */}
      <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
        <Icon name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setErrors({ ...errors, confirmPassword: "" });
          }}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon name={showConfirmPassword ? "visibility-off" : "visibility"} size={20} color="#666" />
        </TouchableOpacity>
      </View>
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  messagesubtitle: { fontSize: 14, marginBottom: 15, color: "#2e6b34", fontWeight: "bold" },
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", padding: 20 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f2f2f2", borderRadius: 8, paddingHorizontal: 10, marginBottom: 15, width: "100%", borderWidth: 1, borderColor: "transparent" },
  inputError: { borderColor: "red", backgroundColor: "#fff" },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 10, color: "#000" },
  errorText: { color: "red", fontSize: 12, marginBottom: 10, alignSelf: "flex-start" },
  button: { backgroundColor: "#2e6b34", paddingVertical: 12, borderRadius: 25, width: "100%", alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});