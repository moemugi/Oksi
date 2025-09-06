// navigation/MainNavigator.js
import { supabase } from "../lib/supabase"; 
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity
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

// 🔹 A reusable user header (top-right corner)
function HeaderProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) setUser(data.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.profileContainer}>
      <Image
        source={{
          uri: user?.user_metadata?.avatar_url || "https://via.placeholder.com/40",
        }}
        style={styles.profileImage}
      />
      <Text style={styles.profileName}>
        {user?.user_metadata?.full_name || user?.email || "Guest"}
      </Text>
    </View>
  );
}

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

        // ✅ Right profile section (dynamic from Supabase)
        headerRight: () => <HeaderProfile />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Crop Monitor" component={CropMonitorScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />

      {/* ✅ Hidden tabs */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarItemStyle: { display: "none" },
          headerShown: true,
          headerTitle: "Profile Settings",
        }}
      />
      <Tab.Screen
        name="AboutApp"
        component={AboutApp}
        options={{
          tabBarItemStyle: { display: "none" },
          headerShown: true,
          headerTitle: "About the App",
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
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// ---------------------
// ✅ Custom Drawer
// ---------------------

  function CustomDrawerContent(props) {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [soilMoisture, setSoilMoisture] = useState(false);
  const [temperature, setTemperature] = useState(false);
  const [rainDetection, setRainDetection] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(false);
  const [waterTank, setWaterLevel] = useState(false);
  const [pumpStatus, setPumpStatus] = useState(false);


  const [user, setUser] = useState(null);


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

  useEffect(() => {

    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) setUser(data.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: "#9AC6A9" }}
    >
      {/* ✅ Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{
            uri: user?.user_metadata?.avatar_url || "https://via.placeholder.com/80",
          }}
          style={styles.drawerProfileImage}
        />
        <Text style={styles.helloText}>Hello,</Text>
        <Text style={styles.drawerName}>
          {user?.user_metadata?.full_name || user?.email || "Guest"}
        </Text>
      </View>

      

      {/* Menu Section */}
      <View style={styles.menuSection}>
        {/* Notification Settings Dropdown */}
        <TouchableOpacity
          style={styles.dropdownRow}
          onPress={() => setShowNotifications(!showNotifications)}
        >
          {}
          <View style={styles.dropdownLeft}>
            <Ionicons name="notifications-outline" size={20} color="black" />
            <Text style={styles.menuLabel}>Notification Settings</Text>
          </View>

          {}
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
              screen: "Tabs",
              params: { screen: "Profile" },
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
              screen: "Tabs",   
              params: {
                screen: "AboutApp",  
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
          onPress={() => setLogoutModalVisible(true)}
        />
      </View>
<Modal
  transparent={true}
  animationType="fade"
  visible={logoutModalVisible}
  onRequestClose={() => setLogoutModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Confirm Log Out</Text>
      <Text style={styles.modalText}>Are you sure you want to log out?</Text>
      
      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: "#ccc" }]}
          onPress={() => setLogoutModalVisible(false)}
        >
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
  style={[styles.modalButton, { backgroundColor: "#4CAF50" }]}
  onPress={async () => {
    try {
      // 1. Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log("Error signing out from Supabase:", error.message);
        return;
      }

      // 2. Clear local token/session
      await AsyncStorage.removeItem("userToken");

      // 3. Close modal
      setLogoutModalVisible(false);

      // 4. Reset navigation to Login screen
      props.navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.log("Error logging out:", error);
    }
  }}
>
  <Text style={styles.modalButtonText}>Log Out</Text>
</TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },

});