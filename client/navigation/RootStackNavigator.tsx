import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthStackNavigator from "@/navigation/AuthStackNavigator";
import EventDetailScreen from "@/screens/EventDetailScreen";
import VenuesScreen from "@/screens/VenuesScreen";
import ChatScreen from "@/screens/ChatScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import CheckoutScreen from "@/screens/payment/CheckoutScreen";
import PaymentProcessingScreen from "@/screens/payment/PaymentProcessingScreen";
import PaymentSuccessScreen from "@/screens/payment/PaymentSuccessScreen";
import MyTicketsScreen from "@/screens/tickets/MyTicketsScreen";
import BillSplitScreen from "@/screens/circle/BillSplitScreen";
import LocationShareScreen from "@/screens/circle/LocationShareScreen";
import StatusUpdateScreen from "@/screens/circle/StatusUpdateScreen";
import RideRequestScreen from "@/screens/ride/RideRequestScreen";
import FilterModal from "@/screens/FilterModal";
import InterestSelectionScreen from "@/screens/auth/InterestSelectionScreen";
import CreateCrewScreen from "@/screens/circle/CreateCrewScreen";
import LeaderboardScreen from "@/screens/gamification/LeaderboardScreen";
import AchievementsScreen from "@/screens/gamification/AchievementsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { UberLocation } from "@/lib/uber";

export type RootStackParamList = {
  Main: undefined;
  EventDetail: { eventId: string };
  TopSpots: undefined;
  Chat: { messageId: string };
  Notifications: undefined;
  Checkout: { event: any; tier: any };
  PaymentProcessing: { event: any; tier: any; total: number };
  PaymentSuccess: { event: any; tier: any; total: number };
  MyTickets: undefined;
  BillSplit: undefined;
  LocationShare: undefined;
  StatusUpdate: undefined;
  RideRequest: { pickup?: UberLocation; dropoff: UberLocation; venueName?: string };
  FilterModal: undefined;
  InterestSelection: undefined;
  CreateCrew: undefined;
  Leaderboard: undefined;
  Achievements: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log("RootStackNavigator: Mounting. Loading:", loading);

  useEffect(() => {
    console.log("RootStackNavigator: Checking session...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("RootStackNavigator: Session retrieved", !!session);
      setSession(session);
      setLoading(false);
    }).catch(err => {
      console.error("RootStackNavigator: Error getting session", err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("RootStackNavigator: Auth changed", _event);
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (!session) {
    return <AuthStackNavigator />;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TopSpots"
        component={VenuesScreen}
        options={{
          title: "Top Spots",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="MyTickets"
        component={MyTicketsScreen}
        options={{
          title: "My Tickets",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="PaymentProcessing"
        component={PaymentProcessingScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="BillSplit"
        component={BillSplitScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="LocationShare"
        component={LocationShareScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="StatusUpdate"
        component={StatusUpdateScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="RideRequest"
        component={RideRequestScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />

      <Stack.Screen
        name="FilterModal"
        component={FilterModal}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="InterestSelection"
        component={InterestSelectionScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateCrew"
        component={CreateCrewScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
