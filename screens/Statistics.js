import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Statistics() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Statistics</Text>
      <Text>View your farm's growth and trends here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 }
});
