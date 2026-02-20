import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";


export default function AppGuideScreen() {
  const [openIndex, setOpenIndex] = useState(null);
  const [slideIndex, setSlideIndex] = useState({});
     
  const steps = [
    {
      title: "Sign In / Create an Account",
    slides: [
    {
      image: require("../assets/appGuide/signin.jpg"),
      content: (
        <Text style={{ textAlign: "center" }}>
          Enter credentials to Sign In
        </Text>
      )
    },
        {
      image: require("../assets/appGuide/signinOTP.jpg"),
      content: (
        <Text style={{ textAlign: "center" }}>
          Click "Proceed" button to enter your OTP
        </Text>
      )
    },
        {
      image: require("../assets/appGuide/OTPverification.jpg"),
      content: (
        <Text style={{ textAlign: "center" }}>
          Enter the OTP from your email to sign in the app
        </Text>
      )
    }
    ],
  },
    {
  title: "General Settings",
  slides: [
    {
      image: require("../assets/appGuide/notificationSettings.jpg"),
      text: (
        <>
          <Text style={{ fontWeight: "bold", marginTop: 10 }}>
            Notification Settings:{" "}
          </Text>


          <Text style={{ marginTop: 10 }}>
            You can select among all the checkboxes which notification you want to receive
          </Text>
        </>
      ),
    },
    {
      image: require("../assets/appGuide/profileSettings.jpg"),
      text: (
        <>
          <Text style={{ fontWeight: "bold", marginTop: 10 }}>
            Profile Settings: {" "}
          </Text>


          <Text style={{ marginTop: 10 }}>
            View and edit profile information
          </Text>
        </>
      ),
    },
  ],
},
    {
      title: "Calibration",
    slides: [
      {
        image: require("../assets/appGuide/water calibration.jpg"),
       content: (
        <Text>
          Click{" "}
          <Text style={{ fontWeight: "bold" }}>Setup Water Calibration</Text>
        </Text>
      ),
      },
      {
        image: require("../assets/appGuide/full water calibration.jpg"),
      text: (
        <>
          <Text>
            Calibrate Full to determine the container's water level.{"\n"}{"\n"}
          </Text>


          <Text style={{ fontStyle: "italic"}}>
            Note: If calibration already exists, the app will reuse it.
            <Text> Press </Text>
            <Text style={{ fontWeight: "bold"}}>Reset</Text>
            <Text> to recalibrate or when switching containers.</Text>
          </Text>
        </>
      ),
    }
    ],
  },
    {
  title: "Crop Monitor",
  slides: [
    {
      image: require("../assets/appGuide/ESP32 config.jpg"),
      text: (
        <>
        <Text>
           Open the{" "}
          <Text style={{ fontWeight: "bold" }}> Crop Monitor</Text>
          {" > "}
          tab to connect to the second IoT device and Click on </Text>
          <Text style={{ fontWeight: "bold" }}> Configure the Sensor.</Text>


          {"\n\n"}


          <Text>
            A connection guide is available in this tab &gt;
            <Text style={{ fontStyle: "italic", fontWeight: "bold" }}>
              {" "}How to Connect and Receive Data from Oksi
            </Text>
          </Text>
        </>
      ),
    },
    {
      image: require("../assets/appGuide/sensor data.jpg"),
      text:
      <Text>
          Tap{" "}
          <Text style={{ fontWeight: "bold" }}>View Sensor Data</Text>
          {" > "}
          after connecting. The button remains disabled until a connection is established.        
          </Text>
    },
    {
      image: require("../assets/appGuide/disconnect sensor.jpg"),
      text:
      <Text>
          To stop viewing data, press{" "}
          <Text style={{ fontWeight: "bold" }}>Disconnect</Text>
          {" > "}
          below the sensor readings.
          </Text>
    },
    ],
  },
    {
      title: "Statistics and Report",
     slides: [
    {
      image: require("../assets/appGuide/statistics.jpg"),
      text: (
        <>
          <Text>
            Go to the{" "}
            <Text style={{ fontWeight: "bold" }}>Statistics tab</Text>
            {" > "}
            select a{" "}
            <Text style={{ fontWeight: "bold" }}>Time Range</Text>
            {" > "}
            select a{" "}
            <Text style={{ fontWeight: "bold" }}>Crop</Text>
            {" "}
            (e.g., Okra) to view its recorded sensor data.
          </Text>
        </>
      ),
    },
    {
      image: require("../assets/appGuide/generate report.jpg"),
      text: (
        <>
          <Text>
            Click{" "}
            <Text style={{ fontWeight: "bold" }}>Generate Report</Text>
            {" > "}
            to save the selected crops data as a PDF or image.
          </Text>
        </>
      ),
    }
  ],
}
  ];


 const toggleDropdown = (index) => {
  if (openIndex === index) {
    setOpenIndex(null);
  } else {
    setOpenIndex(index);
    setSlideIndex((prev) => ({ ...prev, [index]: 0 }));
  }
};


 const nextSlide = (stepIndex, slides) => {
  setSlideIndex((prev) => {
    const current = prev[stepIndex] || 0;
    const next = current === slides.length - 1 ? 0 : current + 1;
    return { ...prev, [stepIndex]: next };
  });
};


const prevSlide = (stepIndex) => {
  setSlideIndex((prev) => {
    const current = prev[stepIndex] || 0;
    if (current === 0) return prev;
    return { ...prev, [stepIndex]: current - 1 };
  });
};


  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>How to use the app?</Text>
      <Text style={styles.subHeader}>
        Follow these steps to use the application properly.
      </Text>


   {steps.map((step, index) => {
      const stepSlides = step.slides;
      const currentSlide = slideIndex[index] || 0;
      const maxIndex = stepSlides.length - 1;
      const hasMultipleSlides = maxIndex > 0;


  return (
    <View
      key={index}
      style={[
        styles.card,
        index === steps.length - 1 && styles.lastCard   
      ]}
    >
      <TouchableOpacity onPress={() => toggleDropdown(index)}>
        <Text style={styles.stepTitle}>{step.title}</Text>
      </TouchableOpacity>


      {openIndex === index && (
        <View style={{ marginTop: 10 }}>
          {stepSlides.length > 0 ? (
            <>
              <View style={styles.slideWrapper}>


              {/* LEFT ARROW */}
              {hasMultipleSlides && (
                <TouchableOpacity
                  onPress={() => prevSlide(index)}
                  disabled={currentSlide === 0}
                  style={[
                    styles.sideArrow,
                    styles.leftArrow,
                    currentSlide === 0 && styles.disabledArrow
                  ]}
                >
                  <Text style={styles.arrowText}>{"<"}</Text>
                </TouchableOpacity>
              )}




              {/* IMAGE */}
              <Image
                source={stepSlides[currentSlide].image}
                style={styles.slideImage}
                resizeMode="contain"
              />


              {/* RIGHT ARROW */}
              {hasMultipleSlides && (
                <TouchableOpacity
                  onPress={() => nextSlide(index, stepSlides)}
                  style={[styles.sideArrow, styles.rightArrow]}
                >
                  <Text style={styles.arrowText}>{">"}</Text>
                </TouchableOpacity>
              )}


            </View>


              <View style={styles.slideText}>
              {stepSlides[currentSlide].content || (
                <Text>{stepSlides[currentSlide].text}</Text>
              )}
            </View>
            </>
          ) : null}
        </View>
      )}
    </View>
  );
})}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1f2933",
  },
  subHeader: {
    fontSize: 14,
    color: "#616e7c",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#cdf5bfff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#3a3d3aff",
  },
  stepDescription: {
    fontSize: 14,
    color: "#3a3d3aff",
  },


  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },


  arrowButton: {
    backgroundColor: "#111213ff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },


  slideWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    position: "relative",
  },
  sideArrow: {
  position: "absolute",
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10,
},
leftArrow: {
  left: 10,
},
rightArrow: {
  right: 10,
},
arrowText: {
  color: "#696b6cff",
  fontSize: 26,
},
  slideImage: {
  width: "100%",
  height: 330,
  borderRadius: 10,
  resizeMode: "contain",
  marginBottom: 10,
},
lastCard: {
  marginBottom: 40,   
},


});




