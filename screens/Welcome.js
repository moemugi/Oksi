// screens/WelcomeScreen.js
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Swiper from "react-native-swiper";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }) {
  const slides = [
    {
      image: require("../assets/OksiMainLogo.png"),
      title: "Welcome to Oksi",
      text: "Your partner in smart, sustainable urban farming! Discover how our automated system helps you monitor and nurture your Okra and Siling labuyo crops with ease.",
    },
    {
      image: require("../assets/welcome2.png"),
      title: "Real-Time Monitoring & Control",
      text: "Keep your garden thriving with real-time updates on soil moisture, temperature, humidity, light intensity, and rainfall.",
    },
    {
      image: require("../assets/welcome3.png"),
      title: "Effortless Automation & Notifications",
      text: "OKSI waters when needed. Smart alerts. Easy setup. Get growing!",
    },
  ];

  const handleFinishWelcome = async () => {
    try {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
      navigation.replace("Login"); // go to Login screen next
      console.log("Welcome flag set → navigating to Login");
    } catch (err) {
      console.error("Failed to set Welcome flag:", err);
    }
  };

  return (
    <Swiper loop={false} showsPagination={true} activeDotColor="#2e6b34">
      {slides.map((slide, index) => (
        <View key={index} style={styles.slide}>
          {/* Skip button in top right */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleFinishWelcome}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <Image source={slide.image} style={styles.image} />
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.text}>{slide.text}</Text>

          {index === slides.length - 1 && (
            <TouchableOpacity
              style={styles.button}
              onPress={handleFinishWelcome}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </Swiper>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  skipButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    color: "#2e6b34",
    fontWeight: "bold",
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    resizeMode: "contain",
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2e6b34",
    marginBottom: 10,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginHorizontal: 10,
  },
  button: {
    backgroundColor: "#2e6b34",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
