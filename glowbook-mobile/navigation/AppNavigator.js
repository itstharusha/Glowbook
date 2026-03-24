import React from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Ionicons } from '@expo/vector-icons';
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
    screenOptions={({ route }) => ({
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: theme.systemGray,
      tabBarStyle: {
        backgroundColor: theme.background,
        borderTopColor: theme.separator,
        height: Platform.OS === 'ios' ? 88 : 60,
        paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        paddingTop: 8,
      },
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Explore') {
          iconName = focused ? 'search' : 'search-outline';
        } else if (route.name === 'Bookings') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '500',
      },
    })}
  >
    <Tab.Screen name="Home">
      {() => <PlaceholderScreen name="Customer Home" />}
    </Tab.Screen>
    <Tab.Screen name="Explore">
      {() => <PlaceholderScreen name="Explore Salons" />}
    </Tab.Screen>
    <Tab.Screen name="Bookings">
      {() => <PlaceholderScreen name="My Bookings" />}
    </Tab.Screen>
    <Tab.Screen name="Profile" component={ProfileScreen} />
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
    screenOptions={({ route }) => ({
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: theme.systemGray,
      tabBarStyle: {
        backgroundColor: theme.background,
        borderTopColor: theme.separator,
        height: Platform.OS === 'ios' ? 88 : 60,
        paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        paddingTop: 8,
      },
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Dashboard') {
          iconName = focused ? 'file-tray-full' : 'file-tray-full-outline';
        } else if (route.name === 'MySalon') {
          iconName = focused ? 'storefront' : 'storefront-outline';
        } else if (route.name === 'Bookings') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '500',
      },
    })}
  >
    <Tab.Screen name="Dashboard">
      {() => <PlaceholderScreen name="Vendor Dashboard" />}
    </Tab.Screen>
    <Tab.Screen name="MySalon" options={{ tabBarLabel: 'My Salon' }}>
      {() => <PlaceholderScreen name="My Salon" />}
    </Tab.Screen>
    <Tab.Screen name="Bookings">
      {() => <PlaceholderScreen name="Vendor Bookings" />}
    </Tab.Screen>
    <Tab.Screen name="Profile" component={ProfileScreen} />
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
