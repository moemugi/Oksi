import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, AppState } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../lib/supabase';

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-refresh Supabase session when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => subscription.remove();
  }, []);

  // === SIGN UP FUNCTION ===
  const signUpWithEmail = async () => {
  if (!email || !password || !confirmPassword) {
    Alert.alert('Error', 'Please fill all required fields.');
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match.');
    return;
  }

  setLoading(true);
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else {
      console.log('Signed up user:', data.user);
      if (!data.user.confirmed_at) {
        Alert.alert('Success', 'Please check your inbox for email verification!');
      } else {
        Alert.alert('Success', 'Sign up successful!');
        navigation.replace('Login');
      }
    }
  } catch (err) {
    console.error(err);
    Alert.alert('Error', 'Something went wrong during sign up.');
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Image source={require('../assets/Oksi.png')} style={styles.logo} />
      <Text style={styles.subtitle}>Create your Account</Text>

      <View style={styles.inputContainer}>
        <Icon name="person" size={20} color="#666" style={styles.icon} />
        <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="email" size={20} color="#666" style={styles.icon} />
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="phone" size={20} color="#666" style={styles.icon} />
        <TextInput placeholder="Contact Number" value={contact} onChangeText={setContact} style={styles.input} keyboardType="phone-pad" />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput placeholder="Password" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} style={styles.input} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? "visibility-off" : "visibility"} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput placeholder="Confirm Password" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon name={showConfirmPassword ? "visibility-off" : "visibility"} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={signUpWithEmail} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing up...' : 'Sign Up'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', padding: 20 },
  backButton: { alignSelf: 'flex-start', marginTop: 40, marginBottom: 10 },
  logo: { width: 200, height: 150, resizeMode: 'contain', marginBottom: 20 },
  subtitle: { fontSize: 14, color: '#444', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f2', borderRadius: 8, paddingHorizontal: 10, marginBottom: 15, width: '100%' },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 10 },
  button: { backgroundColor: '#2e6b34', paddingVertical: 12, borderRadius: 25, width: '100%', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
