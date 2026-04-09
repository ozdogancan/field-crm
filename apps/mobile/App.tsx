import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import WeeklyPlanScreen from './src/screens/WeeklyPlanScreen';
import StartVisitScreen from './src/screens/StartVisitScreen';
import ActiveVisitScreen from './src/screens/ActiveVisitScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProspectDetailScreen from './src/screens/ProspectDetailScreen';
import LoadingState from './src/components/ui/LoadingState';
import ToastViewport from './src/components/ui/ToastViewport';
import { navigationTheme, theme } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSubtle,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'TodayTab'
              ? 'home-outline'
              : route.name === 'WeeklyPlanTab'
                ? 'calendar-outline'
                : route.name === 'HistoryTab'
                ? 'time-outline'
                : 'person-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="TodayTab" component={HomeScreen} options={{ title: 'Bugün' }} />
      <Tab.Screen name="WeeklyPlanTab" component={WeeklyPlanScreen} options={{ title: 'Hafta' }} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} options={{ title: 'Geçmiş' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Oturum bilgileri kontrol ediliyor..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="StartVisit"
            component={StartVisitScreen}
            options={{
              headerShown: true,
              title: 'Ziyaret Başlat',
              headerTintColor: theme.colors.text,
              headerStyle: { backgroundColor: theme.colors.background },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="ActiveVisit"
            component={ActiveVisitScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="ProspectDetail"
            component={ProspectDetailScreen}
            options={{
              headerShown: true,
              title: 'Müşteri Detayı',
              headerTintColor: theme.colors.text,
              headerStyle: { backgroundColor: theme.colors.background },
              headerShadowVisible: false,
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <NavigationContainer theme={navigationTheme}>
            <AppNavigator />
          </NavigationContainer>
          <ToastViewport />
        </ToastProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
