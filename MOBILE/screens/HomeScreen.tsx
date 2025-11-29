import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { MainTabParamList } from "@/navigation/MainTabNavigator";
import Spacer from "@/components/Spacer";

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, "Home">,
  BottomTabNavigationProp<MainTabParamList>
>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const { 
    employee, 
    todayAttendance, 
    checkIn, 
    checkOut, 
    announcements,
    fetchTodayAttendance,
    fetchAttendanceAfterPunch 
  } = useHRMSStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPunching, setIsPunching] = useState(false);
  const [punchError, setPunchError] = useState<string | null>(null);

  const punchScale = useSharedValue(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance when screen loads
  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Convert decimal hours to "X hours Y minutes" format
  const formatTotalHours = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    if (h === 0 && m === 0) return "0 minutes";
    if (h === 0) return `${m} minute${m !== 1 ? 's' : ''}`;
    if (m === 0) return `${h} hour${h !== 1 ? 's' : ''}`;
    return `${h} hour${h !== 1 ? 's' : ''} ${m} minute${m !== 1 ? 's' : ''}`;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const captureSelfie = async (): Promise<string | null> => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to capture selfie for attendance.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          // Return base64 image with data URI prefix
          return `data:image/png;base64,${asset.base64}`;
        }
      }
      return null;
    } catch (error) {
      console.error('Error capturing selfie:', error);
      Alert.alert('Error', 'Failed to capture selfie. Please try again.');
      return null;
    }
  };

  const handlePunch = async () => {
    if (isPunching) return;
    
    setPunchError(null); // Clear previous errors
    setIsPunching(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      // Capture selfie first
      const selfieBase64 = await captureSelfie();
      if (!selfieBase64) {
        setIsPunching(false);
        setPunchError("Selfie capture is required for attendance.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Use last_login_status (opposite logic)
      // If last_login_status is "checkin" → perform "Check Out"
      // If last_login_status is "checkout" → perform "Check In"
      const lastStatus = todayAttendance?.lastLoginStatus?.toLowerCase();
      const shouldCheckIn = !lastStatus || lastStatus === "checkout";
      
      if (shouldCheckIn) {
        // Check In with selfie
        const result = await checkIn([selfieBase64]);
        if (!result.success) {
          setPunchError(result.error || "Check-in failed. Please try again.");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          // Immediately call GET API after successful check-in
          console.log('Calling GET API after check-in...');
          await fetchAttendanceAfterPunch();
          console.log('Attendance data fetched after check-in');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // Check Out with selfie
        const result = await checkOut([selfieBase64]);
        if (!result.success) {
          setPunchError(result.error || "Check-out failed. Please try again.");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          // Immediately call GET API after successful check-out
          console.log('Calling GET API after check-out...');
          await fetchAttendanceAfterPunch();
          console.log('Attendance data fetched after check-out');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      setPunchError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPunching(false);
    }
  };

  const punchAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: punchScale.value }],
  }));

  const getStatus = () => {
    if (!todayAttendance) return { text: "Not Checked In", color: theme.textMuted };
    if (todayAttendance.checkOut) return { text: "Checked Out", color: Colors.dark.success };
    if (todayAttendance.status === "late") return { text: "Present (Late)", color: Colors.dark.warning };
    return { text: "Present", color: Colors.dark.success };
  };

  const status = getStatus();
  const unreadAnnouncements = announcements.filter((a) => !a.isRead).length;

  const shortcuts = [
    { icon: "calendar" as const, label: "Attendance", onPress: () => navigation.navigate("AttendanceTab") },
    { icon: "briefcase" as const, label: "Leaves", onPress: () => navigation.navigate("LeaveTab") },
    { icon: "check-square" as const, label: "Tasks", onPress: () => navigation.navigate("TaskTab") },
    { icon: "dollar-sign" as const, label: "Payroll", onPress: () => navigation.navigate("Payroll") },
    { icon: "gift" as const, label: "Holidays", onPress: () => navigation.navigate("Holidays") },
    { icon: "bell" as const, label: "Notices", onPress: () => navigation.navigate("Announcements"), badge: unreadAnnouncements },
  ];

  return (
    <ScreenScrollView>
      <View style={styles.greetingSection}>
        <ThemedText type="h3">{getGreeting()},</ThemedText>
        <ThemedText type="h2" style={{ color: Colors.dark.primary }}>
          {employee.name}
        </ThemedText>
        <ThemedText style={[styles.date, { color: theme.textMuted }]}>
          {formatDate(currentTime)}
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={[styles.clockCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h1" style={styles.clock}>
          {formatTime(currentTime)}
        </ThemedText>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <ThemedText style={{ color: status.color }}>{status.text}</ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.xl} />

      {/* Error Message */}
      {punchError ? (
        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor: Colors.dark.error + "20",
              borderColor: Colors.dark.error,
            },
          ]}
        >
          <Feather name="alert-circle" size={18} color={Colors.dark.error} />
          <ThemedText style={[styles.errorText, { color: Colors.dark.error }]}>
            {punchError}
          </ThemedText>
          <Pressable
            onPress={() => setPunchError(null)}
            style={styles.errorCloseButton}
          >
            <Feather name="x" size={16} color={Colors.dark.error} />
          </Pressable>
        </View>
      ) : null}

      {punchError ? <Spacer height={Spacing.lg} /> : null}

      {/* Determine button state based on last_login_status (opposite logic) */}
      {(() => {
        const lastStatus = todayAttendance?.lastLoginStatus?.toLowerCase();
        
        // Determine button state:
        // Priority 1: Use last_login_status (opposite logic)
        // Priority 2: Fallback to checkIn/checkOut fields
        let shouldShowCheckIn: boolean;
        
        if (lastStatus) {
          // Opposite logic: Button shows opposite of last_login_status
          // If last_login_status is "checkin" → show "Check Out" button
          // If last_login_status is "checkout" → show "Check In" button
          shouldShowCheckIn = lastStatus === "checkout";
        } else {
          // Fallback: If no last_login_status, use checkIn/checkOut
          shouldShowCheckIn = !todayAttendance?.checkIn;
        }
        
        // Only disable when processing - allow multiple check-ins/check-outs
        const isDisabled = Boolean(isPunching);
        
        return (
          <AnimatedPressable
            onPress={handlePunch}
            disabled={isDisabled}
            onPressIn={() => {
              if (!isDisabled) {
                punchScale.value = withSpring(0.95);
              }
            }}
            onPressOut={() => {
              punchScale.value = withSpring(1);
            }}
            style={[
              styles.punchButton,
              punchAnimStyle,
              {
                backgroundColor: isDisabled
                  ? theme.backgroundSecondary
                  : Colors.dark.primary,
                opacity: isDisabled ? 0.6 : 1,
              },
            ]}
          >
            <Feather
              name={shouldShowCheckIn ? "log-in" : "log-out"}
              size={32}
              color={isDisabled ? theme.textMuted : "#000000"}
            />
            <ThemedText
              style={[
                styles.punchButtonText,
                {
                  color: isDisabled ? theme.textMuted : "#000000",
                },
              ]}
            >
              {isPunching
                ? "Processing..."
                : shouldShowCheckIn
                ? "Check In"
                : "Check Out"}
            </ThemedText>
            {todayAttendance?.checkIn && !todayAttendance?.checkOut && (
              <ThemedText
                type="small"
                style={{ color: theme.textMuted, marginTop: Spacing.xs }}
              >
                Checked in at {todayAttendance.checkIn}
              </ThemedText>
            )}
            {todayAttendance?.checkOut && (
              <ThemedText
                type="small"
                style={{ color: theme.textMuted, marginTop: Spacing.xs }}
              >
                Checked out at {todayAttendance.checkOut}
              </ThemedText>
            )}
          </AnimatedPressable>
        );
      })()}

      <Spacer height={Spacing.xl} />

      {todayAttendance ? (
        <View
          style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <ThemedText type="h4" style={styles.summaryTitle}>
            Today's Attendance Details
          </ThemedText>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Feather name="log-in" size={20} color={Colors.dark.success} />
              <View style={styles.summaryItemContent}>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  Check In
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {todayAttendance.checkIn || "--:--"}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <Feather name="log-out" size={20} color={Colors.dark.error} />
              <View style={styles.summaryItemContent}>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  Check Out
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {todayAttendance.checkOut || "--:--"}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <Feather name="clock" size={20} color={Colors.dark.primary} />
              <View style={styles.summaryItemContent}>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  Total Hours
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {formatTotalHours(todayAttendance.totalHours)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <Feather 
                name={todayAttendance.status === "late" ? "alert-circle" : "check-circle"} 
                size={20} 
                color={
                  todayAttendance.status === "late" 
                    ? Colors.dark.warning 
                    : todayAttendance.status === "present"
                    ? Colors.dark.success
                    : theme.textMuted
                } 
              />
              <View style={styles.summaryItemContent}>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  Status
                </ThemedText>
                <ThemedText 
                  type="body" 
                  style={{ 
                    fontWeight: "600",
                    color: todayAttendance.status === "late" 
                      ? Colors.dark.warning 
                      : todayAttendance.status === "present"
                      ? Colors.dark.success
                      : theme.text
                  }}
                >
                  {todayAttendance.status.charAt(0).toUpperCase() + todayAttendance.status.slice(1).replace("-", " ")}
                </ThemedText>
              </View>
            </View>
            
            {todayAttendance.shiftName && (
              <View style={styles.summaryItem}>
                <Feather name="calendar" size={20} color={Colors.dark.primary} />
                <View style={styles.summaryItemContent}>
                  <ThemedText type="small" style={{ color: theme.textMuted }}>
                    Shift
                  </ThemedText>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    {todayAttendance.shiftName}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>
      ) : null}

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4" style={styles.sectionTitle}>
        Quick Access
      </ThemedText>

      <Spacer height={Spacing.lg} />

      <View style={styles.shortcutsGrid}>
        {shortcuts.map((shortcut, index) => (
          <Pressable
            key={index}
            onPress={shortcut.onPress}
            style={({ pressed }) => [
              styles.shortcutItem,
              { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={styles.shortcutIconContainer}>
              <Feather name={shortcut.icon} size={24} color={Colors.dark.primary} />
              {shortcut.badge ? (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{shortcut.badge}</ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText type="small" style={styles.shortcutLabel}>
              {shortcut.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Spacer height={Spacing["3xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  greetingSection: {
    marginBottom: Spacing.sm,
  },
  date: {
    marginTop: Spacing.xs,
  },
  clockCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  clock: {
    fontSize: 40,
    fontWeight: "300",
    letterSpacing: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  punchButton: {
    width: "100%",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  punchButtonText: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: Spacing.md,
    letterSpacing: 0.5,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  summaryTitle: {
    marginBottom: Spacing.lg,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    width: "48%",
  },
  summaryItemContent: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  shortcutsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  shortcutItem: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
  },
  shortcutIconContainer: {
    position: "relative",
    marginBottom: Spacing.sm,
  },
  shortcutLabel: {
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -12,
    backgroundColor: Colors.dark.error,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  errorCloseButton: {
    padding: Spacing.xs,
  },
});
