import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import { LoginScreen, SignUpScreen } from "./LoginScreen"; // Ensure correct exports from LoginScreen.js

import HomeScreen from "./HomeScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // Ensure the app stops loading once the state is determined
    });

    return unsubscribe; // Cleanup listener on unmount
  }, []);

  if (loading) {
    return null; // Optionally, return a splash screen or loader here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // User is logged in: Show Home Screen
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: true }}
          />
        ) : (
          // User is not logged in: Show Login and Signup Screens
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: true }}
            />
            <Stack.Screen
              name="Signup"
              component={SignUpScreen}
              options={{ headerShown: true }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
