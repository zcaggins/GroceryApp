import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CartProvider, useCart } from './src/context/CartContext';
import ShopScreen from './src/screens/ShopScreen';
import CartScreen from './src/screens/CartScreen';
import DeliveryScreen from './src/screens/DeliveryScreen';
import InvolvedScreen from './src/screens/InvolvedScreen';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

const ICONS = {
  Shop: 'storefront',
  Cart: 'basket',
  Delivery: 'map',
  'Get Involved': 'people',
};

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.cream, primary: colors.green } };

function Tabs() {
  const { count } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.green },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Shop" component={ShopScreen} options={{ title: 'Louisville Community Grocery', tabBarLabel: 'Shop' }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Your Cart', tabBarBadge: count > 0 ? count : undefined, tabBarBadgeStyle: { backgroundColor: colors.orange } }}
      />
      <Tab.Screen name="Delivery" component={DeliveryScreen} options={{ title: 'Delivery Area' }} />
      <Tab.Screen name="Get Involved" component={InvolvedScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <Tabs />
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  );
}
