import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import QuizListScreen from './src/screens/student/quiz/QuizListScreen';
import QAModeSelectScreen from './src/screens/student/qa/QAModeSelectScreen';
import ChatScreen from './src/screens/student/qa/ChatScreen';

const Tab = createBottomTabNavigator();
const QAStack = createNativeStackNavigator();

function QANavigator() {
  return (
    <QAStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#14b8a6' }, headerTintColor: '#fff' }}>
      <QAStack.Screen name="ModeSelect" component={QAModeSelectScreen} options={{ headerShown: false }} />
      <QAStack.Screen name="Chat" component={ChatScreen} options={({ route }: any) => ({ title: route?.params?.mode || 'Chat' })} />
    </QAStack.Navigator>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#14b8a6' },
            headerTintColor: '#fff',
            tabBarActiveTintColor: '#14b8a6',
          }}
        >
          <Tab.Screen 
            name="Quizzes" 
            component={QuizListScreen} 
            options={{ title: 'My Quizzes' }} 
          />
          <Tab.Screen 
            name="QA" 
            component={QANavigator} 
            options={{ title: 'AI Q&A', headerShown: false }} 
          />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
