import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import PayrollScreen from "@/screens/PayrollScreen";
import HolidayScreen from "@/screens/HolidayScreen";
import AnnouncementScreen from "@/screens/AnnouncementScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type HomeStackParamList = {
  Home: undefined;
  Payroll: undefined;
  Holidays: undefined;
  Announcements: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="HRMS Pro" />,
        }}
      />
      <Stack.Screen
        name="Payroll"
        component={PayrollScreen}
        options={{ headerTitle: "Payroll" }}
      />
      <Stack.Screen
        name="Holidays"
        component={HolidayScreen}
        options={{ headerTitle: "Holidays" }}
      />
      <Stack.Screen
        name="Announcements"
        component={AnnouncementScreen}
        options={{ headerTitle: "Announcements" }}
      />
    </Stack.Navigator>
  );
}
