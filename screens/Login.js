import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  AppState,
  Alert,
  Keyboard 
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import * as WebBrowser from "expo-web-browser";
import "react-native-url-polyfill/auto";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

WebBrowser.maybeCompleteAuthSession();

export default function Login({ navigation, setOtpVerified }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);

  const MAX_LOGIN_ATTEMPTS = 3;
  const LOGIN_TIMEOUT_SECONDS = 120;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});



  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLoginDisabled, setIsLoginDisabled] = useState(false);
  const [timeoutRemaining, setTimeoutRemaining] = useState(0);

    useEffect(() => {
  const { data } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        navigation.replace("PasswordScreen");
      }
    }
  );

  return () => {
    data.subscription.unsubscribe();
  };
}, []);

  const handleLogin = async () => {
  if (!validateForm()) return;

  setLoading(true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (error || !data?.session) {
  console.log("LOGIN ERROR:", error);

  const attempts = loginAttempts + 1;
  setLoginAttempts(attempts);

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    setIsLoginDisabled(true);
    setTimeoutRemaining(LOGIN_TIMEOUT_SECONDS);
    setErrors({ general: error?.message || "Too many failed attempts." });
  } else {
    setErrors({ general: error?.message || "Invalid email or password." });
  }

  setLoading(false);
  return;
}

    setLoginAttempts(0);
    setIsLoginDisabled(false);
    setTimeoutRemaining(0);

    navigation.replace("MainApp");

  } catch (err) {
    setErrors({ general: "Something went wrong." });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  if (!isLoginDisabled || timeoutRemaining <= 0) return;

  const timer = setInterval(() => {
    setTimeoutRemaining(prev => {
      if (prev <= 1) {
        setIsLoginDisabled(false);
        setLoginAttempts(0);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [isLoginDisabled, timeoutRemaining]);



  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);


  // AppState refresh
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => subscription.remove();
  }, []);

  // Reset OTP and check session
  useEffect(() => {
  const checkLoginState = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        navigation.replace("MainApp");
      }
    } catch (err) {
      console.log("checkLoginState error:", err);
    }
  };

  checkLoginState();
}, []);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!username) newErrors.username = "You cannot leave the email blank";
    if (!password) newErrors.password = "Password must not be entered blank.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



const handleForgotPassword = async () => {
  if (!forgotEmail) {
    setForgotError("Please enter your email.");
    return;
  }

  setForgotError("");
  setForgotSuccess("");

  const { error } = await supabase.auth.resetPasswordForEmail(
    forgotEmail,
    {
      redirectTo: "oksi://reset-password",
    }
  );

  if (error) {
    setForgotError(error.message);
    return;
  }

  setForgotSuccess("A password reset link has been sent to your email.");

  setTimeout(() => {
    setIsForgotModalVisible(false);
    setForgotSuccess("");
  }, 3000);
};


  return (
<KeyboardAwareScrollView
          style={{ flex: 1, backgroundColor: "#fff" }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 120, 
          }}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={125}   
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
    <View style={styles.innerContainer}>
      <Image source={require("../assets/Oksi.png")} style={styles.logo} />
      <Text style={styles.messagesubtitle}>Sign in to your account</Text>

      {/* Email */}
      <View
        style={[styles.inputContainer, errors.username && styles.inputError]}
      >
        <Icon name="person" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setErrors({ ...errors, username: "" });
          }}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      {errors.username && (
        <Text style={styles.errorText}>{errors.username}</Text>
      )}

      {/* Password */}
      <View
        style={[styles.inputContainer, errors.password && styles.inputError]}
      >
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
      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      {/* Forgot Password */}
      <TouchableOpacity
        onPress={() => {
          setForgotEmail("");
          setForgotError("");
          setIsForgotModalVisible(true);
        }}
      >
        <Text style={styles.forgot}>Forgot your password?</Text>
      </TouchableOpacity>

      {/* Sign In */}
      <TouchableOpacity
        style={[
          styles.button,
          isLoginDisabled && { opacity: 0.5 },
        ]}
        onPress={handleLogin}
        disabled={loading || isLoginDisabled}
      >
        <Text style={styles.buttonText}>
          {isLoginDisabled
            ? `Try again in ${timeoutRemaining}s`
            : loading
            ? "Signing in..."
            : "Sign in"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.signupText}>
        Don’t have an account?{" "}
        <Text
          style={styles.signupLink}
          onPress={() => navigation.navigate("Signup")}
        >
          Sign up here
        </Text>
      </Text>


      <Text style={styles.signupText}>
        <Text>
        </Text>
      </Text>

  </View>


  {/* Forgot Password Email Input Modal */}
      {isForgotModalVisible && (
        <View style={[
                  modalStyles.overlay,
                  keyboardVisible && { justifyContent: "flex-start", paddingTop: 300 }
                ]}
              >
              <View style={modalStyles.container}>
            <Text style={modalStyles.title}>Forgot Password</Text>
            <Text style={modalStyles.subtitle}>Enter your registered email</Text>

            <TextInput
              style={modalStyles.input}
              placeholder="Email address"
              placeholderTextColor="#888"
              value={forgotEmail}
              onChangeText={(text) => {
                setForgotEmail(text);
                setForgotError("");
                
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            {forgotError && <Text style={{ color: "red", fontSize: 12, marginBottom: 8 }}>{forgotError}</Text>}
            {forgotSuccess && (< Text style={{ color: "green", fontSize: 12, marginBottom: 10, textAlign: "center",}}>{forgotSuccess}</Text>)}

          
            <TouchableOpacity
                style={modalStyles.button}
                onPress={handleForgotPassword}
              >
                <Text style={modalStyles.buttonText}>
                  Send Reset Link
                </Text>
            </TouchableOpacity>
          </View>
        </View>
        )}


</KeyboardAwareScrollView>
  );
}


const styles = StyleSheet.create({
innerContainer: {
  flex: 1,
  alignItems: "center",
  paddingHorizontal: 20,
  paddingTop: 100, 
  paddingBottom: 20,
  backgroundColor: "#ffffff",
},

container: {
  flexGrow: 1,
  backgroundColor: "#ffffff",
  alignItems: "center",
  paddingHorizontal: 20,
  paddingTop: 100,
},
  
  messagesubtitle: { fontSize: 14, marginBottom: 15, color: "#2e6b34", fontWeight: "bold" },

  logo: { width: 200, height: 200, resizeMode: "contain", marginBottom: 20 },
  subtitle: { fontSize: 14, color: "#444", marginBottom: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: "100%",
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: { borderColor: "red", backgroundColor: "#ffffffff" },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 10, color: "#000" },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  forgot: { fontSize: 12, color: "#999", marginBottom: 20 },
  button: {
    backgroundColor: "#2e6b34",
    paddingVertical: 12,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  signupText: { fontSize: 12, color: "#555" },
  signupLink: { color: "#2e6b34", fontWeight: "bold" },
});

const modalStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    width: "100%",
    padding: 10,
    textAlign: "center",
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#000",
  },
  button: {
    backgroundColor: "#2e6b34",
    paddingVertical: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  cancelButton: { marginTop: 10 },
  cancelText: { color: "red" },
});


