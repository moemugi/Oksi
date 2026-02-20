// App.js
import React, { useEffect, useState, useRef } from "react";
import "react-native-reanimated";
import {
  View,
  Animated,
  StyleSheet,
  Image,
  Text,
  SafeAreaView,
  Appearance,
} from "react-native";
import LoginScreen from "./screens/Login";
import SignupScreen from "./screens/Signup";
import WelcomeScreen from "./screens/Welcome";
import TabNavigator from "./navigation/TabNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { SensorProvider } from "./context/SensorContext";
import { Asset } from "expo-asset";
import { supabase } from "./lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

/* ---------------- Drawer UI ---------------- */
function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <SafeAreaView style={{ alignItems: "center", padding: 20 }}>
        <Image
          source={{ uri: "https://via.placeholder.com/80" }}
          style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 10 }}
        />
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>John Doe</Text>
      </SafeAreaView>

      <DrawerItem
        label={({ color }) => <Text style={{ color, fontSize: 16 }}>Home</Text>}
        onPress={() => props.navigation.navigate("HomeTabs")}
        icon={() => (
          <Image
            source={require("./assets/OksiMainLogo.png")}
            style={{ width: 20, height: 20 }}
          />
        )}
      />
    </DrawerContentScrollView>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: "#4CAF50",
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      <Drawer.Screen name="HomeTabs" component={TabNavigator} />
    </Drawer.Navigator>
  );
}

/* ---------------- App Root ---------------- */
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [initialRoute, setInitialRoute] = useState("Login");

const fadeAnim = useRef(new Animated.Value(1)).current; // start fully visible
const scaleAnim = useRef(new Animated.Value(0.8)).current;


  /* Splash */
useEffect(() => {
  Asset.loadAsync([require("./assets/OksiMainLogo.png")]);

  // Fade-in and scale-in
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }),
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }),
  ]).start();

  // Show splash for 2 seconds, then fade out
  const timer = setTimeout(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,       // fade out to transparent
      duration: 500,    // 0.5 seconds
      useNativeDriver: true,
    }).start(() => setShowSplash(false)); // hide splash after fade
  }, 2000);

  return () => clearTimeout(timer);
}, []);

  /* Force light mode */
  useEffect(() => {
    Appearance.setColorScheme("light");
  }, []);

  /* Restore session, OTP, and Welcome flag */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log("===== RESTORE SESSION =====");

        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Supabase session:", session);

        const otp = await AsyncStorage.getItem("otpVerified");
        console.log("otpVerified from storage:", otp);

        const hasSeenWelcome = await AsyncStorage.getItem("hasSeenWelcome");
        console.log("hasSeenWelcome from storage:", hasSeenWelcome);

        // Combined check log
        console.log(
          `Welcome screen seen? → ${hasSeenWelcome === "true" ? "YES" : "NO"}`,
        );

        if (!hasSeenWelcome) {
          console.log("No Welcome flag found → showing Welcome screen");
          setInitialRoute("Welcome");
        } else if (session?.user && otp === "true") {
          console.log("User logged in and OTP verified → MainApp");
          setInitialRoute("MainApp");
        } else {
          console.log("Default case → Login screen");
          setInitialRoute("Login");
        }

        setAuthChecked(true);
      } catch (err) {
        console.error("Error restoring session:", err);
      }
    };

    restoreSession();
  }, []);

  const handleOtpVerified = async () => {
    setOtpVerified(true);
    await AsyncStorage.setItem("otpVerified", "true");
  };

  /* Splash screen */
  if (!authChecked || showSplash) {
    return (
      <View style={styles.splash}>
        <Animated.Image
          source={require("./assets/OksiMainLogo.png")}
          style={[
            styles.logo,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
          resizeMode="contain"
        />
      </View>
    );
  }
  return (
    <SensorProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute} // <-- Set the first screen dynamically
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen {...props} setOtpVerified={handleOtpVerified} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="MainApp">
            {(props) => <DrawerNavigator {...props} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SensorProvider>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
