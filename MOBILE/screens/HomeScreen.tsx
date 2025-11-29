import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, Platform } from "react-native";
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

  // Validate captured image - check if it's a real person, not a photo of screen/object
  const validateSelfieImage = async (base64Image: string): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      try {
        if (Platform.OS === 'web') {
          // Web validation
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve({ valid: false, error: 'Image validation failed' });
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Check 1: Image dimensions (should be reasonable size)
            if (img.width < 200 || img.height < 200) {
              resolve({ valid: false, error: 'Image is too small. Please capture a clear photo.' });
              return;
            }

            // Check overall image brightness to detect low light conditions
            // Optimized: Use fewer samples for faster processing
            let totalBrightness = 0;
            const brightnessSampleSize = 300; // Reduced from 500 for better performance
            const stepX = Math.max(1, Math.floor(canvas.width / 20));
            const stepY = Math.max(1, Math.floor(canvas.height / 20));
            
            // Use grid sampling instead of random for better performance
            for (let y = 0; y < canvas.height; y += stepY) {
              for (let x = 0; x < canvas.width; x += stepX) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                // Calculate brightness (luminance)
                const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
                totalBrightness += brightness;
              }
            }
            const sampleCount = Math.floor(canvas.width / stepX) * Math.floor(canvas.height / stepY);
            const avgBrightness = totalBrightness / sampleCount;
            const isLowLight = avgBrightness < 60; // Low light threshold

            // Check 2: Check for screenshot patterns (uniform borders, specific color patterns)
            // Screenshots often have very uniform edges, but skip this check in low light
            if (!isLowLight) {
              const edgeSampleSize = 10;
              const topEdge = [];
              const bottomEdge = [];
              const leftEdge = [];
              const rightEdge = [];

              // Sample edges
              for (let i = 0; i < edgeSampleSize; i++) {
                // Top edge
                const topIdx = (i * 4) + (0 * canvas.width * 4);
                topEdge.push(data[topIdx], data[topIdx + 1], data[topIdx + 2]);

                // Bottom edge
                const bottomIdx = ((canvas.height - 1) * canvas.width * 4) + (i * 4);
                bottomEdge.push(data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]);

                // Left edge
                const leftIdx = (i * canvas.width * 4) + (0 * 4);
                leftEdge.push(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]);

                // Right edge
                const rightIdx = (i * canvas.width * 4) + ((canvas.width - 1) * 4);
                rightEdge.push(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]);
              }

              // Check if edges are too uniform (screenshot indicator)
              // Use stricter threshold for bright images
              const checkUniformity = (edge: number[]) => {
                if (edge.length < 9) return false;
                const avg = edge.reduce((a, b) => a + b, 0) / edge.length;
                const variance = edge.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / edge.length;
                return variance < 50; // Stricter threshold for bright images
              };

              const edgesUniform = 
                checkUniformity(topEdge) && 
                checkUniformity(bottomEdge) && 
                checkUniformity(leftEdge) && 
                checkUniformity(rightEdge);

              if (edgesUniform) {
                resolve({ valid: false, error: 'Please capture a live photo, not a screenshot or photo of a screen.' });
                return;
              }
            }

            // Check 3: Face detection - basic check for face-like patterns
            // Look for skin tone regions and face-like structures in center area
            const centerX = Math.floor(canvas.width / 2);
            const centerY = Math.floor(canvas.height / 2);
            const checkSize = Math.min(canvas.width, canvas.height) * 0.4;
            const startX = Math.max(0, centerX - checkSize / 2);
            const startY = Math.max(0, centerY - checkSize / 2);
            const endX = Math.min(canvas.width, centerX + checkSize / 2);
            const endY = Math.min(canvas.height, centerY + checkSize / 2);

            let skinTonePixels = 0;
            let totalPixels = 0;
            let centerBrightness = 0;

            // Check for skin tone colors in center area (where face should be)
            for (let y = startY; y < endY; y += 5) {
              for (let x = startX; x < endX; x += 5) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
                centerBrightness += brightness;

                // Basic skin tone detection - adjust ranges for low light
                let isSkinTone = false;
                if (isLowLight) {
                  // More lenient skin tone detection for low light
                  isSkinTone = 
                    r > 30 && r < 255 &&
                    g > 20 && g < 240 &&
                    b > 15 && b < 200 &&
                    brightness > 20; // At least some brightness
                } else {
                  // Normal light skin tone detection
                  isSkinTone = 
                    r > 95 && r < 255 &&
                    g > 40 && g < 240 &&
                    b > 20 && b < 200 &&
                    r > g && r > b &&
                    Math.abs(r - g) > 15;
                }

                if (isSkinTone) {
                  skinTonePixels++;
                }
                totalPixels++;
              }
            }

            const skinToneRatio = skinTonePixels / totalPixels;
            const avgCenterBrightness = centerBrightness / totalPixels;

            // Adjust threshold based on lighting conditions
            const minSkinToneRatio = isLowLight ? 0.05 : 0.1; // Lower threshold for low light

            // If less than threshold skin tone in center, might not be a person
            // But also check if center has reasonable brightness (not completely black)
            if (skinToneRatio < minSkinToneRatio && avgCenterBrightness < 15) {
              resolve({ valid: false, error: 'Image is too dark. Please ensure your face is visible in the camera.' });
              return;
            } else if (skinToneRatio < minSkinToneRatio && !isLowLight) {
              resolve({ valid: false, error: 'No face detected. Please ensure your face is clearly visible in the camera.' });
              return;
            }

            // Check 4: Image quality - check for too much blur (high variance in adjacent pixels)
            // Adjust blur threshold for low light conditions
            let blurScore = 0;
            const blurSampleCount = 100;
            for (let i = 0; i < blurSampleCount; i++) {
              const x = Math.floor(Math.random() * (canvas.width - 2));
              const y = Math.floor(Math.random() * (canvas.height - 2));
              const idx = (y * canvas.width + x) * 4;
              const nextIdx = (y * canvas.width + (x + 1)) * 4;

              const diff = Math.abs(data[idx] - data[nextIdx]) +
                          Math.abs(data[idx + 1] - data[nextIdx + 1]) +
                          Math.abs(data[idx + 2] - data[nextIdx + 2]);
              blurScore += diff;
            }

            const avgBlur = blurScore / blurSampleCount;
            // Lower blur threshold for low light (images are naturally less sharp in low light)
            const minBlurThreshold = isLowLight ? 5 : 10;
            if (avgBlur < minBlurThreshold && !isLowLight) {
              resolve({ valid: false, error: 'Image is too blurry. Please ensure good lighting and hold the camera steady.' });
              return;
            }

            // All checks passed
            resolve({ valid: true });
          };

          img.onerror = () => {
            resolve({ valid: false, error: 'Invalid image. Please try again.' });
          };

          img.src = base64Image;
        } else {
          // Mobile validation - basic checks
          // For mobile, we rely more on the fact that camera was used directly
          // Additional validation can be added here if needed
          resolve({ valid: true });
        }
      } catch (error) {
        console.error('Validation error:', error);
        resolve({ valid: false, error: 'Image validation failed. Please try again.' });
      }
    });
  };

  const captureSelfie = async (): Promise<string | null> => {
    try {
      // For web platform, use HTML5 getUserMedia API
      if (Platform.OS === 'web') {
        return await captureSelfieWeb();
      }

      // For mobile platforms, use expo-image-picker
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

  const captureSelfieWeb = (): Promise<string | null> => {
    return new Promise((resolve) => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        Alert.alert(
          'Camera Not Available',
          'Camera access is not available in this environment.',
          [{ text: 'OK' }]
        );
        resolve(null);
        return;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        Alert.alert(
          'Camera Not Available',
          'Your browser does not support camera access. Please use a modern browser.',
          [{ text: 'OK' }]
        );
        resolve(null);
        return;
      }

      // Request camera access
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then((stream) => {
          // Create a video element to show camera preview
          const video = document.createElement('video');
          video.srcObject = stream;
          video.autoplay = true;
          video.playsInline = true;
          video.style.position = 'fixed';
          video.style.top = '0';
          video.style.left = '0';
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.zIndex = '9999';
          video.style.objectFit = 'cover';
          document.body.appendChild(video);

          // Create a canvas to capture the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Create overlay for camera controls (like phone camera)
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.zIndex = '10000';
          overlay.style.pointerEvents = 'none'; // Allow clicks to pass through except on buttons

          // Create close button (X) at top right
          const closeButton = document.createElement('button');
          closeButton.innerHTML = '✕';
          closeButton.style.position = 'fixed';
          closeButton.style.top = '20px';
          closeButton.style.right = '20px';
          closeButton.style.width = '44px';
          closeButton.style.height = '44px';
          closeButton.style.borderRadius = '50%';
          closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          closeButton.style.color = 'white';
          closeButton.style.border = 'none';
          closeButton.style.fontSize = '24px';
          closeButton.style.cursor = 'pointer';
          closeButton.style.display = 'flex';
          closeButton.style.alignItems = 'center';
          closeButton.style.justifyContent = 'center';
          closeButton.style.pointerEvents = 'auto';
          closeButton.style.zIndex = '10001';
          closeButton.style.transition = 'background-color 0.2s';
          closeButton.onmouseenter = () => {
            closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          };
          closeButton.onmouseleave = () => {
            closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          };

          // Create bottom container for capture button
          const bottomContainer = document.createElement('div');
          bottomContainer.style.position = 'fixed';
          bottomContainer.style.bottom = '0';
          bottomContainer.style.left = '0';
          bottomContainer.style.width = '100%';
          bottomContainer.style.padding = '30px';
          bottomContainer.style.display = 'flex';
          bottomContainer.style.justifyContent = 'center';
          bottomContainer.style.alignItems = 'center';
          bottomContainer.style.pointerEvents = 'auto';
          bottomContainer.style.zIndex = '10001';
          bottomContainer.style.background = 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)';

          // Create circular capture button (like phone camera)
          const captureButton = document.createElement('button');
          captureButton.style.width = '70px';
          captureButton.style.height = '70px';
          captureButton.style.borderRadius = '50%';
          captureButton.style.backgroundColor = 'white';
          captureButton.style.border = 'none';
          captureButton.style.cursor = 'pointer';
          captureButton.style.padding = '0';
          captureButton.style.outline = 'none';
          captureButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
          captureButton.style.transition = 'transform 0.1s, background-color 0.1s';
          captureButton.style.display = 'flex';
          captureButton.style.alignItems = 'center';
          captureButton.style.justifyContent = 'center';
          captureButton.style.position = 'relative';
          captureButton.onfocus = () => {
            captureButton.style.outline = 'none';
          };
          captureButton.onmousedown = () => {
            captureButton.style.transform = 'scale(0.9)';
            captureButton.style.backgroundColor = '#f0f0f0';
          };
          captureButton.onmouseup = () => {
            captureButton.style.transform = 'scale(1)';
            captureButton.style.backgroundColor = 'white';
          };
          captureButton.onmouseleave = () => {
            captureButton.style.transform = 'scale(1)';
            captureButton.style.backgroundColor = 'white';
          };

          // Add inner circle to capture button (simple white circle)
          const innerCircle = document.createElement('div');
          innerCircle.style.width = '60px';
          innerCircle.style.height = '60px';
          innerCircle.style.borderRadius = '50%';
          innerCircle.style.backgroundColor = 'white';
          innerCircle.style.border = 'none';
          innerCircle.style.boxShadow = 'inset 0 0 0 3px rgba(0, 0, 0, 0.1)';
          captureButton.appendChild(innerCircle);

          bottomContainer.appendChild(captureButton);
          overlay.appendChild(closeButton);
          overlay.appendChild(bottomContainer);
          document.body.appendChild(overlay);

          const cleanup = () => {
            // Stop all tracks
            stream.getTracks().forEach((track) => track.stop());
            // Remove elements
            if (video.parentNode) {
              video.parentNode.removeChild(video);
            }
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          };

          const capturePhoto = () => {
            // Wait for video to be ready
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              // Set canvas dimensions
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              // Draw video frame to canvas
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert to base64
                const base64Image = canvas.toDataURL('image/png', 0.8);
                cleanup();
                resolve(base64Image);
              } else {
                cleanup();
                resolve(null);
              }
            } else {
              // Wait a bit and try again
              setTimeout(capturePhoto, 100);
            }
          };

          captureButton.onclick = capturePhoto;
          closeButton.onclick = () => {
            cleanup();
            resolve(null);
          };

          // Video is ready, but we'll wait for user to click capture button
          video.onloadedmetadata = () => {
            // Video is ready
          };
        })
        .catch((error) => {
          console.error('Error accessing camera:', error);
          Alert.alert(
            'Camera Access Denied',
            'Please allow camera access to capture selfie for attendance.',
            [{ text: 'OK' }]
          );
          resolve(null);
        });
    });
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

      // Validate the captured image
      const validation = await validateSelfieImage(selfieBase64);
      if (!validation.valid) {
        setIsPunching(false);
        setPunchError(validation.error || "Image validation failed. Please capture a clear photo of yourself.");
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
