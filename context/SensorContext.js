import React, { createContext, useState } from "react";

export const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState(null);
  const [plantStatus, setPlantStatus] = useState({
    status: "",
    statusColor: "",
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Default active sensors
  const [selectedSensors, setSelectedSensors] = useState({
    soilMoisture: true,
    temperature: true,
    humidity: true,
    waterLevel: true,
    rainDetection: true,
    pumpStatus: true,
    battery: true,
    lightIntensity: true,
  });

  // Logging out state
  const [loggingOut, setLoggingOut] = useState(false);

  const resetSensorData = () => {
    setSensorData(null);
    setPlantStatus({ status: "", statusColor: "" });
    setLastUpdated(null);
    setNotifications([]);
  };

  const contextValue = {
    sensorData,
    setSensorData,
    plantStatus,
    setPlantStatus,
    lastUpdated,
    setLastUpdated,
    notifications,
    setNotifications,
    selectedSensors,
    setSelectedSensors,
    resetSensorData,
    loggingOut,
    setLoggingOut, // include the setter too
  };

  
  return (
    <SensorContext.Provider value={contextValue}>
      {children}
    </SensorContext.Provider>
  );
};
