import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  Modal,
  TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function CropMonitor() {
  const [modalVisible, setModalVisible] = useState(false);
  const [wifi, wifiName] = useState('');
  const [pass, password] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');

  return (
    <View style={styles.container}>
      <Image source={require('../assets/sensor_icon.png')} style={styles.logo} />
      <Text style={styles.title}>Monitor your soil moisture and plant health here.</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Configure</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Configure Settings</Text>

            <TextInput
              style={styles.input}
              placeholder="Wifi's Name"
              value={wifi}
              onChangeText={wifiName}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={pass}
              onChangeText={password}
              secureTextEntry
            />

            {/* Crop Picker */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedCrop}
                onValueChange={(itemValue) => setSelectedCrop(itemValue)}
              >
                <Picker.Item label="Select Crop" value="" />
                <Picker.Item label="Okra" value="okra" />
                <Picker.Item label="Siling Labuyo" value="sili" />
              </Picker>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                console.log({
                  wifi,
                  pass,
                  selectedCrop
                });
                setModalVisible(false);
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 16, textAlign: 'center', marginBottom: 15 },
  button: {
    backgroundColor: '#2e6b34',
    paddingVertical: 12,
    borderRadius: 25,
    width: '55%',
    alignItems: 'center',
    marginTop: 15
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logo: { width: 100, height: 100, resizeMode: 'contain', marginBottom: 20 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10
  },
  pickerWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10
  },
  saveButton: {
    backgroundColor: '#2e6b34',
    paddingVertical: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 5
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 5
  },
  cancelButtonText: { color: '#000', fontWeight: 'bold' }
});
