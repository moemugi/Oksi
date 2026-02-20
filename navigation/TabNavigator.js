import { supabase } from "../lib/supabase";
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import HomeScreen from "../screens/Home";
// import CropMonitorScreen from "../screens/CropMonitor";
import NotificationsScreen from "../screens/Notifications";
import StatisticsScreen from "../screens/Statistics";
import ProfileScreen from "../screens/Profile";
import AboutApp from "../screens/AboutApp";
import AppGuide from "../screens/AppGuide";
import DeviceManagement from "../screens/DeviceManagement";
import MonitorDevice from "../screens/MonitorDevice";
import { Ionicons } from "@expo/vector-icons";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { SensorContext } from "../context/SensorContext"; // adjust path if needed

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

/* =========================================================
   HELPERS
========================================================= */
async function resolveAvatarUrl(raw) {
  if (!raw) return null;

  // If it's already an https URL, return as-is
  if (/^https?:\/\//i.test(raw)) return raw;

  // Otherwise, treat as a storage path in the "avatars" bucket.
  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(raw);
  if (pub?.publicUrl) return pub.publicUrl;

  // If bucket is private, fall back to a signed URL
  const { data: signed, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(raw, 60 * 60); // 1 hour

  if (error) {
    console.log("resolveAvatarUrl signed error:", error.message);
    return null;
  }
  return signed.signedUrl;
}

async function fetchProfileInfo(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_url, username")
    .eq("id", userId)
    .single();

  if (error) {
    console.log("fetchProfileInfo error:", error.message);
    return { avatarUrl: null, username: null };
  }

  return {
    avatarUrl: data?.avatar_url ?? null,
    username: data?.username ?? null,
  };
}

async function fetchProfileAvatar(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_url, full_name")
    .eq("id", userId)
    .single();

  if (error) {
    console.log("fetchProfileAvatar error:", error.message);
    return { avatarUrl: null, fullName: null };
  }

  return {
    avatarUrl: data?.avatar_url ?? null,
    fullName: data?.full_name ?? null,
  };
}

async function getAvatarForUser(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_url, full_name")
    .eq("id", userId)
    .single();

  if (error) return { avatarUrl: null, fullName: null };

  return {
    avatarUrl: data?.avatar_url ?? null,
    fullName: data?.full_name ?? null,
  };
}

/* =========================================================
   CONSISTENT HAMBURGER (ONE SOURCE OF TRUTH)
========================================================= */
function HeaderMenuButton({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerIconBtn}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      <Ionicons name="menu" size={22} color="#fff" />
    </TouchableOpacity>
  );
}

/* =========================================================
   HEADER PROFILE (TOP RIGHT)
========================================================= */
function HeaderProfile({ showName, loggingOut }) {
  const navigation = useNavigation();
  const [avatarUri, setAvatarUri] = useState(null);
  const [displayName, setDisplayName] = useState(null);

  useEffect(() => {
    if (loggingOut) {
      setAvatarUri(null);
      setDisplayName(null);
      return;
    }

    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data?.session?.user ?? null;
      if (!mounted) return;

      if (u) {
        const { avatarUrl: profAvatar, username } = await fetchProfileInfo(u.id);
        const resolved = await resolveAvatarUrl(
          profAvatar || u.user_metadata?.avatar_url
        );
        if (!mounted) return;

        setAvatarUri(resolved);
        setDisplayName(username || u.email);
      } else {
        setAvatarUri(null);
        setDisplayName(null);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [loggingOut]);

  return (
    <View style={styles.profileContainer}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("MainTabs", {
            screen: "Tabs",
            params: { screen: "Profile" },
          })
        }
        style={{ flexDirection: "row", alignItems: "center" }}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: avatarUri || "https://via.placeholder.com/40" }}
          style={styles.profileImage}
        />
        {showName && (
          <Text style={styles.profileName} numberOfLines={1}>
            {displayName || ""}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/* =========================================================
   TABS
========================================================= */
function Tabs({ navigation }) {
  const { loggingOut } = useContext(SensorContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: "left",
        headerStyle: styles.headerStyle,
        headerTintColor: "#fff",

        // ✅ ensure same container padding
        headerLeftContainerStyle: styles.headerLeftContainer,

        tabBarStyle: styles.tabBarStyle,
        tabBarActiveTintColor: "#2E7D32",
        tabBarInactiveTintColor: "#7A7A7A",
        tabBarLabelStyle: styles.tabBarLabelStyle,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Notifications")
            iconName = focused ? "notifications" : "notifications-outline";
          else if (route.name === "Statistics")
            iconName = focused ? "stats-chart" : "stats-chart-outline";
          else iconName = "ellipse";

          return <Ionicons name={iconName} size={size} color={color} />;
        },

        headerLeft: () => (
          <HeaderMenuButton onPress={() => navigation.openDrawer()} />
        ),

        headerRight: () => (
          <HeaderProfile
            showName={route.name === "Home"}
            loggingOut={loggingOut}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      {/* <Tab.Screen name="Crop Monitor" component={CropMonitorScreen} /> */}
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />

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
      <Tab.Screen
        name="AppGuide"
        component={AppGuide}
        options={{
          tabBarItemStyle: { display: "none" },
          headerShown: true,
          headerTitle: "Application Guide",
        }}
      />
      <Tab.Screen
        name="DeviceManagement"
        component={DeviceManagementStack}
        options={{
          tabBarItemStyle: { display: "none" },
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

/* =========================================================
   DEVICE MANAGEMENT STACK
========================================================= */
function DeviceManagementStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: styles.headerStyle,
        headerTintColor: "#fff",
        headerBackTitleVisible: false,

        // ✅ make stack match tabs
        headerLeftContainerStyle: styles.headerLeftContainer,
      }}
    >
      <Stack.Screen
        name="DeviceManagementMain"
        component={DeviceManagement}
        options={({ navigation }) => ({
          title: "Device Management",
          headerLeft: () => (
            <HeaderMenuButton
              onPress={() => navigation.getParent()?.openDrawer()}
            />
          ),
        })}
      />

      <Stack.Screen
        name="MonitorDevice"
        component={MonitorDevice}
        options={{
          title: "Device Monitor",
          headerBackTitleVisible: false,
          headerTitleAlign: "left",
        }}
      />
    </Stack.Navigator>
  );
}

/* =========================================================
   TAB STACK WRAPPER
========================================================= */
function TabStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

/* =========================================================
   CUSTOM DRAWER CONTENT
========================================================= */
function CustomDrawerContent(props) {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // legacy local states kept
  const [soilMoisture, setSoilMoisture] = useState(true);
  const [temperature, setTemperature] = useState(true);
  const [rainDetection, setRainDetection] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(true);
  const [waterLevel, setWaterLevel] = useState(true);
  const [pumpStatus, setPumpStatus] = useState(true);

  const [user, setUser] = useState(null);
  const [avatarUri, setAvatarUri] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const { resetSensorData, selectedSensors, setSelectedSensors } =
    useContext(SensorContext);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const soil = await AsyncStorage.getItem("soilMoisture");
        const temp = await AsyncStorage.getItem("temperature");
        const rain = await AsyncStorage.getItem("rainDetection");
        const light = await AsyncStorage.getItem("lightIntensity");
        const water = await AsyncStorage.getItem("waterLevel");
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
    AsyncStorage.setItem("waterLevel", JSON.stringify(waterLevel));
  }, [waterLevel]);
  useEffect(() => {
    AsyncStorage.setItem("pumpStatus", JSON.stringify(pumpStatus));
  }, [pumpStatus]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const u = data?.session?.user ?? null;
      setUser(u);

      if (u) {
        const { avatarUrl: profAvatar, username } = await fetchProfileInfo(u.id);
        const fallback = u.user_metadata?.avatar_url || null;
        const resolved = await resolveAvatarUrl(profAvatar || fallback);
        if (!mounted) return;
        setAvatarUri(resolved);
        setDisplayName(username || u.email || "User");
      } else {
        setAvatarUri(null);
        setDisplayName(null);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_evt, session) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);

        if (u) {
          const { avatarUrl: profAvatar, username } = await fetchProfileInfo(u.id);
          const fallback = u.user_metadata?.avatar_url || null;
          const resolved = await resolveAvatarUrl(profAvatar || fallback);
          if (!mounted) return;
          setAvatarUri(resolved);
          setDisplayName(username || u.email || "User");
        } else {
          setAvatarUri(null);
          setDisplayName(null);
        }
      }
    );

    load();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContainer}
    >
      {/* ===== Modern Drawer Header Card ===== */}
      <View style={styles.drawerHeaderCard}>
        <TouchableOpacity
          onPress={() =>
            props.navigation.navigate("MainTabs", {
              screen: "Tabs",
              params: { screen: "Profile" },
            })
          }
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: avatarUri || "https://via.placeholder.com/80" }}
            style={styles.drawerProfileImage}
          />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={styles.helloText}>Hello,</Text>
          <Text style={styles.drawerName} numberOfLines={1}>
            {displayName || "Guest"}
          </Text>
          <View style={styles.drawerPill}>
            <Ionicons name="leaf-outline" size={14} color="#2E7D32" />
          </View>
        </View>
      </View>

      {/* ===== Menu Card ===== */}
      <View style={styles.drawerMenuCard}>
        <TouchableOpacity
          style={styles.drawerRow}
          onPress={() => setShowNotifications(!showNotifications)}
          activeOpacity={0.85}
        >
          <View style={styles.drawerRowLeft}>
            <View style={styles.iconChip}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#1B5E20"
              />
            </View>
            <View>
              <Text style={styles.menuLabel}>Notification Settings</Text>
              <Text style={styles.menuSubLabel}>
                Choose which sensors show alerts
              </Text>
            </View>
          </View>

          <Ionicons
            name={showNotifications ? "chevron-down" : "chevron-forward"}
            size={20}
            color="#1B5E20"
          />
        </TouchableOpacity>

        {showNotifications && (
          <View style={styles.drawerDropdown}>
            <BouncyCheckbox
              style={styles.cbRow}
              isChecked={selectedSensors.soilMoisture}
              onPress={() =>
                setSelectedSensors({
                  ...selectedSensors,
                  soilMoisture: !selectedSensors.soilMoisture,
                })
              }
              fillColor="#2E7D32"
              size={22}
              disableBuiltInState
              iconStyle={styles.cbIcon}
              innerIconStyle={styles.cbInnerIcon}
              text="Soil Moisture"
              textStyle={styles.cbText}
            />

            <BouncyCheckbox
              style={styles.cbRow}
              isChecked={selectedSensors.temperature}
              onPress={() =>
                setSelectedSensors({
                  ...selectedSensors,
                  temperature: !selectedSensors.temperature,
                })
              }
              fillColor="#2E7D32"
              size={22}
              disableBuiltInState
              iconStyle={styles.cbIcon}
              innerIconStyle={styles.cbInnerIcon}
              text="Temperature"
              textStyle={styles.cbText}
            />

            <BouncyCheckbox
              style={styles.cbRow}
              isChecked={selectedSensors.rainDetection}
              onPress={() =>
                setSelectedSensors({
                  ...selectedSensors,
                  rainDetection: !selectedSensors.rainDetection,
                })
              }
              fillColor="#2E7D32"
              size={22}
              disableBuiltInState
              iconStyle={styles.cbIcon}
              innerIconStyle={styles.cbInnerIcon}
              text="Rain Detection"
              textStyle={styles.cbText}
            />

            <BouncyCheckbox
              style={styles.cbRow}
              isChecked={selectedSensors.lightIntensity}
              onPress={() =>
                setSelectedSensors({
                  ...selectedSensors,
                  lightIntensity: !selectedSensors.lightIntensity,
                })
              }
              fillColor="#2E7D32"
              size={22}
              disableBuiltInState
              iconStyle={styles.cbIcon}
              innerIconStyle={styles.cbInnerIcon}
              text="Light Intensity"
              textStyle={styles.cbText}
            />

            <BouncyCheckbox
              style={styles.cbRow}
              isChecked={selectedSensors.waterLevel}
              onPress={() =>
                setSelectedSensors({
                  ...selectedSensors,
                  waterLevel: !selectedSensors.waterLevel,
                })
              }
              fillColor="#2E7D32"
              size={22}
              disableBuiltInState
              iconStyle={styles.cbIcon}
              innerIconStyle={styles.cbInnerIcon}
              text="Water Tank Level"
              textStyle={styles.cbText}
            />

            <BouncyCheckbox
              style={styles.cbRow}
              isChecked={selectedSensors.pumpStatus}
              onPress={() =>
                setSelectedSensors({
                  ...selectedSensors,
                  pumpStatus: !selectedSensors.pumpStatus,
                })
              }
              fillColor="#2E7D32"
              size={22}
              disableBuiltInState
              iconStyle={styles.cbIcon}
              innerIconStyle={styles.cbInnerIcon}
              text="Pump Status"
              textStyle={styles.cbText}
            />
          </View>
        )}

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.drawerRow}
          onPress={() =>
            props.navigation.navigate("MainTabs", {
              screen: "Tabs",
              params: { screen: "Profile" },
            })
          }
          activeOpacity={0.85}
        >
          <View style={styles.drawerRowLeft}>
            <View style={styles.iconChip}>
              <Ionicons name="person-outline" size={18} color="#1B5E20" />
            </View>
            <Text style={styles.menuLabel}>Profile Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1B5E20" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerRow}
          onPress={() =>
            props.navigation.navigate("MainTabs", {
              screen: "Tabs",
              params: { screen: "DeviceManagement" },
            })
          }
          activeOpacity={0.85}
        >
          <View style={styles.drawerRowLeft}>
            <View style={styles.iconChip}>
              <Ionicons name="construct-outline" size={18} color="#1B5E20" />
            </View>
            <Text style={styles.menuLabel}>Device Management</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1B5E20" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerRow}
          onPress={() =>
            props.navigation.navigate("MainTabs", {
              screen: "Tabs",
              params: { screen: "AppGuide" },
            })
          }
          activeOpacity={0.85}
        >
          <View style={styles.drawerRowLeft}>
            <View style={styles.iconChip}>
              <Ionicons name="help-circle-outline" size={18} color="#1B5E20" />
            </View>
            <Text style={styles.menuLabel}>Application Guide</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1B5E20" />
        </TouchableOpacity>
      </View>

      {/* ===== Footer Card ===== */}
      <View style={styles.drawerFooterCard}>
        <DrawerItem
          label="About the app"
          labelStyle={styles.footerLabel}
          icon={({ size }) => (
            <Ionicons
              name="information-circle-outline"
              size={size}
              color="#1B5E20"
            />
          )}
          onPress={() =>
            props.navigation.navigate("MainTabs", {
              screen: "Tabs",
              params: { screen: "AboutApp" },
            })
          }
          style={styles.drawerItemStyle}
        />

        <DrawerItem
          label="Log Out"
          labelStyle={[styles.footerLabel, { color: "#B3261E" }]}
          icon={({ size }) => (
            <Ionicons name="log-out-outline" size={size} color="#B3261E" />
          )}
          onPress={() => setLogoutModalVisible(true)}
          style={styles.drawerItemStyle}
        />
      </View>

      {/* ===== Modern Modal ===== */}
      <Modal
        transparent
        animationType="fade"
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="log-out-outline" size={22} color="#B3261E" />
              </View>
              <Text style={styles.modalTitle}>Confirm Log Out</Text>
              <Text style={styles.modalText}>
                Are you sure you want to log out?
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalBtnGhost]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.9}
              >
                <Text
                  style={[styles.modalButtonText, styles.modalBtnGhostText]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalBtnDanger]}
                activeOpacity={0.9}
                onPress={async () => {
                  try {
                    // mark logging out for UI
                    setLoggingOut(true);

                    resetSensorData();
                    await AsyncStorage.setItem("otpVerified", "false");

                    const { data: sessionData } = await supabase.auth.getSession();
                    const u = sessionData?.session?.user ?? null;
                    if (u) {
                      const now = new Date().toISOString();
                      supabase
                        .from("tank_devices")
                        .update({ active: false, last_updated: now })
                        .eq("user_id", u.id)
                        .then(({ error }) => {
                          if (error)
                            console.log(
                              "Device deactivation error:",
                              error.message
                            );
                        });
                    }

                    await supabase.auth.signOut();
                    setLogoutModalVisible(false);

                    props.navigation.reset({
                      index: 0,
                      routes: [{ name: "Login" }],
                    });
                  } catch (err) {
                    console.log("Error during logout:", err);
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

/* =========================================================
   MAIN NAVIGATOR
========================================================= */
export default function MainNavigator({ setOtpVerified }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} setOtpVerified={setOtpVerified} />
      )}
      screenOptions={{
        headerShown: false,
        drawerStyle: styles.drawerStyle,
        sceneContainerStyle: styles.sceneStyle,
      }}
    >
      <Drawer.Screen name="MainTabs" component={TabStack} />
    </Drawer.Navigator>
  );
}

