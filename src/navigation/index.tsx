import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingScreen, ONBOARDING_KEY } from '../screens/auth/OnboardingScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { ApplicationsScreen } from '../screens/client/ApplicationsScreen';
import { BookingScreen } from '../screens/client/BookingScreen';
import { BookingsListScreen } from '../screens/client/BookingsListScreen';
import { FavoritesScreen } from '../screens/client/FavoritesScreen';
import { HomeScreen } from '../screens/client/HomeScreen';
import { MapPickerScreen } from '../screens/client/MapPickerScreen';
import { ProPublicProfileScreen } from '../screens/client/ProPublicProfileScreen';
import { ProTrackingScreen } from '../screens/client/ProTrackingScreen';
import { SearchScreen } from '../screens/client/SearchScreen';
import { ServiceDetailScreen } from '../screens/client/ServiceDetailScreen';
import { EarningsScreen } from '../screens/pro/EarningsScreen';
import { ProHomeScreen } from '../screens/pro/HomeScreen';
import { ProJobsScreen } from '../screens/pro/JobsScreen';
import { ProAvailabilityScreen } from '../screens/pro/AvailabilityScreen';
import { ProPortfolioScreen } from '../screens/pro/PortfolioScreen';
import { VerificationScreen } from '../screens/pro/VerificationScreen';
import { EstimateScreen } from '../screens/shared/EstimateScreen';
import { ReferralsScreen } from '../screens/shared/ReferralsScreen';
import { DisputeScreen } from '../screens/shared/DisputeScreen';
import { PhotoEstimateScreen } from '../screens/shared/PhotoEstimateScreen';
import { ProCalendarScreen } from '../screens/client/ProCalendarScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { SupportScreen } from '../screens/shared/SupportScreen';
import { WalletScreen } from '../screens/shared/WalletScreen';
import { TopupScreen } from '../screens/shared/TopupScreen';
import { WalletBadge } from '../components/WalletBadge';
import { useWallet } from '../contexts/WalletContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Colors, Shadow } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation: nav }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: Colors.bg, elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { ...require('../theme').Typography.h4, color: Colors.ink },
        headerRight: () => (
          <WalletBadge onPress={() => nav.navigate('Wallet')} />
        ),
        headerRightContainerStyle: { paddingRight: 16 },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          ...Shadow.lg,
          paddingBottom: 8,
          paddingTop: 8,
          height: 68,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.ink4,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ color, focused, size }) => {
          const icons: Record<string, { def: string; active: string }> = {
            Home:      { def: 'home-outline',     active: 'home' },
            Favorites: { def: 'heart-outline',    active: 'heart' },
            Bookings:  { def: 'calendar-outline', active: 'calendar' },
            Profile:   { def: 'person-outline',   active: 'person' },
          };
          const icon = icons[route.name];
          return (
            <Ionicons
              name={(focused ? icon?.active : icon?.def) as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen}         options={{ title: 'Inicio' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen}   options={{ title: 'Favoritos' }} />
      <Tab.Screen name="Bookings"  component={BookingsListScreen} options={{ title: 'Mis servicios' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}     options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

function ClientStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="ClientTabs" component={ClientTabs} />
      <Stack.Screen name="Booking"         component={BookingScreen}         options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Applications"   component={ApplicationsScreen} />
      <Stack.Screen name="Chat"           component={ChatScreen} />
      <Stack.Screen name="MapPicker"      component={MapPickerScreen}       options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="ProTracking"    component={ProTrackingScreen} />
      <Stack.Screen name="Search"         component={SearchScreen} />
      <Stack.Screen name="ProPublicProfile" component={ProPublicProfileScreen} />
      <Stack.Screen name="ServiceDetail"  component={ServiceDetailScreen} />
      <Stack.Screen name="Notifications"  component={NotificationsScreen} />
      <Stack.Screen name="Settings"       component={SettingsScreen} />
      <Stack.Screen name="Support"        component={SupportScreen} />
      <Stack.Screen name="Wallet"         component={WalletScreen} />
      <Stack.Screen name="Topup"          component={TopupScreen}    options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Estimate"       component={EstimateScreen}      options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Referrals"      component={ReferralsScreen} />
      <Stack.Screen name="ProCalendar"    component={ProCalendarScreen} />
      <Stack.Screen name="Dispute"        component={DisputeScreen}       options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="PhotoEstimate"  component={PhotoEstimateScreen} options={{ animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}

function ProStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="ProTabs"        component={ProTabs} />
      <Stack.Screen name="Chat"           component={ChatScreen} />
      <Stack.Screen name="Notifications"  component={NotificationsScreen} />
      <Stack.Screen name="Settings"       component={SettingsScreen} />
      <Stack.Screen name="Support"        component={SupportScreen} />
      <Stack.Screen name="ProAvailability" component={ProAvailabilityScreen} />
      <Stack.Screen name="ProPortfolio"   component={ProPortfolioScreen} />
      <Stack.Screen name="Verification"   component={VerificationScreen} />
      <Stack.Screen name="Wallet"         component={WalletScreen} />
      <Stack.Screen name="Topup"          component={TopupScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Referrals"      component={ReferralsScreen} />
      <Stack.Screen name="Dispute"        component={DisputeScreen} options={{ animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}

function ProTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation: nav }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: Colors.bg, elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { ...require('../theme').Typography.h4, color: Colors.ink },
        headerRight: () => (
          <WalletBadge onPress={() => nav.navigate('Wallet')} />
        ),
        headerRightContainerStyle: { paddingRight: 16 },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          ...Shadow.lg,
          paddingBottom: 8, paddingTop: 8, height: 68,
        },
        tabBarActiveTintColor: Colors.proAccent,
        tabBarInactiveTintColor: Colors.ink4,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ color, focused, size }) => {
          const icons: Record<string, { def: string; active: string }> = {
            ProHome:    { def: 'briefcase-outline', active: 'briefcase' },
            Jobs:       { def: 'list-outline',      active: 'list' },
            Earnings:   { def: 'wallet-outline',    active: 'wallet' },
            ProProfile: { def: 'person-outline',    active: 'person' },
          };
          const icon = icons[route.name];
          return (
            <Ionicons
              name={(focused ? icon?.active : icon?.def) as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="ProHome"    component={ProHomeScreen}  options={{ title: 'Trabajos' }} />
      <Tab.Screen name="Jobs"       component={ProJobsScreen}  options={{ title: 'Historial' }} />
      <Tab.Screen name="Earnings"   component={EarningsScreen} options={{ title: 'Ganancias' }} />
      <Tab.Screen name="ProProfile" component={ProfileScreen}  options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, profile, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  usePushNotifications();

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY).then(val => {
      setOnboardingDone(val === '1');
    });
  }, []);

  if (loading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!user ? (
          <>
            {!onboardingDone && (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
            )}
            <Stack.Screen name="Welcome"        component={WelcomeScreen} />
            <Stack.Screen name="Login"          component={LoginScreen} />
            <Stack.Screen name="Register"       component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Estimate"       component={EstimateScreen}        options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="PhotoEstimate"  component={PhotoEstimateScreen}   options={{ animation: 'slide_from_bottom' }} />
          </>
        ) : profile?.role === 'pro' ? (
          <Stack.Screen name="ProRoot" component={ProStack} />
        ) : (
          <Stack.Screen name="ClientRoot" component={ClientStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
