import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Animated,
  Keyboard,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";
import Spacer from "@/components/Spacer";

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const login = useHRMSStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleLogin = async () => {
    // Clear previous errors
    setError("");
    Keyboard.dismiss();

    // Validation
    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(username.trim(), password);
      if (!result.success) {
        setError(result.error || "Invalid credentials");
        // Shake animation on error
        Animated.sequence([
          Animated.timing(inputFocusAnim, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(inputFocusAnim, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(inputFocusAnim, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(inputFocusAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isDark ? theme.backgroundSecondary : "#FFFFFF",
      color: theme.text,
      borderColor: error ? Colors.dark.error : theme.border,
      borderWidth: error ? 2 : 1,
    },
  ];

  const primaryGradient = ["#FFC300", "#FFD700", "#FFC300"];
  const backgroundGradient = isDark
    ? ["#000000", "#1A1A1A", "#000000"]
    : ["#FFFFFF", "#F8F9FA", "#FFFFFF"];

  return (
    <LinearGradient
      colors={backgroundGradient}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScreenKeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScale }],
                marginBottom: isKeyboardVisible ? Spacing.xl : Spacing["4xl"],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={primaryGradient}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Image
                  source={require("../assets/images/icon.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
            <ThemedText type="h1" style={styles.appName}>
              HRMS Pro
            </ThemedText>
            <ThemedText style={[styles.tagline, { color: theme.textMuted }]}>
              Your Professional HR Companion
            </ThemedText>
          </Animated.View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <ThemedText type="h2" style={styles.welcomeText}>
              Welcome Back
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
              Sign in to continue to your dashboard
            </ThemedText>
          </View>

          <Spacer height={Spacing["3xl"]} />

          {/* Error Message */}
          {error ? (
            <Animated.View
              style={[
                styles.errorContainer,
                {
                  backgroundColor: isDark
                    ? Colors.dark.error + "20"
                    : Colors.light.error + "15",
                  borderColor: Colors.dark.error,
                  transform: [{ translateX: inputFocusAnim }],
                },
              ]}
            >
              <Feather name="alert-circle" size={18} color={Colors.dark.error} />
              <ThemedText style={[styles.errorText, { color: Colors.dark.error }]}>
                {error}
              </ThemedText>
            </Animated.View>
          ) : null}

          {error ? <Spacer height={Spacing.lg} /> : null}

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Username
            </ThemedText>
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isDark ? theme.backgroundTertiary : "#F0F0F0",
                  },
                ]}
              >
                <Feather name="user" size={18} color={theme.textMuted} />
              </View>
              <TextInput
                style={[inputStyle, styles.inputWithIcon]}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setError("");
                }}
                placeholder="Enter your username"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
                onSubmitEditing={() => {
                  // Focus password input
                }}
              />
            </View>
          </View>

          <Spacer height={Spacing.xl} />

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Password
            </ThemedText>
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isDark ? theme.backgroundTertiary : "#F0F0F0",
                  },
                ]}
              >
                <Feather name="lock" size={18} color={theme.textMuted} />
              </View>
              <TextInput
                style={[inputStyle, styles.inputWithIcon, styles.passwordInput]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError("");
                }}
                placeholder="Enter your password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>
            </View>
          </View>

          {/* Forgot Password */}
          <Pressable
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotButton}
            disabled={isLoading}
          >
            <ThemedText style={[styles.forgotText, { color: Colors.dark.primary }]}>
              Forgot Password?
            </ThemedText>
          </Pressable>

          <Spacer height={Spacing["3xl"]} />

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.loginButtonContainer,
              { opacity: pressed || isLoading ? 0.8 : 1 },
            ]}
          >
            <LinearGradient
              colors={primaryGradient}
              style={styles.loginButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <>
                  <ThemedText style={styles.loginButtonText}>Sign In</ThemedText>
                  <Feather name="arrow-right" size={20} color="#000000" style={styles.buttonIcon} />
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Spacer height={Spacing["2xl"]} />

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: theme.textMuted }]}>
              Need assistance?{" "}
            </ThemedText>
            <Pressable disabled={isLoading}>
              <ThemedText style={[styles.footerLink, { color: Colors.dark.primary }]}>
                Contact Support
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </ScreenKeyboardAwareScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: Spacing["3xl"],
  },
  content: {
    flex: 1,
    justifyContent: "center",
    minHeight: "100%",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  logoWrapper: {
    marginBottom: Spacing.lg,
    shadowColor: "#FFC300",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius["2xl"],
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
  },
  logo: {
    width: 70,
    height: 70,
  },
  appName: {
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  welcomeSection: {
    marginBottom: Spacing["2xl"],
  },
  welcomeText: {
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
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
  inputContainer: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    position: "absolute",
    left: Spacing.md,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    height: Spacing.inputHeight + 4,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    fontWeight: "500",
    paddingLeft: Spacing["4xl"] + Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputWithIcon: {
    flex: 1,
  },
  passwordInput: {
    paddingRight: Spacing["4xl"] + Spacing.md,
  },
  eyeButton: {
    position: "absolute",
    right: Spacing.md,
    zIndex: 2,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loginButtonContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#FFC300",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loginButton: {
    height: Spacing.buttonHeight + 4,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: Spacing.xs,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
