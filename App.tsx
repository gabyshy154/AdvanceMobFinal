import React, { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import CaughtPoke from './src/screens/CaughtPoke';
import MissingPoke from './src/screens/MissingPoke';
import CommunityScreen from './src/screens/CommunityScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import GroupScreen from './src/screens/GroupScreen';
import HuntModeScreen from './src/screens/HuntModeScreen';

// This defines all screen names for the stack (for TypeScript and navigation).
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  CaughtPoke: undefined;
  MissingPoke: undefined;
  Community: undefined;
  EditProfile: undefined;
  Group: {
    groupId: string;
    name: string;
    description: string;
  };
  HuntMode: undefined; //
};

// Create the native stack navigator using the route list above.
const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  // Holds the current Firebase user (null if not logged in).
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true); // Avoid flicker on startup

  // Listen for auth changes (login / logout).
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(authUser => {
      setUser(authUser); // Set current user or null
      if (initializing) setInitializing(false);
    });

    // Cleanup listener when App unmounts.
    return unsubscribe;
  }, [initializing]);

  // Optional: you can return a splash/loading screen here instead of null.
  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // When user is logged in → show main app screens.
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CaughtPoke" component={CaughtPoke} />
            <Stack.Screen name="MissingPoke" component={MissingPoke} />
            <Stack.Screen name="Community" component={CommunityScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Group" component={GroupScreen} />
            <Stack.Screen name="HuntMode" component={HuntModeScreen} />
          </>
        ) : (
          // When no user is logged in → show auth screens.
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
