import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withSequence,
  withTiming
} from "react-native-reanimated";

import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import DiscoverStackNavigator from "@/navigation/DiscoverStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import VoiceScreen from "@/screens/VoiceScreen";
import CircleScreen from "@/screens/circle/CircleScreen";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Shadows, Gradients } from "@/constants/theme";

export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  VoiceTab: undefined;
  CircleTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const PulsingVoiceButton = ({ focused }: { focused: boolean }) => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.1, { damping: 12, stiffness: 100 }),
          withSpring(1, { damping: 12, stiffness: 100 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(focused ? 1.2 : 1, { duration: 400 }) }],
    opacity: withTiming(focused ? 0.3 : 0, { duration: 400 }),
  }));

  return (
    <View style={styles.voiceButtonContainer}>
      <Animated.View style={[styles.voiceButtonWrapper, animatedStyle]}>
        <LinearGradient
          colors={Gradients.party}
          style={styles.voiceButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="mic" size={28} color="#FFF" />
        </LinearGradient>
      </Animated.View>
      {/* Refined Glow */}
      <Animated.View
        style={[
          styles.voiceGlow,
          { backgroundColor: Colors.dark.primary },
          glowStyle
        ]}
      />
    </View>
  );
};

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: sunsetOrange,
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
          height: 90,
          paddingBottom: 30,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? "#0A1A1A" : "#F4F1EA" },
              ]}
            />
          ),
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Vybz",
          tabBarIcon: ({ color }) => (
            <Feather name="zap" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={DiscoverStackNavigator}
        options={{
          title: "Move",
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
          tabBarIcon: ({ focused }) => <PulsingVoiceButton focused={focused} />,
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
          title: "You",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const sunsetOrange = "#FF5F00";

const styles = StyleSheet.create({
  voiceButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  voiceButtonWrapper: {
    zIndex: 10,
  },
  voiceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(255, 95, 0, 0.3)',
      },
      default: {
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  voiceGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    zIndex: -1,
  },
});
