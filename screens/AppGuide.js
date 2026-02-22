import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");
const CARD_RADIUS = 18;
const IMAGE_H = 280;

export default function AppGuideScreen() {
  const [openIndex, setOpenIndex] = useState(0); // open first by default
  const [slideIndex, setSlideIndex] = useState({}); // { [stepIndex]: slideIndex }
  const pagerRefs = useRef({}); // { [stepIndex]: ScrollView ref }

  const steps = useMemo(
    () => [
      {
        title: "Sign In / Create an Account",
        subtitle: "Log in securely with OTP verification.",
        slides: [
          {
            image: require("../assets/appGuide/signin.jpg"),
            content: <Text style={styles.caption}>Enter your credentials to sign in.</Text>,
          },
          {
            image: require("../assets/appGuide/signinOTP.jpg"),
            content: <Text style={styles.caption}>Tap “Proceed” to enter your OTP.</Text>,
          },
          {
            image: require("../assets/appGuide/OTPverification.jpg"),
            content: <Text style={styles.caption}>Enter the OTP sent to your email.</Text>,
          },
        ],
      },
      {
        title: "General Settings",
        subtitle: "Manage notifications and profile information.",
        slides: [
          {
            image: require("../assets/appGuide/notificationSettings.jpg"),
            content: (
              <>
                <Text style={styles.captionTitle}>Notification Settings</Text>
                <Text style={styles.caption}>Select which notifications you want to receive.</Text>
              </>
            ),
          },
          {
            image: require("../assets/appGuide/profileSettings.jpg"),
            content: (
              <>
                <Text style={styles.captionTitle}>Profile Settings</Text>
                <Text style={styles.caption}>View and edit profile information.</Text>
              </>
            ),
          },
        ],
      },
      {
        title: "Calibration",
        subtitle: "Set up the water container calibration.",
        slides: [
          {
            image: require("../assets/appGuide/water calibration.jpg"),
            content: (
              <Text style={styles.caption}>
                Tap <Text style={styles.bold}>Setup Water Calibration</Text>.
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/full water calibration.jpg"),
            content: (
              <>
                <Text style={styles.caption}>
                  Calibrate “Full” to determine the container&apos;s water level.
                </Text>
                <View style={{ height: 8 }} />
                <Text style={styles.note}>
                  Note: If calibration already exists, the app will reuse it. Tap{" "}
                  <Text style={styles.bold}>Reset</Text> to recalibrate or when switching containers.
                </Text>
              </>
            ),
          },
        ],
      },
      {
        title: "Crop Monitor",
        subtitle: "Connect to the sensor and view readings.",
        slides: [
          {
            image: require("../assets/appGuide/ESP32 config.jpg"),
            content: (
              <>
                <Text style={styles.caption}>
                  Open <Text style={styles.bold}>Crop Monitor</Text> and tap{" "}
                  <Text style={styles.bold}>Configure the Sensor</Text>.
                </Text>
                <View style={{ height: 8 }} />
                <Text style={styles.note}>
                  Guide available:{" "}
                  <Text style={[styles.bold, styles.italic]}>How to Connect and Receive Data from Oksi</Text>
                </Text>
              </>
            ),
          },
          {
            image: require("../assets/appGuide/sensor data.jpg"),
            content: (
              <Text style={styles.caption}>
                Tap <Text style={styles.bold}>View Sensor Data</Text> after connecting.
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/disconnect sensor.jpg"),
            content: (
              <Text style={styles.caption}>
                Tap <Text style={styles.bold}>Disconnect</Text> to stop viewing data.
              </Text>
            ),
          },
        ],
      },
      {
        title: "Statistics and Report",
        subtitle: "Review history and export reports.",
        slides: [
          {
            image: require("../assets/appGuide/statistics.jpg"),
            content: (
              <Text style={styles.caption}>
                Go to <Text style={styles.bold}>Statistics</Text>, choose{" "}
                <Text style={styles.bold}>Time Range</Text>, then select a{" "}
                <Text style={styles.bold}>Crop</Text>.
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/generate report.jpg"),
            content: (
              <Text style={styles.caption}>
                Tap <Text style={styles.bold}>Generate Report</Text> to save as PDF or image.
              </Text>
            ),
          },
        ],
      },
    ],
    []
  );

  const toggle = (idx) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex((prev) => (prev === idx ? null : idx));
    setSlideIndex((prev) => {
      if (prev[idx] == null) return { ...prev, [idx]: 0 };
      return prev;
    });
  };

  const setStepSlide = (stepIdx, newIndex) => {
    setSlideIndex((prev) => ({ ...prev, [stepIdx]: newIndex }));
  };

  const scrollToSlide = (stepIdx, toIdx) => {
    const clamped = Math.max(0, Math.min(toIdx, steps[stepIdx].slides.length - 1));
    const ref = pagerRefs.current[stepIdx];
    if (ref && ref.scrollTo) {
      ref.scrollTo({ x: clamped * (width - 32), y: 0, animated: true });
    }
    setStepSlide(stepIdx, clamped);
  };

  const onPagerScrollEnd = (stepIdx, e) => {
    const x = e.nativeEvent.contentOffset.x;
    const pageW = width - 32;
    const idx = Math.round(x / pageW);
    setStepSlide(stepIdx, idx);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.h1}>App Guide</Text>
        <Text style={styles.h2}>Tap a section, then swipe screenshots left/right.</Text>
      </View>

      <View style={styles.list}>
        {steps.map((step, idx) => {
          const isOpen = openIndex === idx;
          const slides = step.slides || [];
          const active = slideIndex[idx] || 0;

          return (
            <View key={idx} style={[styles.item, isOpen && styles.itemOpen]}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => toggle(idx)} style={styles.itemHeader}>
                <View style={styles.leftRail}>
                  <View style={[styles.dot, isOpen && styles.dotActive]} />
                  {idx !== steps.length - 1 && <View style={styles.railLine} />}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{step.title}</Text>
                  <Text style={styles.subtitle}>{step.subtitle}</Text>
                </View>

                <View style={[styles.chevBox, isOpen && styles.chevBoxOpen]}>
                  <Text style={[styles.chev, isOpen && styles.chevOpen]}>⌄</Text>
                </View>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.body}>
                  <View style={styles.pagerWrap}>
                    <ScrollView
                      ref={(r) => (pagerRefs.current[idx] = r)}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={width - 32}
                      decelerationRate="fast"
                      contentContainerStyle={styles.pagerContent}
                      onMomentumScrollEnd={(e) => onPagerScrollEnd(idx, e)}
                    >
                      {slides.map((sl, sIdx) => (
                        <View key={sIdx} style={styles.page}>
                          <View style={styles.imageCard}>
                            <Image source={sl.image} style={styles.image} resizeMode="contain" />
                          </View>

                          <View style={styles.textCard}>{sl.content}</View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.controls}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => scrollToSlide(idx, active - 1)}
                      disabled={active === 0}
                      style={[styles.ctrlBtn, active === 0 && styles.ctrlBtnDisabled]}
                    >
                      <Text style={[styles.ctrlText, active === 0 && styles.ctrlTextDisabled]}>Back</Text>
                    </TouchableOpacity>

                    <View style={styles.dotsRow}>
                      {slides.map((_, dIdx) => (
                        <TouchableOpacity
                          key={dIdx}
                          activeOpacity={0.8}
                          onPress={() => scrollToSlide(idx, dIdx)}
                          style={[styles.pageDot, dIdx === active && styles.pageDotActive]}
                        />
                      ))}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => scrollToSlide(idx, active + 1)}
                      disabled={active === slides.length - 1}
                      style={[
                        styles.ctrlBtn,
                        styles.ctrlBtnPrimary,
                        active === slides.length - 1 && styles.ctrlBtnDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.ctrlText,
                          styles.ctrlTextPrimary,
                          active === slides.length - 1 && styles.ctrlTextDisabled,
                        ]}
                      >
                        Next
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FB" },
  content: { padding: 16, paddingBottom: 28 },

  hero: {
    paddingVertical: 8,
    marginBottom: 10,
  },
  h1: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  h2: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  list: { gap: 12 },

  item: {
    borderRadius: CARD_RADIUS,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
    shadowColor: "#0B1220",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  itemOpen: {
    borderColor: "rgba(37, 99, 235, 0.22)",
  },

  itemHeader: {
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },

  leftRail: {
    width: 18,
    alignItems: "center",
    paddingTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.9)",
  },
  dotActive: {
    backgroundColor: "rgba(37, 99, 235, 0.95)",
  },
  railLine: {
    marginTop: 8,
    width: 2,
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.10)",
    borderRadius: 999,
    minHeight: 18,
  },

  title: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 17,
    color: "#64748B",
    fontWeight: "600",
  },

  chevBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  chevBoxOpen: {
    backgroundColor: "#EEF2FF",
    borderColor: "rgba(37, 99, 235, 0.18)",
  },
  chev: {
    fontSize: 16,
    fontWeight: "900",
    color: "#334155",
    marginTop: -2,
  },
  chevOpen: {
    transform: [{ rotate: "180deg" }],
  },

  body: {
    paddingTop: 2,
    paddingBottom: 14,
  },

  pagerWrap: {
    width: "100%",
  },
  pagerContent: {
    // no extra padding; each page controls its padding
  },
  page: {
    width: width - 32,
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  imageCard: {
    height: IMAGE_H,
    borderRadius: 16,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },

  textCard: {
    marginTop: 10,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },

  controls: {
    marginTop: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  ctrlBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlBtnPrimary: {
    backgroundColor: "#2563EB",
    borderColor: "rgba(37, 99, 235, 0.35)",
  },
  ctrlBtnDisabled: {
    backgroundColor: "#E2E8F0",
    borderColor: "rgba(15, 23, 42, 0.06)",
  },

  ctrlText: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  ctrlTextPrimary: {
    color: "#FFFFFF",
  },
  ctrlTextDisabled: {
    color: "#64748B",
  },

  dotsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.6)",
  },
  pageDotActive: {
    width: 18,
    backgroundColor: "rgba(37, 99, 235, 0.95)",
  },

  captionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },
  caption: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: "650",
    color: "#0F172A",
  },
  note: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "600",
    color: "#475569",
  },

  bold: { fontWeight: "900" },
  italic: { fontStyle: "italic" },
});