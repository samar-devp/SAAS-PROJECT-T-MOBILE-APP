import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useHRMSStore, Task } from "@/store/hrmsStore";
import { TaskStackParamList } from "@/navigation/TaskStackNavigator";
import Spacer from "@/components/Spacer";

type TaskDetailScreenNavigationProp = NativeStackNavigationProp<
  TaskStackParamList,
  "TaskDetail"
>;

type TaskDetailScreenRouteProp = RouteProp<TaskStackParamList, "TaskDetail">;

const STATUS_OPTIONS: { value: Task["status"]; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function TaskDetailScreen() {
  const navigation = useNavigation<TaskDetailScreenNavigationProp>();
  const route = useRoute<TaskDetailScreenRouteProp>();
  const { theme } = useTheme();
  const { tasks, updateTaskStatus, addTaskComment } = useHRMSStore();

  const task = tasks.find((t) => t.id === route.params.taskId);
  const [newComment, setNewComment] = useState("");

  if (!task) {
    return (
      <ScreenKeyboardAwareScrollView>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={48} color={theme.textMuted} />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            Task not found
          </ThemedText>
        </View>
      </ScreenKeyboardAwareScrollView>
    );
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return Colors.dark.error;
      case "medium":
        return Colors.dark.warning;
      case "low":
        return Colors.dark.success;
      default:
        return theme.textMuted;
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return Colors.dark.success;
      case "in-progress":
        return Colors.dark.primary;
      case "pending":
        return Colors.dark.pending;
      default:
        return theme.textMuted;
    }
  };

  const handleStatusChange = (status: Task["status"]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateTaskStatus(task.id, status);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addTaskComment(task.id, newComment);
    setNewComment("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const priorityColor = getPriorityColor(task.priority);

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={[styles.header, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.titleRow}>
          <View
            style={[styles.priorityIndicator, { backgroundColor: priorityColor }]}
          />
          <ThemedText type="h3" style={styles.title}>
            {task.title}
          </ThemedText>
        </View>
        <View style={styles.priorityBadge}>
          <ThemedText
            type="small"
            style={{ color: priorityColor, fontWeight: "600" }}
          >
            {task.priority.toUpperCase()} PRIORITY
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.xl} />

      <ThemedText type="small" style={[styles.label, { color: theme.textMuted }]}>
        Status
      </ThemedText>
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((option) => {
          const isActive = task.status === option.value;
          const statusColor = getStatusColor(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => handleStatusChange(option.value)}
              style={[
                styles.statusOption,
                {
                  backgroundColor: isActive ? statusColor : theme.backgroundDefault,
                  borderColor: statusColor,
                },
              ]}
            >
              {isActive ? (
                <Feather name="check" size={16} color="#FFFFFF" />
              ) : null}
              <ThemedText
                type="small"
                style={{
                  color: isActive ? "#FFFFFF" : statusColor,
                  fontWeight: "600",
                }}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Spacer height={Spacing.xl} />

      <View style={[styles.detailCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={[styles.label, { color: theme.textMuted }]}>
          Description
        </ThemedText>
        <ThemedText style={{ lineHeight: 24 }}>{task.description}</ThemedText>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={[styles.detailCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={18} color={Colors.dark.primary} />
          <View>
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              Due Date
            </ThemedText>
            <ThemedText>{formatDate(task.dueDate)}</ThemedText>
          </View>
        </View>
        <View style={[styles.detailRow, { marginTop: Spacing.lg }]}>
          <Feather name="user" size={18} color={Colors.dark.primary} />
          <View>
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              Assigned By
            </ThemedText>
            <ThemedText>{task.assignedBy}</ThemedText>
          </View>
        </View>
        {task.attachments > 0 ? (
          <View style={[styles.detailRow, { marginTop: Spacing.lg }]}>
            <Feather name="paperclip" size={18} color={Colors.dark.primary} />
            <View>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                Attachments
              </ThemedText>
              <ThemedText>{task.attachments} files</ThemedText>
            </View>
          </View>
        ) : null}
      </View>

      <Spacer height={Spacing.xl} />

      <ThemedText type="h4" style={styles.sectionTitle}>
        Comments ({task.comments.length})
      </ThemedText>

      <Spacer height={Spacing.lg} />

      {task.comments.map((comment) => (
        <View
          key={comment.id}
          style={[styles.commentCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.commentHeader}>
            <View style={[styles.avatar, { backgroundColor: Colors.dark.primary }]}>
              <ThemedText style={{ color: "#000000", fontWeight: "600" }}>
                {comment.author.charAt(0)}
              </ThemedText>
            </View>
            <View style={styles.commentMeta}>
              <ThemedText style={{ fontWeight: "600" }}>{comment.author}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                {comment.timestamp}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={{ marginTop: Spacing.sm }}>{comment.text}</ThemedText>
        </View>
      ))}

      <Spacer height={Spacing.lg} />

      <View style={styles.addCommentRow}>
        <TextInput
          style={[
            styles.commentInput,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          placeholderTextColor={theme.textMuted}
          multiline
        />
        <Pressable
          onPress={handleAddComment}
          disabled={!newComment.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: newComment.trim()
                ? Colors.dark.primary
                : theme.backgroundSecondary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Feather
            name="send"
            size={20}
            color={newComment.trim() ? "#000000" : theme.textMuted}
          />
        </Pressable>
      </View>

      <Spacer height={Spacing["3xl"]} />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing["5xl"],
  },
  header: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  priorityIndicator: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginTop: 2,
  },
  title: {
    flex: 1,
  },
  priorityBadge: {
    marginTop: Spacing.md,
    marginLeft: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  detailCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  commentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  commentMeta: {
    flex: 1,
  },
  addCommentRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-end",
  },
  commentInput: {
    flex: 1,
    minHeight: Spacing.inputHeight,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.body.fontSize,
  },
  sendButton: {
    width: Spacing.inputHeight,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
