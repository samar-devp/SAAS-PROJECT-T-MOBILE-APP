import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useHRMSStore, LeaveRequest } from "@/store/hrmsStore";
import { LeaveStackParamList } from "@/navigation/LeaveStackNavigator";
import Spacer from "@/components/Spacer";

type ApplyLeaveScreenNavigationProp = NativeStackNavigationProp<
  LeaveStackParamList,
  "ApplyLeave"
>;

const LEAVE_TYPES: { value: LeaveRequest["type"]; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: "casual", label: "Casual Leave", icon: "sun" },
  { value: "sick", label: "Sick Leave", icon: "activity" },
  { value: "privilege", label: "Privilege Leave", icon: "award" },
  { value: "wfh", label: "Work From Home", icon: "home" },
];

export default function ApplyLeaveScreen() {
  const navigation = useNavigation<ApplyLeaveScreenNavigationProp>();
  const { theme } = useTheme();
  const applyLeave = useHRMSStore((state) => state.applyLeave);

  const [leaveType, setLeaveType] = useState<LeaveRequest["type"]>("casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!startDate.trim()) {
      setError("Please enter start date");
      return;
    }
    if (!endDate.trim()) {
      setError("Please enter end date");
      return;
    }
    if (!reason.trim()) {
      setError("Please enter reason for leave");
      return;
    }

    applyLeave({
      type: leaveType,
      startDate,
      endDate,
      reason,
    });

    Alert.alert(
      "Leave Applied",
      "Your leave request has been submitted successfully.",
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <ThemedText type="body" style={{ color: theme.textMuted }}>
        Fill in the details to apply for leave
      </ThemedText>

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="small" style={styles.label}>
        Leave Type
      </ThemedText>
      <View style={styles.leaveTypeGrid}>
        {LEAVE_TYPES.map((type) => (
          <Pressable
            key={type.value}
            onPress={() => setLeaveType(type.value)}
            style={[
              styles.leaveTypeCard,
              {
                backgroundColor:
                  leaveType === type.value
                    ? Colors.dark.primary
                    : theme.backgroundDefault,
                borderColor:
                  leaveType === type.value
                    ? Colors.dark.primary
                    : theme.border,
              },
            ]}
          >
            <Feather
              name={type.icon}
              size={24}
              color={leaveType === type.value ? "#000000" : theme.text}
            />
            <ThemedText
              type="small"
              style={{
                color: leaveType === type.value ? "#000000" : theme.text,
                fontWeight: leaveType === type.value ? "600" : "400",
                textAlign: "center",
              }}
            >
              {type.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Spacer height={Spacing.xl} />

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: Colors.dark.error + "20" }]}>
          <Feather name="alert-circle" size={16} color={Colors.dark.error} />
          <ThemedText style={[styles.errorText, { color: Colors.dark.error }]}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <ThemedText type="small" style={styles.label}>
            Start Date
          </ThemedText>
          <View style={styles.inputWrapper}>
            <Feather
              name="calendar"
              size={20}
              color={theme.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                styles.inputWithIcon,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={startDate}
              onChangeText={(text) => {
                setStartDate(text);
                setError("");
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>
        <View style={styles.dateField}>
          <ThemedText type="small" style={styles.label}>
            End Date
          </ThemedText>
          <View style={styles.inputWrapper}>
            <Feather
              name="calendar"
              size={20}
              color={theme.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                styles.inputWithIcon,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={endDate}
              onChangeText={(text) => {
                setEndDate(text);
                setError("");
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.inputContainer}>
        <ThemedText type="small" style={styles.label}>
          Reason
        </ThemedText>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          value={reason}
          onChangeText={(text) => {
            setReason(text);
            setError("");
          }}
          placeholder="Enter reason for leave..."
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <Spacer height={Spacing.xl} />

      <View style={[styles.uploadArea, { borderColor: theme.border }]}>
        <Feather name="upload" size={32} color={theme.textMuted} />
        <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.sm }}>
          Upload Supporting Documents
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textMuted }}>
          (Optional - PDF, JPG, PNG)
        </ThemedText>
      </View>

      <Spacer height={Spacing["2xl"]} />

      <Pressable
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          { backgroundColor: Colors.dark.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <ThemedText style={styles.submitButtonText}>Submit Application</ThemedText>
      </Pressable>

      <Spacer height={Spacing["2xl"]} />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  leaveTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  leaveTypeCard: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    gap: Spacing.sm,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
  },
  dateRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  dateField: {
    flex: 1,
  },
  inputContainer: {
    width: "100%",
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
  },
  inputWithIcon: {
    paddingLeft: Spacing["4xl"] + Spacing.sm,
  },
  inputIcon: {
    position: "absolute",
    left: Spacing.lg,
    top: Spacing.lg,
    zIndex: 1,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.body.fontSize,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  submitButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
});
