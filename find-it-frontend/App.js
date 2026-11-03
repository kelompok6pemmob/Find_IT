import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AlertProvider } from './src/context/AlertContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Import Screens Auth / Onboarding
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// Import Screens Utama (Tabs)
import HomeScreen from './src/screens/HomeScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import CreateReportScreen from './src/screens/CreateReportScreen';
import SavedItemsScreen from './src/screens/SavedItemsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Import Screens Stack (Detail, Form & Settings)
import DetailItemScreen from './src/screens/DetailItemScreen';
import ClaimFormScreen from './src/screens/ClaimFormScreen';
import ReviewClaimScreen from './src/screens/ReviewClaimScreen';
import DirectChatScreen from './src/screens/DirectChatScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import MyActivityScreen from './src/screens/MyActivityScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import AccountSecurityScreen from './src/screens/AccountSecurityScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import AppearanceSettingsScreen from './src/screens/AppearanceSettingsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import AboutScreen from './src/screens/AboutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- BOTTOM TAB NAVIGATOR ---
function MainTabNavigator({ navigation }) {
  const { isDark, colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarStyle: {
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#334155' : '#F1F5F9',
          overflow: 'visible',
          elevation: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.35 : 0.06,
          shadowRadius: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'HomeTab') {
            return <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />;
          } else if (route.name === 'ChatTab') {
            return <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-outline'} size={24} color={color} />;
          } else if (route.name === 'SavedTab') {
            return <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={24} color={color} />;
          } else if (route.name === 'ProfileTab') {
            return <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'Home' }} 
      />
      <Tab.Screen 
        name="ChatTab" 
        component={ChatListScreen} 
        options={{ tabBarLabel: 'Chat' }} 
      />
      <Tab.Screen 
        name="CreateReportTab" 
        component={CreateReportScreen} 
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('CreateReport');
          },
        }}
        options={{ 
          tabBarLabel: () => null,
          tabBarButton: () => (
            <TouchableOpacity
              style={{
                top: -24,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('CreateReport')}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: '#059669',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#059669',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 2.2,
                    borderColor: '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          ),
        }} 
      />
      <Tab.Screen 
        name="SavedTab" 
        component={SavedItemsScreen} 
        options={{ tabBarLabel: 'Saved' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile' }} 
      />
    </Tab.Navigator>
  );
}

// --- APP CONTENT WITH THEME ---
function AppContent() {
  const { isDark } = useTheme();

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: '#0F172A',
          card: '#1E293B',
          text: '#F8FAFC',
          border: '#334155',
          primary: '#10B981',
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: '#F8FAFC',
          card: '#FFFFFF',
          text: '#0F172A',
          border: '#F1F5F9',
          primary: '#10B981',
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        {/* Splash & Auth Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Main Tabs Container */}
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />

        {/* Stack Screens Detail & Form */}
        <Stack.Screen name="CreateReport" component={CreateReportScreen} />
        <Stack.Screen name="DetailItem" component={DetailItemScreen} />
        <Stack.Screen name="ClaimForm" component={ClaimFormScreen} />
        <Stack.Screen name="ReviewClaim" component={ReviewClaimScreen} />
        <Stack.Screen name="DirectChat" component={DirectChatScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="MyActivity" component={MyActivityScreen} />

        {/* Notification Screens */}
        <Stack.Screen name="Notifications" component={NotificationScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />

        {/* Settings & Information Screens */}
        <Stack.Screen name="AccountSecurity" component={AccountSecurityScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="AppearanceSettings" component={AppearanceSettingsScreen} />
        <Stack.Screen name="Appearance" component={AppearanceSettingsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="AboutFindIt" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <AppContent />
      </AlertProvider>
    </ThemeProvider>
  );
}