/* =========================================================
   MODERN STYLES
========================================================= */
const styles = StyleSheet.create({
  /* ----- App surface ----- */
  sceneStyle: { backgroundColor: "#F6FBF7" },

  /* ----- Header / Tab styles ----- */
  headerStyle: {
    backgroundColor: "#2E7D32",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },

  // ✅ One source of truth for left padding in ALL headers
  headerLeftContainer: { paddingLeft: 12 },

  // ✅ Remove marginLeft to avoid double shifting
  headerIconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  tabBarStyle: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,
    elevation: 12,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -6 },
    height: Platform.OS === "ios" ? 86 : 64,
    paddingBottom: Platform.OS === "ios" ? 26 : 10,
    paddingTop: 8,
  },
  tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },

  /* ----- Header profile (top right) ----- */
  profileContainer: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 999,
    marginRight: 8,
  },
  profileName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    maxWidth: 140,
  },

  /* ----- Drawer ----- */
  drawerStyle: { width: 300, backgroundColor: "#F6FBF7" },
  drawerContainer: { flexGrow: 1, padding: 14, backgroundColor: "#7baa85" },

  drawerHeaderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  drawerProfileImage: {
    width: 82,
    height: 82,
    borderRadius: 999,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "rgba(46,125,50,0.20)",
  },
  helloText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },
  drawerName: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "800",
    color: "#0B1220",
    maxWidth: 220,
  },
  drawerPill: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(46,125,50,0.10)",
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.14)",
  },

  drawerMenuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  drawerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  drawerRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },

  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(46,125,50,0.10)",
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.14)",
  },

  menuLabel: { fontSize: 14, fontWeight: "800", color: "#0B1220" },
  menuSubLabel: { marginTop: 2, fontSize: 12, fontWeight: "600", color: "#6B7280" },

  drawerDropdown: {
    marginTop: 2,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  cbRow: { marginBottom: 10 },
  cbIcon: { borderRadius: 8, borderWidth: 2, borderColor: "rgba(46,125,50,0.55)" },
  cbInnerIcon: { borderWidth: 2, borderRadius: 8 },
  cbText: { textDecorationLine: "none", color: "#374151", fontSize: 13, fontWeight: "600" },

  divider: {
    height: 1,
    marginVertical: 6,
    marginHorizontal: 10,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
  },

  drawerFooterCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  drawerItemStyle: { borderRadius: 14, marginHorizontal: 6 },
  footerLabel: { fontSize: 14, fontWeight: "800", color: "#0B1220" },

  /* ----- Modal ----- */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  modalHeader: { alignItems: "center", paddingBottom: 12 },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(179,38,30,0.10)",
    borderWidth: 1,
    borderColor: "rgba(179,38,30,0.18)",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#0B1220" },
  modalText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    textAlign: "center",
  },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: { fontWeight: "900", color: "#FFFFFF" },
  modalBtnGhost: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  modalBtnGhostText: { color: "#111827" },
  modalBtnDanger: { backgroundColor: "#B3261E" },
});
