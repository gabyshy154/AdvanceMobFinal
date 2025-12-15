// App.tsx - UPDATED WITH PROPER NAVIGATION
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import PokedexScreen from './src/screens/PokedexScreen';
import HuntScreen from './src/screens/HuntScreen';
import ARCameraScreen from './src/screens/ARCameraScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Type definitions for navigation
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  'AR Camera': { fromHunt?: boolean; pokemonId?: number } | undefined;
};

export type MainTabParamList = {
  Hunt: undefined;
  Pokedex: undefined;
  'AR Camera': undefined;
  Feed: undefined;
  Profile: undefined;
};

// Simple icon component
const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontSize: focused ? 28 : 24 }}>{emoji}</Text>
  </View>
);

// Main Tabs with Stack Navigator for AR Camera
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#DC0A2D',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Hunt"
        component={HuntStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Pokedex"
        component={PokedexScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AR Camera"
        component={ARCameraScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📷" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌐" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Hunt Stack Navigator (includes AR Camera)
function HuntStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HuntMain" component={HuntScreen} />
      <Stack.Screen 
        name="AR Camera" 
        component={ARCameraScreen}
        options={{
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
}

// Auth Tabs
function AuthTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FFCB05',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Login"
        component={LoginScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔓" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Signup"
        component={SignUpScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="✨" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.loading}>
        <View style={styles.pokeball}>
          <View style={styles.pokeballTop} />
          <View style={styles.pokeballLine} />
          <View style={styles.pokeballBottom} />
          <View style={styles.pokeballCenter}>
            <View style={styles.pokeballButton} />
          </View>
        </View>
        <ActivityIndicator size="large" color="#FFCB05" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Loading PokéExplorer...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthTabs />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  pokeball: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#1a1a2e',
  },
  pokeballTop: {
    flex: 1,
    backgroundColor: '#DC0A2D',
  },
  pokeballLine: {
    height: 8,
    backgroundColor: '#1a1a2e',
  },
  pokeballBottom: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pokeballCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -15,
    marginLeft: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokeballButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  loadingText: {
    color: '#FFCB05',
    marginTop: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;