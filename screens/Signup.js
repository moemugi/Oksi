import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function SignupScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Image source={require('../assets/Oksi.png')} style={styles.logo} />
      <Text style={styles.subtitle}>Create your Account</Text>

      <View style={styles.inputContainer}>
        <Icon name="person" size={20} color="#666" style={styles.icon} />
        <TextInput placeholder="Username" style={styles.input} />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="email" size={20} color="#666" style={styles.icon} />
        <TextInput placeholder="Email" style={styles.input} />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="phone" size={20} color="#666" style={styles.icon} />
        <TextInput placeholder="Contact Number" style={styles.input} keyboardType="phone-pad" />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput placeholder="Password" secureTextEntry={!showPassword} style={styles.input} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? "visibility-off" : "visibility"} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput placeholder="Confirm Password" secureTextEntry={!showConfirmPassword} style={styles.input} />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon name={showConfirmPassword ? "visibility-off" : "visibility"} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Sign Up</Text>
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
