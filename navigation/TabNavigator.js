// navigation/MainNavigator.js
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
} from "react-native";
import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import HomeScreen from "../screens/Home";
import CropMonitorScreen from "../screens/CropMonitor";
import NotificationsScreen from "../screens/Notifications";
import StatisticsScreen from "../screens/Statistics";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function Tabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: "left",
        headerStyle: {
          backgroundColor: "#4CAF50",
        },
        headerTintColor: "#fff",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Crop Monitor") {
            iconName = focused ? "leaf" : "leaf-outline";
          } else if (route.name === "Notifications") {
            iconName = focused
              ? "notifications"
              : "notifications-outline";
          } else if (route.name === "Statistics") {
            iconName = focused
              ? "stats-chart"
              : "stats-chart-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "gray",

        // Menu icon on the left
        headerLeft: () => (
          <Ionicons
            name="menu"
            size={26}
            color="#fff"
            style={{ marginLeft: 15 }}
            onPress={() => navigation.openDrawer()}
          />
        ),

        // Profile picture & name on the right
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
    </Tab.Navigator>
  );
}

// Custom Drawer Content
function CustomDrawerContent(props) {
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

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <DrawerItem
          label="Notification Settings"
          labelStyle={styles.menuLabel}
          icon={({ size }) => (
            <Ionicons name="notifications-outline" size={size} color="black" />
          )}
          onPress={() => props.navigation.navigate("Notifications")}
        />
        <DrawerItem
          label="Profile Settings"
          labelStyle={styles.menuLabel}
          icon={({ size }) => (
            <Ionicons name="person-outline" size={size} color="black" />
          )}
          onPress={() => alert("Go to Profile Settings")}
        />
      </View>

      {/* Footer */}
      <View style={styles.footerSection}>
        <DrawerItem
          label="About the app"
          labelStyle={styles.footerLabel}
          onPress={() => alert("About the app")}
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
      <Drawer.Screen name="MainTabs" component={Tabs} />
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
  },
  footerSection: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  footerLabel: {
    fontSize: 14,
    color: "black",
    fontWeight: "bold",
  },
});
