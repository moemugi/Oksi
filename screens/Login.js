import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function Login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/Oksi.png')} style={styles.logo} />
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <View style={styles.inputContainer}>
        <Icon name="person" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? "visibility-off" : "visibility"} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <Text style={styles.forgot}>Forgot your password?</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MainApp')}>
       <Text style={styles.buttonText}>Sign in</Text>
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
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f2', borderRadius: 8, paddingHorizontal: 10, marginBottom: 15, width: '100%' },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 10 },
  forgot: { fontSize: 12, color: '#999', marginBottom: 20 },
  button: { backgroundColor: '#2e6b34', paddingVertical: 12, borderRadius: 25, width: '100%', alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  signupText: { fontSize: 12, color: '#555' },
  signupLink: { color: '#2e6b34', fontWeight: 'bold' }
});
