import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { View, Animated, StyleSheet, Image, Text } from 'react-native';
import LoginScreen from './screens/Login';
import SignupScreen from './screens/Signup';
import WelcomeScreen from './screens/Welcome';
import TabNavigator from './navigation/TabNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Toast from "react-native-toast-message";


const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Custom Drawer Content (compact height)
function CustomDrawerContent() {
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Image
        source={{ uri: 'https://via.placeholder.com/80' }}
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          marginBottom: 10,
        }}
      />
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>John Doe</Text>
    </View>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false, // Remove drawer screen headers
        drawerActiveTintColor: '#4CAF50',
        drawerLabelStyle: { fontSize: 16 },
        drawerStyle: {
          height: 'auto', // Make drawer fit content height
        },
      }}
    >
      <Drawer.Screen
        name="HomeTabs"
        component={TabNavigator}
        options={{
          drawerLabel: 'Home',
        }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
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

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <View style={styles.splash}>
        <Animated.Image
          source={require('./assets/OksiMainLogo.png')}
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
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="MainApp" component={DrawerNavigator} />
      </Stack.Navigator>
            <Toast/>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
