import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, AppState } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export default function Login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // error state

  // Auto-refresh Supabase session when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => subscription.remove();
  }, []);

  // === VALIDATION FUNCTION ===
  const validateForm = () => {
    const newErrors = {};
    if (!username) newErrors.username = 'You cannot leave the email blank';
    if (!password) newErrors.password = 'Password must not be entered blank.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // === LOGIN FUNCTION ===
  const handleSignIn = async () => {
    if (!validateForm()) return; // stop if errors

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: username, // your "username" is email
        password: password,
      });

      if (error) {
        setErrors({ general: error.message });
      } else {
        const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
        if (!hasSeenWelcome) {
          navigation.replace('Welcome');
        } else {
          navigation.replace('MainApp');
        }
      }
    } catch (err) {
      setErrors({ general: 'Something went wrong during login.' });
    } finally {
      setLoading(false);
    }
  };

  const resetWelcomeFlag = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenWelcome');
      alert('Welcome screen flag reset! It will show again on next sign in.');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/Oksi.png')} style={styles.logo} />
      <Text style={styles.subtitle}>Sign in to your account</Text>

      {/* Email Input */}
      <View style={[styles.inputContainer, errors.username && styles.inputError]}>
        <Icon name="person" size={20} color={errors.username ? "#666" : "#666"} style={styles.icon} />
        <TextInput
          placeholder="Email"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setErrors({ ...errors, username: '' });
          }}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

      {/* Password Input */}
      <View style={[styles.inputContainer, errors.password && styles.inputError]}>
        <Icon name="lock" size={20} color={errors.password ? "#666" : "#666"} style={styles.icon} />
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors({ ...errors, password: '' });
          }}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? "visibility-off" : "visibility"} size={20} color="#666" />
        </TouchableOpacity>
      </View>
      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

      {/* General error */}
      {errors.general ? <Text style={styles.errorText}>{errors.general}</Text> : null}

      <Text style={styles.forgot}>Forgot your password?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#888' }]} onPress={resetWelcomeFlag}>
        <Text style={styles.buttonText}>Reset Welcome Screen</Text>
      </TouchableOpacity>

      <Text style={styles.signupText}>
        Don’t have an account?{" "}
        <Text style={styles.signupLink} onPress={() => navigation.navigate('Signup')}>
          Sign up here
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  logo: { width: 200, height: 150, resizeMode: 'contain', marginBottom: 20 },
  subtitle: { fontSize: 14, color: '#444', marginBottom: 20 },
  inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f2f2f2',
  borderRadius: 8,
  paddingHorizontal: 10,
  marginBottom: 15, // ⬅️ more space between inputs
  width: '100%',
  borderWidth: 1,
  borderColor: 'transparent',
},
  inputError: { borderColor: 'red', backgroundColor: '#ffffffff' },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 10 },
  errorText: { color: 'red', fontSize: 12, marginBottom: 10, alignSelf: 'flex-start' },
  forgot: { fontSize: 12, color: '#999', marginBottom: 20 },
  button: { backgroundColor: '#2e6b34', paddingVertical: 12, borderRadius: 25, width: '100%', alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  signupText: { fontSize: 12, color: '#555' },
  signupLink: { color: '#2e6b34', fontWeight: 'bold' }
});