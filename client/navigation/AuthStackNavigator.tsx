
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingScreen from "@/screens/OnboardingScreen";
import LoginScreen from "@/screens/auth/LoginScreen";
import SignUpScreen from "@/screens/auth/SignUpScreen";
import PhoneVerificationScreen from "@/screens/auth/PhoneVerificationScreen";
import InterestSelectionScreen from "@/screens/auth/InterestSelectionScreen";

export type AuthStackParamList = {
    Onboarding: undefined;
    Login: undefined;
    SignUp: undefined;
    PhoneVerification: { phone: string };
    InterestSelection: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'black' },
            }}
            initialRouteName="Onboarding"
        >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen
                name="PhoneVerification"
                component={PhoneVerificationScreen}
                options={{
                    gestureEnabled: false,
                }}
            />
            <Stack.Screen
                name="InterestSelection"
                component={InterestSelectionScreen}
                options={{
                    gestureEnabled: false,
                }}
            />
        </Stack.Navigator>
    );
}

