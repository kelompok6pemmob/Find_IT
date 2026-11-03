import React from'react';
import { View, StyleSheet, TouchableOpacity } from'react-native';
import { NavigationContainer } from'@react-navigation/native';
import { createNativeStackNavigator } from'@react-navigation/native-stack';
import { createBottomTabNavigator } from'@react-navigation/bottom-tabs';
import { Ionicons, Feather } from'@expo/vector-icons';

// Import Semua Screen
import HomeScreen from'../screens/HomeScreen';
import DetailItemScreen from'../screens/DetailItemScreen';
import CreateReportScreen from'../screens/CreateReportScreen';
import ChatListScreen from'../screens/ChatListScreen';
import DirectChatScreen from'../screens/DirectChatScreen';
import ClaimFormScreen from'../screens/ClaimFormScreen';
import ReviewClaimScreen from'../screens/ReviewClaimScreen';
import SavedItemsScreen from'../screens/SavedItemsScreen';
import ProfileScreen from'../screens/ProfileScreen';
import EditProfileScreen from'../screens/EditProfileScreen';
import MyActivityScreen from'../screens/MyActivityScreen';
import AccountSecurityScreen from'../screens/AccountSecurityScreen';
import NotificationSettingsScreen from'../screens/NotificationSettingsScreen';
import AppearanceSettingsScreen from'../screens/AppearanceSettingsScreen';
import HelpSupportScreen from'../screens/HelpSupportScreen';
import AboutScreen from'../screens/AboutScreen';
import NotificationScreen from'../screens/NotificationScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Middle Add Button (Presisi Center)
function CustomTabBarButton({ onPress }) {
  return (
    <TouchableOpacity
      style={styles.customAddButtonWrapper}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.customAddButton}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

// Bottom Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor:'#10B981',
        tabBarInactiveTintColor:'#94A3B8',
        tabBarLabelStyle: styles.tabBarLabel,
        backBehavior:'history', //  MENGINGAT RIWAYAT TAB TERAKHIR PAS DI-BACK
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel:'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ?'home' :'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="ChatTab"
        component={ChatListScreen}
        options={{
          tabBarLabel:'Chat',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-outline" size={22} color={color} />
          ),
        }}
      />

      {/* Dummy Screen untuk Placeholder Tab Tengah */}
      <Tab.Screen
        name="CreateReportTab"
        component={CreateReportScreen}
        options={({ navigation }) => ({
          tabBarLabel:'',
          tabBarButton: () => (
            <CustomTabBarButton
              onPress={() => navigation.navigate('CreateReport')}
            />
          ),
        })}
      />

      <Tab.Screen
        name="SavedTab"
        component={SavedItemsScreen}
        options={{
          tabBarLabel:'Saved',
          tabBarIcon: ({ color }) => (
            <Feather name="bookmark" size={22} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel:'Profile',
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Root Stack Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main Tabs */}
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />

        {/* Create Report Ditaruh di Stack Utama (Full Screen / Modal) */}
        <Stack.Screen
          name="CreateReport"
          component={CreateReportScreen}
          options={{ animation:'slide_from_bottom' }}
        />

        {/* Other Screens */}
        <Stack.Screen name="DetailItem" component={DetailItemScreen} />
        <Stack.Screen name="DirectChat" component={DirectChatScreen} />
        <Stack.Screen name="ClaimForm" component={ClaimFormScreen} />
        <Stack.Screen name="ReviewClaim" component={ReviewClaimScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="MyActivity" component={MyActivityScreen} />
        <Stack.Screen name="AccountSecurity" component={AccountSecurityScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="AppearanceSettings" component={AppearanceSettingsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    backgroundColor:'#FFFFFF',
    borderTopWidth: 1,
    borderTopColor:'#F1F5F9',
    position:'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight:'500',
  },
  customAddButtonWrapper: {
    flex: 1, //  PENTING: Bikin Wrapper Mengisi Seluruh Area Tab Tengah
    top: -18,
    justifyContent:'center',
    alignItems:'center',
  },
  customAddButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor:'#10B981',
    justifyContent:'center',
    alignItems:'center',
    elevation: 4,
    shadowColor:'#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});