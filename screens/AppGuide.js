import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import useLanguage from "../hooks/useLanguage";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");
const CARD_RADIUS = 18;
const IMAGE_H = 280;

export default function AppGuideScreen() {
  const { lang, t, toggleLanguage } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState({});
  const pagerRefs = useRef({});

  const [sensorOpenIndex, setSensorOpenIndex] = useState(null);
  const [sensorSlideIndex, setSensorSlideIndex] = useState({});
  const sensorPagerRefs = useRef({});

  const [appPagerW, setAppPagerW] = useState(width - 32);
  const [sensorPagerW, setSensorPagerW] = useState(width - 32);

  const steps = useMemo(
    () => [
      {
        title: "Sign In / Create an Account",
        subtitle: t.GUIDE_SIGN_IN_SUB,
        slides: [
          {
            image: require("../assets/appGuide/LOGIN.jpg"),
            content: <Text style={styles.caption}>{t.GUIDE_SIGN_IN_SLIDE1}</Text>,
          },
          {
            image: require("../assets/appGuide/OTP_LOGIN.jpg"),
            content: <Text style={styles.caption}>{t.GUIDE_SIGN_IN_SLIDE2}</Text>,
          },
          {
            image: require("../assets/appGuide/VERIFY_OTP.jpg"),
            content: <Text style={styles.caption}>{t.GUIDE_SIGN_IN_SLIDE3}</Text>,
          },
        ],
      },

      {
        title: "General Settings",
        subtitle: "Manage notifications and profile information.",
        slides: [
          {
            image: require("../assets/appGuide/HOME.jpg"),
            content: (
              <>
                <Text style={styles.captionTitle}>Home</Text>
                <Text style={styles.caption}>
                  {t.GUIDE_HOME_DESC}{" "}
                  <Text style={styles.bold}>Weather Forecast</Text>,{" "}
                  <Text style={styles.bold}>Water Container Analysis</Text>, and{" "}
                  <Text style={styles.bold}>Crop Health</Text>.
                </Text>
              </>
            ),
          },
          {
            image: require("../assets/appGuide/WATER_ANALYSIS.jpg"),
            content: (
              <>
                <Text style={styles.captionTitle}>Water Container Analysis</Text>
                <Text style={styles.caption}>
                  {t.GUIDE_WATER_ANALYSIS_DESC}
                </Text>
              </>
            ),
          },
          {
            image: require("../assets/appGuide/SIDEBAR1.jpg"),
            content: (
              <Text style={styles.caption}>
                {t.GUIDE_SIDEBAR_DESCs}
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/SIDEBAR2.jpg"),
            content: (
              <>
                <Text style={styles.captionTitle}>Notification Settings</Text>
                <Text style={styles.caption}>{t.GUIDE_NOTIFICATION_DESC}</Text>
              </>
            ),
          },
          {
            image: require("../assets/appGuide/NOTIFICATIONS.jpg"),
            content: (
              <>
                <Text style={styles.captionTitle}>Notification Settings</Text>
                <Text style={styles.caption}>
                 {t.GUIDE_NOTIFICATION_VIEW_DESC}
                </Text>
              </>
            ),
          },
          {
            image: require("../assets/appGuide/PROFILE.jpg"),
            content: (
              <>
                <Text style={styles.captionTitle}>Profile Settings</Text>
                <Text style={styles.caption}>{t.GUIDE_PROFILE_DESC}</Text>
              </>
            ),
          },
        ],
      },
      {
        title: "Device Management",
        subtitle: "Set up and manage connected devices.",
        slides: [
          {
            image: require("../assets/appGuide/SIDEBAR1.jpg"),
            content: (
              <Text style={styles.caption}>
                Tap <Text style={styles.bold}>Device Management </Text>{t.GUIDE_DEVICE_TAP_DESC}
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/ADD_IOT.jpg"),
            content: (
              <Text style={styles.caption}>
                {t.GUIDE_ADD_DEVICE_DESC1}<Text style={styles.bold}>Add Device</Text> {t.GUIDE_ADD_DEVICE_DESC2}
                {"\n\n"}
                Enter the name of the device, <Text style={styles.bold}>Select Crop</Text>, and
                enter your <Text style={styles.bold}>WiFi Name and Password.</Text>
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/ACTIVE_IOT.jpg"),
            content: (
              <Text style={styles.caption}>
                If you want to <Text style={styles.bold}>Rename, Monitor, or Disconnect</Text> a
                device, tap on the device. You can manage it from there.
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/IOT_SUCCESS.jpg"),
            content: (
              <Text style={styles.caption}>
                {t.GUIDE_DEVICE_STATUS_DESC11}
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/DEV_MANAGEMENNT.png"),
            content: (
              <Text style={styles.caption}>
               {t.GUIDE_DEVICE_STATUS_DESC12}
              </Text>
            ),
          },
        ],
      },
      {
        title: "Calibration",
        subtitle: "Set up the water container calibration.",
        slides: [
          {
            image: require("../assets/appGuide/DEV_MANAGEMENNT.png"),
            content: (
              <Text style={styles.caption}>
                Tap <Text style={styles.bold}>Setup Tank</Text> {t.GUIDE_SETUP_TANK_DESC}
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/TANK_EXISTING.jpg"),
            content: (
              <Text style={styles.caption}>
               {t.GUIDE_SETUP_TANK_DESC11} <Text style={styles.bold}>Setup Tank</Text> {t.GUIDE_SETUP_TANK_DESC111}{" "}
                <Text style={styles.bold}>Use Existing</Text> or{" "}
                <Text style={styles.bold}>Recalibrate</Text> {t.GUIDE_SETUP_TANK_DESC1111}
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/TANK_CONNECT.jpg"),
            content: (
              <Text style={styles.caption}>
               {t.GUIDE_SETUP_TANK_DESC11111}<Text style={styles.bold}>Setup Tank.</Text>
                {"\n\n"}
                {t.GUIDE_SETUP_TANK_DESC22} <Text style={styles.bold}>Enter</Text>{" "}
                your <Text style={styles.bold}>WiFi name and password</Text>, then click{" "}
                <Text style={styles.bold}>Connect</Text>.
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/TANK_EMPTY.jpg"),
            content: (
              <Text style={styles.caption}>
               {t.GUIDE_SETUP_TANK_DESC2}{" "}
                <Text style={styles.bold}>Calibrate Empty</Text>.
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/TANK_FILLED.jpg"),
            content: (
              <Text style={styles.caption}>
                {t.GUIDE_SETUP_TANK_DESC222}{" "}
                <Text style={styles.bold}>Calibrate full.</Text>
              </Text>
            ),
          },
        ],
      },
      {
        title: "Crop Monitor",
        subtitle: "Connect to the sensor and view readings.",
        slides: [
          {
            image: require("../assets/appGuide/DEV_MANAGEMENNT.png"),
            content: (
              <Text style={styles.caption}>
                {t.GUIDE_CROP_ACCESS_DESC}
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/ACTIVE_IOT.jpg"),
            content: (
              <Text style={styles.caption}>
               {t.GUIDE_CROP_ACCESS_DESC1} <Text style={styles.bold}>Crop Monitor</Text> {t.GUIDE_CROP_ACCESS_DESC2}
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/MONITOR1.jpg"),
            content: (
              <>
                <Text style={styles.caption}>
                 {t.GUIDE_CROP_ACCESS_DESC3} <Text style={styles.bold}>Crop Monitor</Text>.
                  {"\n\n"}
                  {t.GUIDE_CROP_ACCESS_DESC4} <Text style={styles.bold}>Crop Environmental Data</Text>, including
                  temperature, humidity, light, and rain.
                </Text>
              </>
            ),
          },
          {
            image: require("../assets/appGuide/MONITOR2.jpg"),
            content: (
              <Text style={styles.caption}>
              {t.GUIDE_CROP_ACCESS_DESC5}
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
            image: require("../assets/appGuide/STATISTICS1.jpg"),
            content: (
              <Text style={styles.caption}>
                Go to <Text style={styles.bold}>Statistics</Text>, choose{" "}
                <Text style={styles.bold}>Time Range</Text>, then select a{" "}
                <Text style={styles.bold}>Crop</Text>.
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/STATISTICS2.jpg"),
            content: (
              <Text style={styles.caption}>
                Click <Text style={styles.bold}>Generate Report</Text> {t.GUIDE_STATS_STEP2_DESC}
              </Text>
            ),
          },
          {
            image: require("../assets/appGuide/STATISTICS3.jpg"),
            content: (
              <Text style={styles.caption}>{t.GUIDE_STATS_OVERVIEW_DESC}</Text>
            ),
          },
        ],
      },
    ],
    []
  [t]);

  const sensorGuide = useMemo(
    () => [
      {
        title: "How to use the device",
        subtitle: t.SENSOR_USE_SUB,
        slides: [
          {
            image: require("../assets/appGuide/PWR_BTN.png"),
            content: <Text style={styles.caption}>{t.SENSOR_SLIDE1}</Text>,
          },
          {
            image: require("../assets/appGuide/PWR.png"),
            content: <Text style={styles.caption}>{t.SENSOR_SLIDE2}</Text>,
          },
          {
            image: require("../assets/appGuide/MAIN_CTRL.png"),
            content: (
              <Text style={styles.caption}>
                {t.SENSOR_SLIDE3}
              </Text>
            ),
          },
        ],
      },
    ],
    []
  [t]);

  const toggle = (idx) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex((prev) => (prev === idx ? null : idx));
    setSlideIndex((prev) => {
      if (prev[idx] == null) return { ...prev, [idx]: 0 };
      return prev;
    });
  };

  const toggleSensor = (idx) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSensorOpenIndex((prev) => (prev === idx ? null : idx));
    setSensorSlideIndex((prev) => {
      if (prev[idx] == null) return { ...prev, [idx]: 0 };
      return prev;
    });
  };

  const setStepSlide = (stepIdx, newIndex) => {
    setSlideIndex((prev) => ({ ...prev, [stepIdx]: newIndex }));
  };

  const setSensorStepSlide = (stepIdx, newIndex) => {
    setSensorSlideIndex((prev) => ({ ...prev, [stepIdx]: newIndex }));
  };

  const scrollToSlide = (stepIdx, toIdx) => {
    const slidesLen = steps[stepIdx].slides.length;
    const clamped = Math.max(0, Math.min(toIdx, slidesLen - 1));
    const ref = pagerRefs.current[stepIdx];
    if (ref && ref.scrollTo) ref.scrollTo({ x: clamped * appPagerW, y: 0, animated: true });
    setStepSlide(stepIdx, clamped);
  };

  const scrollToSensorSlide = (stepIdx, toIdx) => {
    const slidesLen = sensorGuide[stepIdx].slides.length;
    const clamped = Math.max(0, Math.min(toIdx, slidesLen - 1));
    const ref = sensorPagerRefs.current[stepIdx];
    if (ref && ref.scrollTo)
      ref.scrollTo({ x: clamped * sensorPagerW, y: 0, animated: true });
    setSensorStepSlide(stepIdx, clamped);
  };

  const onPagerScrollEnd = (stepIdx, e) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / appPagerW);
    setStepSlide(stepIdx, idx);
  };

  const onSensorPagerScrollEnd = (stepIdx, e) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / sensorPagerW);
    setSensorStepSlide(stepIdx, idx);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* APP GUIDE */}
      <View style={styles.section}>
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
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => toggle(idx)}
                  style={styles.itemHeader}
                >
                  <View style={styles.leftRail}>
                    <View style={[styles.dot, isOpen && styles.dotActive]} />
                    {idx !== steps.length - 1 && <View style={styles.railLine} />}
                  </View>

                  <View style={styles.headerTextWrap}>
                    <Text style={styles.title}>{step.title}</Text>
                    <Text style={styles.subtitle}>{step.subtitle}</Text>
                  </View>

                  <View style={[styles.chevPill, isOpen && styles.chevPillOpen]}>
                    <Text style={[styles.chev, isOpen && styles.chevOpen]}>⌄</Text>
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.body}>
                    <View
                      style={styles.pagerWrap}
                      onLayout={(e) => {
                        const w = Math.floor(e.nativeEvent.layout.width);
                        if (w > 0 && w !== appPagerW) setAppPagerW(w);
                      }}
                    >
                      <ScrollView
                        ref={(r) => (pagerRefs.current[idx] = r)}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={appPagerW}
                        decelerationRate="fast"
                        onMomentumScrollEnd={(e) => onPagerScrollEnd(idx, e)}
                      >
                        {slides.map((sl, sIdx) => (
                          <View key={sIdx} style={[styles.page, { width: appPagerW }]}>
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
                        <Text style={[styles.ctrlText, active === 0 && styles.ctrlTextDisabled]}>
                          Back
                        </Text>
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
      </View>

      {/* SENSOR GUIDE */}
      <View style={styles.sectionAlt}>
        <View style={styles.heroSensor}>
          <Text style={styles.h1}>Sensor Guide</Text>
          <Text style={styles.h2}>Tap a section, then swipe screenshots left/right.</Text>
        </View>

        <View style={styles.list}>
          {sensorGuide.map((g, idx) => {
            const isOpen = sensorOpenIndex === idx;
            const slides = g.slides || [];
            const active = sensorSlideIndex[idx] || 0;

            return (
              <View key={`sensor-${idx}`} style={[styles.item, isOpen && styles.itemOpen]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => toggleSensor(idx)}
                  style={styles.itemHeader}
                >
                  <View style={styles.leftRail}>
                    <View style={[styles.dot, isOpen && styles.dotActive]} />
                    {idx !== sensorGuide.length - 1 && <View style={styles.railLine} />}
                  </View>

                  <View style={styles.headerTextWrap}>
                    <Text style={styles.title}>{g.title}</Text>
                    <Text style={styles.subtitle}>{g.subtitle}</Text>
                  </View>

                  <View style={[styles.chevPill, isOpen && styles.chevPillOpen]}>
                    <Text style={[styles.chev, isOpen && styles.chevOpen]}>⌄</Text>
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.body}>
                    <View
                      style={styles.pagerWrap}
                      onLayout={(e) => {
                        const w = Math.floor(e.nativeEvent.layout.width);
                        if (w > 0 && w !== sensorPagerW) setSensorPagerW(w);
                      }}
                    >
                      <ScrollView
                        ref={(r) => (sensorPagerRefs.current[idx] = r)}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={sensorPagerW}
                        decelerationRate="fast"
                        onMomentumScrollEnd={(e) => onSensorPagerScrollEnd(idx, e)}
                      >
                        {slides.map((sl, sIdx) => (
                          <View key={sIdx} style={[styles.page, { width: sensorPagerW }]}>
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
                        onPress={() => scrollToSensorSlide(idx, active - 1)}
                        disabled={active === 0}
                        style={[styles.ctrlBtn, active === 0 && styles.ctrlBtnDisabled]}
                      >
                        <Text style={[styles.ctrlText, active === 0 && styles.ctrlTextDisabled]}>
                          Back
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.dotsRow}>
                        {slides.map((_, dIdx) => (
                          <TouchableOpacity
                            key={dIdx}
                            activeOpacity={0.8}
                            onPress={() => scrollToSensorSlide(idx, dIdx)}
                            style={[styles.pageDot, dIdx === active && styles.pageDotActive]}
                          />
                        ))}
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => scrollToSensorSlide(idx, active + 1)}
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

                    {/* NOTES / REMINDERS */}
                    <View style={styles.noteWrap}>
                      <Text style={styles.noteTitle}>Notes & Reminders</Text>
                      <View style={styles.noteBox}>
                        <Text style={styles.noteText}>
                          • {t.NOTE_1}
                          {"\n"}• {t.NOTE_2}
                          {"\n"}• {t.NOTE_3}
                          {"\n"}• {t.NOTE_4}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F6FB" },
  content: { padding: 18, paddingBottom: 28, gap: 16 },

  section: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.10)",
  },
  sectionAlt: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: "#EEF2F7",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },

  hero: { paddingTop: 6, paddingBottom: 14, paddingHorizontal: 2 },
  heroSensor: { paddingTop: 2, paddingBottom: 12, paddingHorizontal: 2 },

  h1: { fontSize: 30, fontWeight: "900", color: "#0F172A", letterSpacing: 0.2 },
  h2: { marginTop: 6, fontSize: 13, lineHeight: 18, color: "#64748B", fontWeight: "600" },

  list: { gap: 14 },

  item: {
    borderRadius: CARD_RADIUS,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
    shadowColor: "#0B1220",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  itemOpen: { borderColor: "rgba(37, 99, 235, 0.22)" },

  itemHeader: { paddingVertical: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },

  leftRail: { width: 22, alignItems: "center", alignSelf: "stretch", paddingTop: 6 },
  dot: { width: 9, height: 9, borderRadius: 999, backgroundColor: "rgba(148, 163, 184, 0.95)" },
  dotActive: { backgroundColor: "rgba(37, 99, 235, 0.95)" },
  railLine: {
    marginTop: 8,
    width: 2,
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.10)",
    borderRadius: 999,
    minHeight: 14,
  },

  headerTextWrap: { flex: 1, paddingRight: 10 },

  title: { fontSize: 15.5, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 4, fontSize: 12.5, lineHeight: 17, color: "#64748B", fontWeight: "600" },

  chevPill: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#EEF2F7",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  chevPillOpen: { backgroundColor: "#EAF0FF", borderColor: "rgba(37, 99, 235, 0.16)" },
  chev: { fontSize: 16, fontWeight: "900", color: "#334155", marginTop: -2 },
  chevOpen: { transform: [{ rotate: "180deg" }] },

  body: { paddingTop: 2, paddingBottom: 14 },

  pagerWrap: { width: "100%" },

  page: { paddingHorizontal: 14, paddingTop: 10 },

  imageCard: {
    height: IMAGE_H,
    borderRadius: 16,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },

  textCard: {
    marginTop: 10,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },

  controls: { marginTop: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },

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
  ctrlBtnPrimary: { backgroundColor: "#2563EB", borderColor: "rgba(37, 99, 235, 0.35)" },
  ctrlBtnDisabled: { backgroundColor: "#E2E8F0", borderColor: "rgba(15, 23, 42, 0.06)" },

  ctrlText: { fontSize: 12.5, fontWeight: "900", color: "#0F172A", letterSpacing: 0.2 },
  ctrlTextPrimary: { color: "#FFFFFF" },
  ctrlTextDisabled: { color: "#64748B" },

  dotsRow: { flex: 1, flexDirection: "row", justifyContent: "center", gap: 6 },
  pageDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: "rgba(148, 163, 184, 0.6)" },
  pageDotActive: { width: 18, backgroundColor: "rgba(37, 99, 235, 0.95)" },

  captionTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A", marginBottom: 6 },
  caption: { fontSize: 13.5, lineHeight: 19, fontWeight: "650", color: "#0F172A" },
  note: { fontSize: 12.5, lineHeight: 18, fontWeight: "600", color: "#475569" },

  bold: { fontWeight: "900" },
  italic: { fontStyle: "italic" },

  /* STYLES FOR NOTES / REMINDERS */
  noteWrap: {
    marginTop: 12,
    paddingHorizontal: 14,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  noteBox: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.18)",
  },
  noteText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "650",
    color: "#0F172A",
  },
});