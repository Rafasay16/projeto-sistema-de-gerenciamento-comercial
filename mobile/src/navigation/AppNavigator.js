import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import SalesScreen from '../screens/SalesScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import MoreScreen from '../screens/MoreScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { isDarkMode } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const tabActiveColor = isDarkMode ? '#00b377' : '#008055';
  const tabInactiveColor = isDarkMode ? '#94a3b8' : '#64748b';
  const tabBgColor = isDarkMode ? '#15181c' : '#ffffff';
  const tabBorderColor = isDarkMode ? '#20252b' : '#e2e8f0';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Sales') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';
          }

          return <Ionicons name={iconName} size={size - 2} color={color} />;
        },
        tabBarActiveTintColor: tabActiveColor,
        tabBarInactiveTintColor: tabInactiveColor,
        tabBarStyle: {
          backgroundColor: tabBgColor,
          borderTopColor: tabBorderColor,
          borderTopWidth: 1,
          elevation: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDarkMode ? 0.2 : 0.05,
          shadowRadius: 5,
          height: (Platform.OS === 'ios' ? 88 : 64) + insets.bottom,
          paddingBottom: (Platform.OS === 'ios' ? 30 : 12) + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      {user?.role === 'gerente' && (
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ tabBarLabel: 'Painel' }}
        />
      )}
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen} 
        options={{ tabBarLabel: 'Produtos' }}
      />
      <Tab.Screen 
        name="Sales" 
        component={SalesScreen} 
        options={{ tabBarLabel: 'Vendas' }}
      />
      <Tab.Screen 
        name="Chatbot" 
        component={ChatbotScreen} 
        options={{ tabBarLabel: 'IA Assistente' }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen} 
        options={{ tabBarLabel: 'Mais' }}
      />
    </Tab.Navigator>
  );
}
