import React from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import theme from '../constants/theme';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Profile Screen
import ProfileScreen from '../screens/profile/ProfileScreen';

// Vendor Screens
import VendorWelcomeScreen from '../screens/vendor/VendorWelcomeScreen';
import VendorCreateSalonScreen from '../screens/vendor/VendorCreateSalonScreen';

// Placeholder screens (to be filled by other members)
const PlaceholderScreen = ({ name }) => {
  const { logout } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, gap: 20 }}>
      <Text style={{ fontSize: 18, color: theme.labelPrimary }}>{name} - Pending</Text>
      <TouchableOpacity onPress={logout} style={{ backgroundColor: theme.primary, padding: 12, borderRadius: 8 }}>
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Logout (Temporary)</Text>
      </TouchableOpacity>
    </View>
  );
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const CustomerTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: theme.systemGray,
      tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.separator, height: 83, paddingBottom: 20 },
      headerShown: false,
    }}
  >
    <Tab.Screen name="Home" options={{ tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} /> }}>
      {() => <PlaceholderScreen name="Customer Home" />}
    </Tab.Screen>
    <Tab.Screen name="Explore" options={{ tabBarIcon: ({ color }) => <MaterialIcons name="search" size={24} color={color} /> }}>
      {() => <PlaceholderScreen name="Explore Salons" />}
    </Tab.Screen>
    <Tab.Screen name="Bookings" options={{ tabBarIcon: ({ color }) => <MaterialIcons name="calendar-today" size={24} color={color} /> }}>
      {() => <PlaceholderScreen name="My Bookings" />}
    </Tab.Screen>
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="account-circle" size={24} color={color} /> }} />
  </Tab.Navigator>
);

const VendorSetupStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VendorWelcome" component={VendorWelcomeScreen} />
    <Stack.Screen name="VendorCreateSalon" component={VendorCreateSalonScreen} />
  </Stack.Navigator>
);

const VendorTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: theme.systemGray,
      tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.separator, height: 83, paddingBottom: 20 },
      headerShown: false,
    }}
  >
    <Tab.Screen name="Dashboard" options={{ tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} /> }}>
      {() => <PlaceholderScreen name="Vendor Dashboard" />}
    </Tab.Screen>
    <Tab.Screen name="MySalon" options={{ tabBarLabel: 'My Salon', tabBarIcon: ({ color }) => <Ionicons name="storefront" size={24} color={color} /> }}>
      {() => <PlaceholderScreen name="My Salon" />}
    </Tab.Screen>
    <Tab.Screen name="Bookings" options={{ tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} /> }}>
      {() => <PlaceholderScreen name="Vendor Bookings" />}
    </Tab.Screen>
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={24} color={color} /> }} />
  </Tab.Navigator>
);

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.labelPrimary }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!user) return <NavigationContainer><AuthStack /></NavigationContainer>;

  if (user.role === 'customer' || user.role === 'user') return <NavigationContainer><CustomerTabs /></NavigationContainer>;

  if (user.role === 'vendor') {
    if (!user.ownedSalon) return <NavigationContainer><VendorSetupStack /></NavigationContainer>;
    return <NavigationContainer><VendorTabs /></NavigationContainer>;
  }

  if (user.role === 'admin') return <NavigationContainer><AdminStack /></NavigationContainer>;

  // Fallback
  return <NavigationContainer><AuthStack /></NavigationContainer>;
};

export default AppNavigator;
