import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore, Holiday } from "@/store/hrmsStore";
import Spacer from "@/components/Spacer";

const FILTERS = ["All", "Public", "Company", "Optional"] as const;
type Filter = (typeof FILTERS)[number];

export default function HolidayScreen() {
  const { theme } = useTheme();
  const { holidays, toggleHolidayFavorite } = useHRMSStore();

  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const filteredHolidays = holidays.filter((holiday) => {
    if (activeFilter === "All") return true;
    return holiday.type === activeFilter.toLowerCase();
  });

  const sortedHolidays = [...filteredHolidays].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getTypeColor = (type: Holiday["type"]) => {
    switch (type) {
      case "public":
        return Colors.dark.success;
      case "company":
        return Colors.dark.primary;
      case "optional":
        return Colors.dark.warning;
      default:
        return theme.textMuted;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getDay = (dateStr: string) => {
    return new Date(dateStr).getDate();
  };

  const getMonth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short" });
  };

  const handleToggleFavorite = (holidayId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleHolidayFavorite(holidayId);
  };

  const favoriteHolidays = holidays.filter((h) => h.isFavorite);

  return (
    <ScreenScrollView>
      {favoriteHolidays.length > 0 ? (
        <>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Favorite Holidays
          </ThemedText>
          <Spacer height={Spacing.md} />
          <View style={styles.favoritesRow}>
            {favoriteHolidays.slice(0, 3).map((holiday) => (
              <View
                key={holiday.id}
                style={[
                  styles.favoriteCard,
                  { backgroundColor: Colors.dark.primary },
                ]}
              >
                <ThemedText type="h3" style={{ color: "#000000" }}>
                  {getDay(holiday.date)}
                </ThemedText>
                <ThemedText type="small" style={{ color: "#000000" }}>
                  {getMonth(holiday.date)}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: "#000000", marginTop: Spacing.sm }}
                  numberOfLines={2}
                >
                  {holiday.name}
                </ThemedText>
              </View>
            ))}
          </View>
          <Spacer height={Spacing.xl} />
        </>
      ) : null}

      <ThemedText type="h4" style={styles.sectionTitle}>
        All Holidays
      </ThemedText>

      <Spacer height={Spacing.md} />

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  activeFilter === filter
                    ? Colors.dark.primary
                    : theme.backgroundDefault,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{
                color: activeFilter === filter ? "#000000" : theme.text,
                fontWeight: activeFilter === filter ? "600" : "400",
              }}
            >
              {filter}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Spacer height={Spacing.lg} />

      {sortedHolidays.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="calendar" size={48} color={theme.textMuted} />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            No holidays found
          </ThemedText>
        </View>
      ) : (
        sortedHolidays.map((holiday) => {
          const typeColor = getTypeColor(holiday.type);
          const isPast = new Date(holiday.date) < new Date();

          return (
            <View
              key={holiday.id}
              style={[
                styles.holidayCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  opacity: isPast ? 0.6 : 1,
                },
              ]}
            >
              <View style={styles.dateBox}>
                <ThemedText type="h3">{getDay(holiday.date)}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  {getMonth(holiday.date)}
                </ThemedText>
              </View>

              <View style={styles.holidayDetails}>
                <ThemedText style={{ fontWeight: "600" }}>{holiday.name}</ThemedText>
                <View style={styles.holidayMeta}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: typeColor + "20" },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{ color: typeColor, fontWeight: "600" }}
                    >
                      {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={{ color: theme.textMuted }}>
                    {formatDate(holiday.date)}
                  </ThemedText>
                </View>
              </View>

              <Pressable
                onPress={() => handleToggleFavorite(holiday.id)}
                style={styles.favoriteButton}
              >
                <Feather
                  name={holiday.isFavorite ? "heart" : "heart"}
                  size={22}
                  color={holiday.isFavorite ? Colors.dark.error : theme.textMuted}
                  style={{ opacity: holiday.isFavorite ? 1 : 0.5 }}
                />
              </Pressable>
            </View>
          );
        })
      )}

      <Spacer height={Spacing["3xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  favoritesRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  favoriteCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  holidayCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.lg,
  },
  dateBox: {
    width: 50,
    alignItems: "center",
  },
  holidayDetails: {
    flex: 1,
  },
  holidayMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
});
