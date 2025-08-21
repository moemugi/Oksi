// navigation/MainNavigator.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity, // ✅ Correct import
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem
} from "@react-navigation/drawer";
import HomeScreen from "../screens/Home";
import CropMonitorScreen from "../screens/CropMonitor";
import NotificationsScreen from "../screens/Notifications";
import StatisticsScreen from "../screens/Statistics";
import ProfileScreen from "../screens/Profile";
import AboutApp from "../screens/AboutApp";
import { Ionicons } from "@expo/vector-icons";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function Tabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: "left",
        headerStyle: { backgroundColor: "#4CAF50" },
        headerTintColor: "#fff",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Crop Monitor") {
            iconName = focused ? "leaf" : "leaf-outline";
          } else if (route.name === "Notifications") {
            iconName = focused ? "notifications" : "notifications-outline";
          } else if (route.name === "Statistics") {
            iconName = focused ? "stats-chart" : "stats-chart-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "gray",

        // Left menu icon
        headerLeft: () => (
          <Ionicons
            name="menu"
            size={26}
            color="#fff"
            style={{ marginLeft: 15 }}
            onPress={() => navigation.openDrawer()}
          />
        ),

        // Right profile section
        headerRight: () => (
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: "https://via.placeholder.com/40" }}
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>John Doe</Text>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Crop Monitor" component={CropMonitorScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />

            {/* ✅ Profile is part of Tabs, but hidden */}
<Tab.Screen
  name="Profile"
  component={ProfileScreen}
  options={{
    tabBarItemStyle: { display: "none" }, // ✅ hides icon & label, no gap
    headerShown: true,
    headerTitle: "Profile Settings",
  }}
/>

<Tab.Screen
  name="AboutApp"   // 👈 fixed: remove the space
  component={AboutApp}
  options={{
    tabBarItemStyle: { display: "none" }, 
    headerShown: true,
    headerTitle: "About the App", // 👈 cleaner header title
  }}
/>



    </Tab.Navigator>
  );
}

function TabStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={Tabs}
        options={{ headerShown: false }} // Tabs already have their headers
      />
      {/* <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: "Profile Settings",
          headerStyle: { backgroundColor: "#4CAF50" },
          headerTintColor: "#fff",
          headerTitleAlign: "left",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              style={{ marginLeft: 20, paddingRight: 10 }}
            >
              <Ionicons name="menu" size={26} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      /> */}
    </Stack.Navigator>
  );
}

