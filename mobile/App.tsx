import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import StudentDashboardScreen from './src/screens/student/dashboard/StudentDashboardScreen';
import CatalogScreen from './src/screens/student/catalog/CatalogScreen';
import HistoryScreen from './src/screens/student/history/HistoryScreen';
import QuizListScreen from './src/screens/student/quiz/QuizListScreen';
import QAModeSelectScreen from './src/screens/student/qa/QAModeSelectScreen';
import ChatScreen from './src/screens/student/qa/ChatScreen';

// Components
import CustomDrawerContent from './src/components/CustomDrawerContent';

const Drawer = createDrawerNavigator();
const QAStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function QANavigator() {
  return (
    <QAStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#14b8a6' }, headerTintColor: '#fff' }}>
      <QAStack.Screen name="ModeSelect" component={QAModeSelectScreen} options={{ headerShown: false }} />
      <QAStack.Screen name="Chat" component={ChatScreen} options={({ route }: any) => ({ title: route?.params?.mode || 'Chat' })} />
    </QAStack.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    // Simulated login logic for UI demo
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Simulated logout logic for UI demo
    setIsAuthenticated(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          {!isAuthenticated ? (
            <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <AuthStack.Screen name="Login">
                {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
              </AuthStack.Screen>
              <AuthStack.Screen name="Register" component={RegisterScreen} />
              <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </AuthStack.Navigator>
          ) : (
            <Drawer.Navigator
              drawerContent={(props) => <CustomDrawerContent {...props} onLogout={handleLogout} />}
              screenOptions={{
                headerStyle: { backgroundColor: '#0f172a' }, // Tailwind slate-900
                headerTintColor: '#fff',
                drawerStyle: { backgroundColor: '#0f172a', width: 280 },
                drawerActiveBackgroundColor: '#1e293b', // slate-800
                drawerActiveTintColor: '#14b8a6', // teal-500
                drawerInactiveTintColor: '#cbd5e1', // slate-300
              }}
            >
              <Drawer.Screen 
                name="Dashboard" 
                component={StudentDashboardScreen} 
                options={{ title: 'Dashboard' }} 
              />
              <Drawer.Screen 
                name="Catalog" 
                component={CatalogScreen} 
                options={{ title: 'Case Catalog' }} 
              />
              <Drawer.Screen 
                name="History" 
                component={HistoryScreen} 
                options={{ title: 'History' }} 
              />
              <Drawer.Screen 
                name="QA" 
                component={QANavigator} 
                options={{ title: 'Visual QA' }} 
              />
              <Drawer.Screen 
                name="Quizzes" 
                component={QuizListScreen} 
                options={{ title: 'Quizzes' }} 
              />
            </Drawer.Navigator>
          )}
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
