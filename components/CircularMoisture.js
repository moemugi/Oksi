import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

const CircularMoisture = ({ value }) => {
  const size = 180; // circle size
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.container}>
      {/* Circle with emoji inside */}
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            stroke="#e0e0e0"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <Circle
            stroke="#2e6b34"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>

        {/* Centered plant emoji */}
        <Text style={styles.emoji}>🌱</Text>
      </View>

      {/* Percentage below circle - stays centered */}
      <View style={{ width: size, alignItems: "center" }}>
        <Text style={styles.label}>{progress}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  emoji: {
    position: "absolute",
    fontSize: 50,
    textAlign: "center",
  },
  label: {
    fontSize: 45,
    fontWeight: "bold",
    color: "#2e6b34",
    marginTop: 10,
    textAlign: "center",
  },
});

export default CircularMoisture;
