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

// Profile Screen (shared — works for both customer and vendor)
import ProfileScreen from '../screens/profile/ProfileScreen';

// Vendor Setup Screens
import VendorWelcomeScreen from '../screens/vendor/VendorWelcomeScreen';
import VendorCreateSalonScreen from '../screens/vendor/VendorCreateSalonScreen';

// Vendor Tab Screens
import VendorDashboardScreen from '../screens/vendor/VendorDashboardScreen';
import VendorSalonScreen from '../screens/vendor/VendorSalonScreen';
import VendorEditSalonScreen from '../screens/vendor/VendorEditSalonScreen';
import VendorAddEditServiceScreen from '../screens/vendor/VendorAddEditServiceScreen';
import VendorAddEditStylistScreen from '../screens/vendor/VendorAddEditStylistScreen';
import VendorAddEditPortfolioScreen from '../screens/vendor/VendorAddEditPortfolioScreen';
import VendorPortfolioScreen from '../screens/vendor/VendorPortfolioScreen';
import VendorBookingsScreen from '../screens/vendor/VendorBookingsScreen';
import VendorBookingDetailScreen from '../screens/vendor/VendorBookingDetailScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ManageSalonsScreen from '../screens/admin/ManageSalonsScreen';
import ManageAppointmentsScreen from '../screens/admin/ManageAppointmentsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';

// Customer Screens
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import ExploreScreen from '../screens/customer/ExploreScreen';
import SalonDetailScreen from '../screens/customer/SalonDetailScreen';
import BookAppointmentScreen from '../screens/customer/BookAppointmentScreen';
import CustomerBookingsScreen from '../screens/customer/CustomerBookingsScreen';
import LeaveReviewScreen from '../screens/customer/LeaveReviewScreen';
import CustomerPortfolioViewScreen from '../screens/customer/CustomerPortfolioViewScreen';

// Placeholder for customer screens not yet implemented
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

// ─── Auth Stack ──────────────────────────────────────────────────────────────
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// ─── Customer Tabs ────────────────────────────────────────────────────────────
const CustomerHomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
    <Stack.Screen name="SalonDetail" component={SalonDetailScreen} />
    <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
    <Stack.Screen name="CustomerPortfolioView" component={CustomerPortfolioViewScreen} />
  </Stack.Navigator>
);

const CustomerExploreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ExploreList" component={ExploreScreen} />
    <Stack.Screen name="SalonDetail" component={SalonDetailScreen} />
    <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
    <Stack.Screen name="CustomerPortfolioView" component={CustomerPortfolioViewScreen} />
  </Stack.Navigator>
);

const CustomerBookingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyBookings" component={CustomerBookingsScreen} />
    <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} />
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
        const icons = {
          Home: focused ? 'home' : 'home-outline',
          Explore: focused ? 'search' : 'search-outline',
          Bookings: focused ? 'calendar' : 'calendar-outline',
          Profile: focused ? 'person' : 'person-outline',
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
    })}
  >
    <Tab.Screen name="Home" component={CustomerHomeStack} />
    <Tab.Screen name="Explore" component={CustomerExploreStack} />
    <Tab.Screen name="Bookings" component={CustomerBookingsStack} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Vendor Setup Stack (no tabs — must complete setup) ───────────────────────
const VendorSetupStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VendorWelcome" component={VendorWelcomeScreen} />
    <Stack.Screen name="VendorCreateSalon" component={VendorCreateSalonScreen} />
  </Stack.Navigator>
);

// ─── MySalon nested stack ─────────────────────────────────────────────────────
const MySalonStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VendorSalon" component={VendorSalonScreen} />
    <Stack.Screen name="VendorEditSalon" component={VendorEditSalonScreen} />
    <Stack.Screen name="VendorAddEditService" component={VendorAddEditServiceScreen} />
    <Stack.Screen name="VendorAddEditStylist" component={VendorAddEditStylistScreen} />
    <Stack.Screen name="VendorAddEditPortfolio" component={VendorAddEditPortfolioScreen} />
    <Stack.Screen name="VendorPortfolio" component={VendorPortfolioScreen} />
  </Stack.Navigator>
);

// ─── Vendor Dashboard nested stack ────────────────────────────────────────────
const VendorDashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VendorDashboard" component={VendorDashboardScreen} />
  </Stack.Navigator>
);

// ─── Vendor Bookings nested stack ─────────────────────────────────────────────
const VendorBookingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VendorBookings" component={VendorBookingsScreen} />
    <Stack.Screen name="VendorBookingDetail" component={VendorBookingDetailScreen} />
  </Stack.Navigator>
);

// ─── Vendor Tabs ──────────────────────────────────────────────────────────────
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
        const icons = {
          Dashboard: focused ? 'file-tray-full' : 'file-tray-full-outline',
          MySalon:   focused ? 'storefront'     : 'storefront-outline',
          Bookings:  focused ? 'calendar'        : 'calendar-outline',
          Profile:   focused ? 'person'          : 'person-outline',
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
    })}
  >
    <Tab.Screen name="Dashboard" component={VendorDashboardStack} />
    <Tab.Screen name="MySalon" component={MySalonStack} options={{ tabBarLabel: 'My Salon' }} />
    <Tab.Screen name="Bookings" component={VendorBookingsStack} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Admin Stack ──────────────────────────────────────────────────────────────
const AdminStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: theme.background },
      headerTintColor: theme.labelPrimary,
    }}
  >
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ManageSalons" component={ManageSalonsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ManageAppointments" component={ManageAppointmentsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// ─── Root Navigator ────────────────────────────────────────────────────────────
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

  if (user.role === 'customer' || user.role === 'user') {
    return <NavigationContainer><CustomerTabs /></NavigationContainer>;
  }

  if (user.role === 'vendor') {
    if (!user.ownedSalon) return <NavigationContainer><VendorSetupStack /></NavigationContainer>;
    return <NavigationContainer><VendorTabs /></NavigationContainer>;
  }

  if (user.role === 'admin') return <NavigationContainer><AdminStack /></NavigationContainer>;

  return <NavigationContainer><AuthStack /></NavigationContainer>;
};

export default AppNavigator;