// ---------------------
// ✅ Custom Drawer
// ---------------------
function CustomDrawerContent(props) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [soilMoisture, setSoilMoisture] = useState(false);
  const [temperature, setTemperature] = useState(false);
  const [rainDetection, setRainDetection] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(false);
  const [waterTank, setWaterLevel] = useState(false);
  const [pumpStatus, setPumpStatus] = useState(false);



  // Load saved preferences
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const soil = await AsyncStorage.getItem("soilMoisture");
        const temp = await AsyncStorage.getItem("temperature");
        const rain = await AsyncStorage.getItem("rainDetection");
        const light = await AsyncStorage.getItem("lightIntensity");
        const water = await AsyncStorage.getItem("waterTank");
        const pump = await AsyncStorage.getItem("pumpStatus");
        if (soil !== null) setSoilMoisture(JSON.parse(soil));
        if (temp !== null) setTemperature(JSON.parse(temp));
        if (rain !== null) setRainDetection(JSON.parse(rain));
        if (light !== null) setLightIntensity(JSON.parse(light));
        if (water !== null) setWaterLevel(JSON.parse(water));
        if (pump !== null) setPumpStatus(JSON.parse(pump));
      } catch (e) {
        console.log("Error loading settings:", e);
      }
    };
    loadSettings();
  }, []);

  // Save preferences whenever they change
  useEffect(() => {
    AsyncStorage.setItem("soilMoisture", JSON.stringify(soilMoisture));
  }, [soilMoisture]);

  useEffect(() => {
    AsyncStorage.setItem("temperature", JSON.stringify(temperature));
  }, [temperature]);

  useEffect(() => {
    AsyncStorage.setItem("rainDetection", JSON.stringify(rainDetection));
  }, [rainDetection]);

  useEffect(() => {
    AsyncStorage.setItem("lightIntensity", JSON.stringify(lightIntensity));
  }, [lightIntensity]);

  useEffect(() => {
    AsyncStorage.setItem("waterTank", JSON.stringify(waterTank));
  }, [waterTank]);

  useEffect(() => {
    AsyncStorage.setItem("pumpStatus", JSON.stringify(pumpStatus));
  }, [pumpStatus]);

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: "#9AC6A9" }}
    >
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={require("../assets/hehe.jpg")}
          style={styles.drawerProfileImage}
        />
        <Text style={styles.helloText}>Hello,</Text>
        <Text style={styles.drawerName}>John Doe</Text>
      </View>

      {/* Menu Section */}
      <View style={styles.menuSection}>
        {/* Notification Settings Dropdown */}
        <TouchableOpacity
          style={styles.dropdownRow}
          onPress={() => setShowNotifications(!showNotifications)}
        >
          {/* Left icon + label */}
          <View style={styles.dropdownLeft}>
            <Ionicons name="notifications-outline" size={20} color="black" />
            <Text style={styles.menuLabel}>Notification Settings</Text>
          </View>

          {/* Right dropdown arrow */}
          <Ionicons
            name={showNotifications ? "chevron-down" : "chevron-forward"}
            size={20}
            color="black"
          />
        </TouchableOpacity>

        {/* Expandable Checkboxes */}
        {showNotifications && (
          <View style={{ marginLeft: 20 }}>

            <BouncyCheckbox
              style={{ marginBottom: 10 }}
              isChecked={soilMoisture}
              onPress={() => setSoilMoisture(!soilMoisture)}
              fillColor="#4CAF50"
              size={24}
              disableBuiltInState
              iconStyle={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: "#4CAF50",
              }}
              innerIconStyle={{
                borderWidth: 2,
                borderRadius: 6,
              }}
              text="Soil Moisture"
              textStyle={{
                textDecorationLine: "none",
                color: "#333",
                fontSize: 14,
                fontWeight: "500",
              }}
            />

            <BouncyCheckbox
              style={{ marginBottom: 10 }}
              isChecked={temperature}
              onPress={() => setTemperature(!temperature)}
              fillColor="#4CAF50"
              size={24}
              disableBuiltInState
              iconStyle={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: "#4CAF50",
              }}
              innerIconStyle={{
                borderWidth: 2,
                borderRadius: 6,
              }}
              text="Temperature"
              textStyle={{
                textDecorationLine: "none",
                color: "#333",
                fontSize: 14,
                fontWeight: "500",
              }}
            />

            <BouncyCheckbox
              style={{ marginBottom: 10 }}
              isChecked={rainDetection}
              onPress={() => setRainDetection(!rainDetection)}
              fillColor="#4CAF50"
              size={24}
              disableBuiltInState
              iconStyle={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: "#4CAF50",
              }}
              innerIconStyle={{
                borderWidth: 2,
                borderRadius: 6,
              }}
              text="Rain Detection"
              textStyle={{
                textDecorationLine: "none",
                color: "#333",
                fontSize: 14,
                fontWeight: "500",
              }}
            />

            <BouncyCheckbox
              style={{ marginBottom: 10 }}
              isChecked={lightIntensity}
              onPress={() => setLightIntensity(!lightIntensity)}
              fillColor="#4CAF50"
              size={24}
              disableBuiltInState
              iconStyle={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: "#4CAF50",
              }}
              innerIconStyle={{
                borderWidth: 2,
                borderRadius: 6,
              }}
              text="Light Intensity"
              textStyle={{
                textDecorationLine: "none",
                color: "#333",
                fontSize: 14,
                fontWeight: "500",
              }}
            />

            <BouncyCheckbox
              style={{ marginBottom: 10 }}
              isChecked={waterTank}
              onPress={() => setWaterLevel(!waterTank)}
              fillColor="#4CAF50"
              size={24}
              disableBuiltInState
              iconStyle={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: "#4CAF50",
              }}
              innerIconStyle={{
                borderWidth: 2,
                borderRadius: 6,
              }}
              text="Water Tank Level"
              textStyle={{
                textDecorationLine: "none",
                color: "#333",
                fontSize: 14,
                fontWeight: "500",
              }}
            />

            <BouncyCheckbox
              style={{ marginBottom: 10 }}
              isChecked={pumpStatus}
              onPress={() => setPumpStatus(!pumpStatus)}
              fillColor="#4CAF50"
              size={24}
              disableBuiltInState
              iconStyle={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: "#4CAF50",
              }}
              innerIconStyle={{
                borderWidth: 2,
                borderRadius: 6,
              }}
              text="Pump Status"
              textStyle={{
                textDecorationLine: "none",
                color: "#333",
                fontSize: 14,
                fontWeight: "500",
              }}
            />
          </View>
        )}

        {/* Profile Settings */}
        <TouchableOpacity
          style={styles.dropdownRow}
          onPress={() =>
  props.navigation.navigate("MainTabs", {
    screen: "Tabs",   // 👈 go inside the Tabs stack
    params: {
      screen: "Profile",  // 👈 then go to hidden Profile tab
    },
  })
}

        >
          <View style={styles.dropdownLeft}>
            <Ionicons name="person-outline" size={20} color="black" />
            <Text style={styles.menuLabel}>Profile Settings</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ✅ Footer Section (ADDED) */}
      <View style={styles.footerSection}>
        <DrawerItem
          label="About the app"
          labelStyle={styles.footerLabel}
          onPress={() =>
  props.navigation.navigate("MainTabs", {
    screen: "Tabs",   // 👈 go inside the Tabs stack
    params: {
      screen: "AboutApp",  // 👈 then go to hidden Profile tab
    },
  })
}
        />
        <DrawerItem
          label="Log Out"
          labelStyle={styles.footerLabel}
          icon={({ size }) => (
            <Ionicons name="log-out-outline" size={size} color="black" />
          )}
          onPress={() => alert("Logged out")}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function MainNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="MainTabs" component={TabStack} />

    </Drawer.Navigator>
  );
}

// ---------------------
// ✅ Styles
// ---------------------
const styles = StyleSheet.create({
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  profileName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  drawerProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  helloText: {
    fontSize: 14,
    fontWeight: "600",
    color: "black",
  },
  drawerName: {
    fontSize: 14,
    color: "black",
  },
  menuSection: {
    paddingTop: 10,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "black",
    marginLeft: 8,
  },
  dropdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerSection: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingVertical: 5,
  },
  footerLabel: {
    fontSize: 14,
    color: "black",
    fontWeight: "bold",
  },

});
