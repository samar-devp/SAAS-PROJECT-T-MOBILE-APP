import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore, LeaveRequest } from "@/store/hrmsStore";
import { LeaveStackParamList } from "@/navigation/LeaveStackNavigator";
import Spacer from "@/components/Spacer";

type LeaveScreenNavigationProp = NativeStackNavigationProp<
  LeaveStackParamList,
  "Leave"
>;

const LEAVE_TYPE_LABELS: Record<string, string> = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  privilege: "Privilege Leave",
  wfh: "Work From Home",
};

const LEAVE_TYPE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  casual: "sun",
  sick: "activity",
  privilege: "award",
  wfh: "home",
};

export default function LeaveScreen() {
  const navigation = useNavigation<LeaveScreenNavigationProp>();
  const { theme } = useTheme();
  const { leaveBalance, leaveRequests } = useHRMSStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return Colors.dark.success;
      case "rejected":
        return Colors.dark.error;
      case "pending":
        return Colors.dark.pending;
      default:
        return theme.textMuted;
    }
  };

  const getStatusIcon = (status: string): keyof typeof Feather.glyphMap => {
    switch (status) {
      case "approved":
        return "check-circle";
      case "rejected":
        return "x-circle";
      case "pending":
        return "clock";
      default:
        return "help-circle";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const renderBalanceCard = (type: keyof typeof leaveBalance, label: string, icon: keyof typeof Feather.glyphMap) => (
    <View style={[styles.balanceCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.balanceIcon, { backgroundColor: Colors.dark.primary + "20" }]}>
        <Feather name={icon} size={20} color={Colors.dark.primary} />
      </View>
      <ThemedText type="h3" style={styles.balanceCount}>
        {leaveBalance[type]}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.textMuted }} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );

  const renderLeaveItem = (item: LeaveRequest) => {
    const statusColor = getStatusColor(item.status);
    const startDate = formatDate(item.startDate);
    const endDate = formatDate(item.endDate);
    const dateRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;

    return (
      <View
        key={item.id}
        style={[styles.leaveItem, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.leaveHeader}>
          <View style={styles.leaveTypeRow}>
            <View
              style={[
                styles.leaveTypeIcon,
                { backgroundColor: Colors.dark.primary + "20" },
              ]}
            >
              <Feather
                name={LEAVE_TYPE_ICONS[item.type]}
                size={16}
                color={Colors.dark.primary}
              />
            </View>
            <View>
              <ThemedText style={{ fontWeight: "600" }}>
                {LEAVE_TYPE_LABELS[item.type]}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                {dateRange}
              </ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <Feather name={getStatusIcon(item.status)} size={14} color={statusColor} />
            <ThemedText
              type="small"
              style={{ color: statusColor, fontWeight: "600" }}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.leaveReason}>
          <ThemedText type="small" style={{ color: theme.textMuted }}>
            {item.reason}
          </ThemedText>
        </View>
        <View style={styles.leaveFooter}>
          <ThemedText type="small" style={{ color: theme.textMuted }}>
            Applied on {formatDate(item.appliedDate)}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="h4">Leave Balance</ThemedText>
        <Pressable
          onPress={() => navigation.navigate("ApplyLeave")}
          style={({ pressed }) => [
            styles.applyButton,
            { backgroundColor: Colors.dark.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Feather name="plus" size={18} color="#000000" />
          <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
        </Pressable>
      </View>

      <Spacer height={Spacing.lg} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.balanceContainer}
      >
        {renderBalanceCard("casual", "Casual", "sun")}
        {renderBalanceCard("sick", "Sick", "activity")}
        {renderBalanceCard("privilege", "Privilege", "award")}
        {renderBalanceCard("wfh", "WFH", "home")}
      </ScrollView>

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4" style={styles.sectionTitle}>
        Leave History
      </ThemedText>

      <Spacer height={Spacing.lg} />

      {leaveRequests.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="inbox" size={48} color={theme.textMuted} />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            No leave requests yet
          </ThemedText>
        </View>
      ) : (
        leaveRequests.map((item) => (
          <View key={item.id} style={{ marginBottom: Spacing.md }}>
            {renderLeaveItem(item)}
          </View>
        ))
      )}

      <Spacer height={Spacing["2xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  applyButtonText: {
    color: "#000000",
    fontWeight: "600",
  },
  balanceContainer: {
    gap: Spacing.md,
    paddingRight: Spacing.xl,
  },
  balanceCard: {
    width: 100,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  balanceIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  balanceCount: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  leaveItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  leaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leaveTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  leaveTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    gap: Spacing.xs,
  },
  leaveReason: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  leaveFooter: {
    marginTop: Spacing.sm,
  },
  emptyState: {
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
});
