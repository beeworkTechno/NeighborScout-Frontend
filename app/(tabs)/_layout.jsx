import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/styles/colors';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primaryDark }}>
      <Tabs.Screen name="home" options={{
        title: 'Home',
        tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />
      }} />
      <Tabs.Screen name="search" options={{
        title: 'Search',
        tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={22} color={color} />
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />
      }} />
    </Tabs>
  );
}