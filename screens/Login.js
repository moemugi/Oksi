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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import * as WebBrowser from "expo-web-browser";
import "react-native-url-polyfill/auto";


WebBrowser.maybeCompleteAuthSession();


export default function Login({ navigation, setOtpVerified }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});


  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isCodeModalVisible, setIsCodeModalVisible] = useState(false);
  const [otpError, setOtpError] = useState("");


  const hiddenInputRef = useRef(null);
  const [isOtpInfoModalVisible, setIsOtpInfoModalVisible] = useState(false); // NEW
 
  const focusOtpInput = () => {
    if (!hiddenInputRef.current) return;
      hiddenInputRef.current.blur();
        setTimeout(() => {
      hiddenInputRef.current.focus();
        }, 50);
    };


  useEffect(() => {
    if (isCodeModalVisible) {
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 200);
    }
  }, [isCodeModalVisible]);


  //NEW - OTP TIMER & RESEND
  const OTP_VALIDITY_SECONDS = 60;
  const [otpTimer, setOtpTimer] = useState(OTP_VALIDITY_SECONDS);
  const [canResendOtp, setCanResendOtp] = useState(false);


 


  useEffect(() => {
  if (!isCodeModalVisible) return;


  if (otpTimer === 0) {
    setCanResendOtp(true);
    return;
  }


  const interval = setInterval(() => {
    setOtpTimer((prev) => prev - 1);
  }, 1000);


  return () => clearInterval(interval);
}, [isCodeModalVisible, otpTimer]);




  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");


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
        const otpVerified =
          (await AsyncStorage.getItem("otpVerified")) === "true";
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user ?? null;


        if (user && otpVerified) {
          navigation.replace("MainApp");
        } else {
          setOtpVerified(false);
          setIsCodeModalVisible(false);
          setGeneratedCode("");
          setVerificationCode("");
          await AsyncStorage.setItem("otpVerified", "false");
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


  // Step 1: Send OTP without logging in
  // Step 1: Send OTP
  const handleSendOTP = async () => {
    setOtpTimer(OTP_VALIDITY_SECONDS);
    setCanResendOtp(false);
    setVerificationCode("");


    if (!validateForm()) return;
    if (!username.includes("@")) {
      setErrors({ general: "Please enter a valid email address." });
      return;
    }


    setLoading(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);


      const response = await fetch(
        "https://vesmleiliahbfqpcjtix.functions.supabase.co/send-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: username, code }),
        },
      );
      const result = await response.json();


      if (result.success) {
        setIsOtpInfoModalVisible(true); // Show OTP info modal instead of alert
      } else {
        setErrors({
          general: "Failed to send verification code. Please try again.",
        });
      }
    } catch (err) {
      console.error(err);
      setErrors({ general: "Network error. Please try again later." });
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyOTPAndSignIn = async () => {
    if (verificationCode !== generatedCode) {
      setOtpError("Incorrect verification code." );
      setVerificationCode("");
      return;
    }
    setOtpError("");
    setLoading(true);
    try {
      const {
        error,
        data: { session },
      } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });


      if (error || !session?.user) {
        setErrors({ general: "Invalid email or password." });


        setIsCodeModalVisible(false);
        setVerificationCode("");
        setGeneratedCode("");
        setOtpTimer(0);
        return;
      }


      // OTP verified
      setOtpVerified(true);
      await AsyncStorage.setItem("otpVerified", "true");


      navigation.replace("MainApp");   }
      catch (err) {
        setErrors({ general: "Something went wrong during login."});
      } finally {
        setLoading(false);
   
      };
     
     
    // After setting OTP verified and checking welcome
    console.log("===== LOGIN FLOW =====");
    console.log("Generated OTP:", generatedCode);
    console.log("Entered OTP:", verificationCode);
    console.log("OTP verified:", true);
    console.log("hasSeenWelcome in storage before navigation:", hasSeenWelcome);
  };


 


  return (
    <View style={styles.container}>
      <Image source={require("../assets/Oksi.png")} style={styles.logo} />
      <Text style={styles.subtitle}>Sign in to your account</Text>


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
      <TouchableOpacity onPress={() => setIsForgotModalVisible(true)}>
        <Text style={styles.forgot}>Forgot your password?</Text>
      </TouchableOpacity>


      {/* Sign In */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSendOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Sending..." : "Sign in"}
        </Text>
      </TouchableOpacity>


      {/* OTP Info Modal */}
      {isOtpInfoModalVisible && (
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <Text style={modalStyles.title}>OTP Sent</Text>
            <Text style={modalStyles.subtitle}>
              A verification code has been sent to {username}.
            </Text>
            <TouchableOpacity
              style={modalStyles.button}
              onPress={() => {
                 setVerificationCode("");          // clear old OTP
                 setOtpError("");
                 setErrors({});                    // clear errors
                 setOtpTimer(OTP_VALIDITY_SECONDS); // reset timer
                 setCanResendOtp(false);           // disable resend
                 setIsOtpInfoModalVisible(false);  // close info modal
                 setIsCodeModalVisible(true);      // Open OTP verification modal
              }}
            >
              <Text style={modalStyles.buttonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


      {/* OTP Verification Modal */}
      {isCodeModalVisible && (
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <Text style={modalStyles.title}>Enter Login Verification Code</Text>
            <Text style={modalStyles.subtitle}>
              Access your email to view the code
            </Text>


            {/* OTP BOXES */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={focusOtpInput} //  show keyboard
              style={otpStyles.container}
            >
              <View style={otpStyles.container}>
            {[...Array(6)].map((_, index) => (
              <View key={index} style={otpStyles.box}>
                <Text style={otpStyles.boxText}>
                  {verificationCode[index] || ""}
                </Text>
              </View>
            ))}
              </View>
            </TouchableOpacity>




          {/* OTP ERROR MESSAGE */}
              {otpError ? (
                <Text style={{ color: "red", fontSize: 12, marginBottom: 8 }}>
                  {otpError}
                </Text>
              ) : null}






          {/* Hidden input */}
          <TextInput
            ref={hiddenInputRef}
            style={otpStyles.hiddenInput}
            keyboardType="number-pad"
            value={verificationCode}
            onChangeText={(text) =>{
              setOtpError("");
              setVerificationCode(text.replace(/[^0-9]/g, "").slice(0, 6));
            }}
          />


           
            {/* OTP Timer */}
            <Text style={{ fontSize: 12, color: "#555", marginBottom: 10 }}>
              {otpTimer > 0
                ? `OTP expires in ${otpTimer}s`
                : "OTP expired"}
            </Text>


            {/* Resend OTP */}
            {canResendOtp && (
              <TouchableOpacity
                onPress={handleSendOTP}
                style={{ marginBottom: 15 }}
              >
                <Text style={{ color: "#2e6b34", fontWeight: "bold" }}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
            )}




            <TouchableOpacity
              style={[
                modalStyles.button,
                (verificationCode.length !== 6 || otpTimer === 0) && { opacity: 0.5 },
              ]}
              disabled={verificationCode.length !== 6 || otpTimer === 0}
              onPress={handleVerifyOTPAndSignIn}
            >
              <Text style={modalStyles.buttonText}>Verify & Login</Text>
            </TouchableOpacity>




            <TouchableOpacity
              onPress={() => setIsCodeModalVisible(false)}
              style={modalStyles.cancelButton}
            >
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


      {/* Forgot Password Modal */}
      {isForgotModalVisible && (
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <Text style={modalStyles.title}>Reset Password</Text>
            <Text style={modalStyles.subtitle}>
              Enter your registered email
            </Text>


            <TextInput
              style={modalStyles.input}
              placeholder="Email address"
              placeholderTextColor="#888"
              value={forgotEmail}
              onChangeText={(text) => {
                setForgotEmail(text);
                setForgotError("");
                setForgotMessage("");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />


            {forgotError && (
              <Text style={{ color: "red", fontSize: 12, marginBottom: 8 }}>
                {forgotError}
              </Text>
            )}
            {forgotMessage && (
              <Text style={{ color: "green", fontSize: 12, marginBottom: 8 }}>
                {forgotMessage}
              </Text>
            )}


            <TouchableOpacity
              style={modalStyles.button}
              onPress={async () => {
                if (!forgotEmail) {
                  setForgotError("Please enter your email address.");
                  return;
                }
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(
                    forgotEmail,
                    {
                      redirectTo: "oksi://reset-password",
                    },
                  );
                  if (error) setForgotError(error.message);
                  else
                    setForgotMessage(
                      "Password reset email sent! Check your inbox.",
                    );
                } catch (err) {
                  setForgotError("Failed to send reset link. Try again later.");
                }
              }}
            >
              <Text style={modalStyles.buttonText}>Send Reset Link</Text>
            </TouchableOpacity>


            <TouchableOpacity
              onPress={() => setIsForgotModalVisible(false)}
              style={modalStyles.cancelButton}
            >
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


      <Text style={styles.signupText}>
        Don’t have an account?{" "}
        <Text
          style={styles.signupLink}
          onPress={() => navigation.navigate("Signup")}
        >
          Sign up here
        </Text>
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
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


const otpStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15,
  },
  box: {
    width: 38,
    height: 50,
    borderWidth: 1,
    borderColor: "#3f7945ff",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  boxText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});



