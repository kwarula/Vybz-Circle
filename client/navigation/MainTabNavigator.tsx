import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import DiscoverStackNavigator from "@/navigation/DiscoverStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import VoiceScreen from "@/screens/VoiceScreen";
import CircleScreen from "@/screens/circle/CircleScreen";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Shadows } from "@/constants/theme";

export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  VoiceTab: undefined;
  CircleTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: "#8B5CF6",
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundDefault,
            web: theme.backgroundDefault,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: 85,
          paddingBottom: 25,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={90}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "#000000" },
              ]}
            />
          ),
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 4,
        }
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={DiscoverStackNavigator}
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <Feather name="compass" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="VoiceTab"
        component={VoiceScreen}
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View style={styles.voiceButtonContainer}>
              <LinearGradient
                colors={focused ? ['#8B5CF6', '#7C3AED'] : ['#6D28D9', '#5B21B6']}
                style={styles.voiceButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name="mic" size={28} color="#FFF" />
              </LinearGradient>
              {/* Glow effect */}
              {focused && <View style={styles.voiceGlow} />}
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen
        name="CircleTab"
        component={CircleScreen}
        options={{
          title: "Circle",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-circle-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  voiceButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // Elevate above tab bar
  },
  voiceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.fab,
  },
  voiceGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    opacity: 0.2,
    zIndex: -1,
  },
});
