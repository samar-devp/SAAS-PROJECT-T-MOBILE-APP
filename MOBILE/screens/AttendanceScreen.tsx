import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, RefreshControl, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore, AttendanceRecord, MultipleCheckEntry } from "@/store/hrmsStore";
import { apiService } from "@/services/api";
import Spacer from "@/components/Spacer";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AttendanceScreen() {
  const { theme } = useTheme();
  const { 
    attendanceHistory, 
    todayAttendance,
    fetchAttendanceHistory,
    fetchTodayAttendance,
    fetchAttendanceByDate,
    employee
  } = useHRMSStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [monthlyAttendance, setMonthlyAttendance] = useState<{
    presentDates: string[];
    absentDates: string[];
    summary: {
      total_days: number;
      present_days: number;
      absent_days: number;
    } | null;
  }>({
    presentDates: [],
    absentDates: [],
    summary: null,
  });

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

  const loadMonthlyAttendance = async () => {
    if (!employee.adminId || !employee.id) return;
    
    try {
      const month = currentMonth.getMonth() + 1; // getMonth() returns 0-11
      const year = currentMonth.getFullYear();
      
      const response = await apiService.getMonthlyAttendance(
        employee.adminId,
        employee.id,
        month,
        year
      );
      
      if (response.data && response.summary) {
        setMonthlyAttendance({
          presentDates: response.data.present.dates || [],
          absentDates: response.data.absent.dates || [],
          summary: {
            total_days: response.summary.total_days,
            present_days: response.summary.present_days,
            absent_days: response.summary.absent_days,
          },
        });
      }
    } catch (error) {
      console.error('Error loading monthly attendance:', error);
    }
  };

  useEffect(() => {
    // Fetch attendance data when screen loads
    loadAttendanceData();
    loadMonthlyAttendance();
  }, []);

  useEffect(() => {
    // Reload monthly attendance when month changes
    loadMonthlyAttendance();
  }, [currentMonth]);

  const loadAttendanceData = async () => {
    try {
      await Promise.all([
        fetchTodayAttendance(),
        fetchAttendanceHistory()
      ]);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendanceData();
    setRefreshing(false);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAttendanceForDate = (day: number): AttendanceRecord | undefined => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendanceHistory.find((a) => a.date === dateStr);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const handleDatePress = async (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setSelectedAttendance(null); // Clear previous data
    setLoadingAttendance(true);
    
    try {
      // Fetch attendance for the selected date using the API
      const attendance = await fetchAttendanceByDate(dateStr);
      setSelectedAttendance(attendance);
    } catch (error) {
      console.error('Error fetching attendance for date:', error);
      setSelectedAttendance(null);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const renderCalendarDay = (day: number | null, index: number) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.calendarDay} />;
    }

    const attendance = getAttendanceForDate(day);
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isToday = 
      new Date().getDate() === day &&
      new Date().getMonth() === currentMonth.getMonth() &&
      new Date().getFullYear() === currentMonth.getFullYear();

    let bgColor = "transparent";
    let textColor = theme.text;
    let borderColor = "transparent";

    // Check monthly attendance data first (from API)
    if (monthlyAttendance.presentDates.includes(dateStr)) {
      bgColor = Colors.dark.success + "40";
      textColor = Colors.dark.success;
      borderColor = Colors.dark.success + "60";
    } else if (monthlyAttendance.absentDates.includes(dateStr)) {
      bgColor = Colors.dark.error + "40";
      textColor = Colors.dark.error;
      borderColor = Colors.dark.error + "60";
    } else if (attendance) {
      // Fallback to attendance history data
      switch (attendance.status) {
        case "present":
          bgColor = Colors.dark.success + "40";
          textColor = Colors.dark.success;
          borderColor = Colors.dark.success + "60";
          break;
        case "late":
          bgColor = Colors.dark.warning + "40";
          textColor = Colors.dark.warning;
          borderColor = Colors.dark.warning + "60";
          break;
        case "absent":
          bgColor = Colors.dark.error + "40";
          textColor = Colors.dark.error;
          borderColor = Colors.dark.error + "60";
          break;
        case "half-day":
          bgColor = Colors.dark.primary + "40";
          textColor = Colors.dark.primary;
          borderColor = Colors.dark.primary + "60";
          break;
      }
    } else {
      // Mark dates without attendance data as absent (gray) for past dates
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      
      if (dateStr < todayStr) {
        bgColor = theme.textMuted + "20";
        textColor = theme.textMuted;
        borderColor = theme.textMuted + "30";
      }
    }

    return (
      <Pressable
        key={day}
        onPress={() => handleDatePress(day)}
        style={({ pressed }) => [
          styles.calendarDay,
          { 
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: borderColor !== "transparent" ? 1.5 : 0,
          },
          isToday && styles.todayBorder,
          pressed && styles.calendarDayPressed,
        ]}
      >
        <ThemedText
          style={[styles.calendarDayText, { color: textColor, fontWeight: attendance ? "600" : "400" }]}
        >
          {day}
        </ThemedText>
      </Pressable>
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return (
      <View style={styles.calendarGrid}>
        {days.map((day, index) => renderCalendarDay(day, index))}
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return Colors.dark.success;
      case "late":
        return Colors.dark.warning;
      case "absent":
        return Colors.dark.error;
      case "half-day":
        return Colors.dark.primary;
      default:
        return theme.textMuted;
    }
  };

  const handleMonthNav = (direction: number) => {
    if (direction > 0 && currentMonth.getMonth() >= 11) return;
    if (direction < 0 && currentMonth.getMonth() <= 0) return;
    navigateMonth(direction);
  };

  const renderHistoryItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={[styles.historyItem, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.historyDate}>
        <ThemedText type="h4">
          {new Date(item.date).getDate()}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textMuted }}>
          {MONTHS[new Date(item.date).getMonth()].slice(0, 3)}
        </ThemedText>
      </View>
      <View style={styles.historyDetails}>
        <View style={styles.historyTimeRow}>
          <View style={styles.historyTimeItem}>
            <Feather name="log-in" size={14} color={Colors.dark.success} />
            <ThemedText type="small">{item.checkIn || "--:--"}</ThemedText>
          </View>
          <View style={styles.historyTimeItem}>
            <Feather name="log-out" size={14} color={Colors.dark.error} />
            <ThemedText type="small">{item.checkOut || "--:--"}</ThemedText>
          </View>
          <View style={styles.historyTimeItem}>
            <Feather name="clock" size={14} color={Colors.dark.primary} />
            <ThemedText type="small">{formatTotalHours(item.totalHours)}</ThemedText>
          </View>
        </View>
        {item.location ? (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={theme.textMuted} />
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              {item.location}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) + "20" },
        ]}
      >
        <ThemedText
          type="small"
          style={{ color: getStatusColor(item.status), fontWeight: "600" }}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {todayAttendance ? (
        <View style={[styles.todayCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.todayTitle}>
            Today's Attendance
          </ThemedText>
          <View style={styles.todayDetails}>
            <View style={styles.todayItem}>
              <Feather name="log-in" size={20} color={Colors.dark.success} />
              <View>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  Check In
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {todayAttendance.checkIn || "--:--"}
                </ThemedText>
              </View>
            </View>
            <View style={styles.todayItem}>
              <Feather name="log-out" size={20} color={Colors.dark.error} />
              <View>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  Check Out
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {todayAttendance.checkOut || "--:--"}
                </ThemedText>
              </View>
            </View>
            <View style={styles.todayItem}>
              <Feather name="clock" size={20} color={Colors.dark.primary} />
              <View>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  Hours
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {formatTotalHours(todayAttendance.totalHours)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      <Spacer height={Spacing.xl} />

      <View style={[styles.calendarCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => handleMonthNav(-1)} style={styles.navButton}>
            <Feather name="chevron-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h4">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </ThemedText>
          <Pressable onPress={() => handleMonthNav(1)} style={styles.navButton}>
            <Feather name="chevron-right" size={24} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((day) => (
            <View key={day} style={styles.weekdayCell}>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                {day}
              </ThemedText>
            </View>
          ))}
        </View>

        {renderCalendar()}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.dark.success }]} />
            <ThemedText type="small" style={{ color: theme.textMuted }}>Present</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.dark.error }]} />
            <ThemedText type="small" style={{ color: theme.textMuted }}>Absent</ThemedText>
          </View>
        </View>
      </View>

      {/* Monthly Attendance Summary */}
      {monthlyAttendance.summary && (
        <>
          <Spacer height={Spacing.xl} />
          <View style={[styles.monthlySummaryCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.monthlySummaryTitle}>
              Monthly Summary
            </ThemedText>
            <View style={styles.monthlySummaryGrid}>
              <View style={styles.monthlySummaryItem}>
                <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
                  Total Days
                </ThemedText>
                <ThemedText type="h3" style={{ color: theme.text, fontWeight: "700" }}>
                  {monthlyAttendance.summary.total_days}
                </ThemedText>
              </View>
              <View style={styles.monthlySummaryItem}>
                <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
                  Present Days
                </ThemedText>
                <ThemedText 
                  type="h3" 
                  style={{ 
                    color: Colors.dark.success, 
                    fontWeight: "700" 
                  }}
                >
                  {monthlyAttendance.summary.present_days}
                </ThemedText>
              </View>
              <View style={styles.monthlySummaryItem}>
                <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
                  Absent Days
                </ThemedText>
                <ThemedText 
                  type="h3" 
                  style={{ 
                    color: Colors.dark.error, 
                    fontWeight: "700" 
                  }}
                >
                  {monthlyAttendance.summary.absent_days}
                </ThemedText>
              </View>
            </View>
          </View>
        </>
      )}

      <Spacer height={Spacing.xl} />


      <Spacer height={Spacing.lg} />

      {attendanceHistory.slice(0, 10).map((item) => (
        <View key={item.id} style={{ marginBottom: Spacing.md }}>
          {renderHistoryItem({ item })}
        </View>
      ))}

      <Spacer height={Spacing["2xl"]} />

      {/* Modal for showing multiple entries */}
      <Modal
        visible={selectedDate !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setSelectedAttendance(null);
          setSelectedDate(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Attendance Details</ThemedText>
              <Pressable
                onPress={() => {
                  setSelectedAttendance(null);
                  setSelectedDate(null);
                }}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.dateHeader}>
                <ThemedText type="h4">
                  {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Select a date'}
                </ThemedText>
              </View>

              {loadingAttendance ? (
                <View style={styles.loadingContainer}>
                  <ThemedText type="body" style={{ color: theme.textMuted, textAlign: "center" }}>
                    Loading attendance data...
                  </ThemedText>
                </View>
              ) : selectedAttendance ? (
                <>
                  {selectedAttendance.shiftName && (
                    <View style={[styles.shiftBadge, { backgroundColor: Colors.dark.primary + "20", marginBottom: Spacing.lg }]}>
                      <ThemedText type="small" style={{ color: Colors.dark.primary, fontWeight: "600" }}>
                        {selectedAttendance.shiftName}
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Feather name="log-in" size={18} color={Colors.dark.success} />
                        <ThemedText type="small" style={{ color: theme.textMuted }}>First Check In</ThemedText>
                        <ThemedText type="body" style={{ fontWeight: "600" }}>
                          {selectedAttendance.checkIn || "--:--"}
                        </ThemedText>
                      </View>
                      <View style={styles.summaryItem}>
                        <Feather name="log-out" size={18} color={Colors.dark.error} />
                        <ThemedText type="small" style={{ color: theme.textMuted }}>Last Check Out</ThemedText>
                        <ThemedText type="body" style={{ fontWeight: "600" }}>
                          {selectedAttendance.checkOut || "--:--"}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Feather name="clock" size={18} color={Colors.dark.primary} />
                        <ThemedText type="small" style={{ color: theme.textMuted }}>Total Hours</ThemedText>
                        <ThemedText type="body" style={{ fontWeight: "600" }}>
                          {formatTotalHours(selectedAttendance.totalHours)}
                        </ThemedText>
                      </View>
                      <View style={styles.summaryItem}>
                        <Feather 
                          name={selectedAttendance.status === "late" ? "alert-circle" : "check-circle"} 
                          size={18} 
                          color={getStatusColor(selectedAttendance.status)} 
                        />
                        <ThemedText type="small" style={{ color: theme.textMuted }}>Status</ThemedText>
                        <ThemedText 
                          type="body" 
                          style={{ 
                            fontWeight: "600",
                            color: getStatusColor(selectedAttendance.status)
                          }}
                        >
                          {selectedAttendance.status.charAt(0).toUpperCase() + selectedAttendance.status.slice(1).replace("-", " ")}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {selectedAttendance.multipleEntries && selectedAttendance.multipleEntries.length > 0 && (
                    <View style={styles.multipleEntriesSection}>
                      <ThemedText type="h4" style={styles.sectionTitle}>
                        Check In/Out Entries ({selectedAttendance.multipleEntries.length})
                      </ThemedText>
                      {selectedAttendance.multipleEntries.map((entry, index) => (
                        <View 
                          key={entry.id} 
                          style={[styles.entryCard, { backgroundColor: theme.backgroundSecondary }]}
                        >
                          <View style={styles.entryHeader}>
                            <ThemedText type="body" style={{ fontWeight: "600" }}>
                              Entry #{index + 1}
                            </ThemedText>
                            <ThemedText type="small" style={{ color: theme.textMuted }}>
                              {formatTotalHours((entry.totalWorkingMinutes || 0) / 60)}
                            </ThemedText>
                          </View>
                          <View style={styles.entryDetails}>
                            <View style={styles.entryTimeRow}>
                              <View style={styles.entryTimeItem}>
                                <Feather name="log-in" size={16} color={Colors.dark.success} />
                                <ThemedText type="small" style={{ color: theme.textMuted }}>Check In</ThemedText>
                                <ThemedText type="body" style={{ fontWeight: "600" }}>
                                  {entry.checkInTime || "--:--"}
                                </ThemedText>
                              </View>
                              <View style={styles.entryTimeItem}>
                                <Feather name="log-out" size={16} color={Colors.dark.error} />
                                <ThemedText type="small" style={{ color: theme.textMuted }}>Check Out</ThemedText>
                                <ThemedText type="body" style={{ fontWeight: "600" }}>
                                  {entry.checkOutTime || "--:--"}
                                </ThemedText>
                              </View>
                            </View>
                            {entry.remarks && (
                              <View style={styles.remarksRow}>
                                <Feather name="message-circle" size={14} color={theme.textMuted} />
                                <ThemedText type="small" style={{ color: theme.textMuted, flex: 1 }}>
                                  {entry.remarks}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Feather name="calendar" size={48} color={theme.textMuted} />
                  <ThemedText type="body" style={{ color: theme.textMuted, marginTop: Spacing.md, textAlign: "center" }}>
                    No attendance record found for this date
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  todayCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  todayTitle: {
    marginBottom: Spacing.lg,
  },
  todayDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  todayItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  calendarCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdaysRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  todayBorder: {
    borderWidth: 2.5,
    borderColor: Colors.dark.primary,
    borderRadius: BorderRadius.sm,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.lg,
    gap: Spacing.xl,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.lg,
  },
  historyDate: {
    alignItems: "center",
    width: 40,
  },
  historyDetails: {
    flex: 1,
  },
  historyTimeRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  historyTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  calendarDayPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%",
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: Spacing.lg,
  },
  dateHeader: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  shiftBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  summaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  multipleEntriesSection: {
    marginTop: Spacing.lg,
  },
  entryCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  entryDetails: {
    gap: Spacing.sm,
  },
  entryTimeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: Spacing.md,
  },
  entryTimeItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  remarksRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  monthlySummaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  monthlySummaryTitle: {
    marginBottom: Spacing.lg,
  },
  monthlySummaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: Spacing.md,
  },
  monthlySummaryItem: {
    flex: 1,
    alignItems: "center",
  },
});
