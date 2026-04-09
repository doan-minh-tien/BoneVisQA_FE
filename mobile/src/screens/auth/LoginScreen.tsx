import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { GraduationCap, Mail, Lock, ChevronRight, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12">
          {/* Header Section */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-teal-500/20 rounded-3xl items-center justify-center mb-6 border border-teal-500/30">
              <GraduationCap size={40} color="#14b8a6" />
            </View>
            <Text className="text-3xl font-bold text-white text-center">BoneVisQA</Text>
            <View className="bg-teal-500/10 px-3 py-1 rounded-full mt-2 border border-teal-500/20">
              <Text className="text-teal-400 text-sm font-medium">Student Portal</Text>
            </View>
          </View>

          {/* Form Section */}
          <View className="space-y-6">
            <Text className="text-slate-400 text-lg mb-2">Welcome back!</Text>
            
            {/* Email/ID Input */}
            <View className="space-y-2">
              <Text className="text-slate-300 text-sm font-medium ml-1">Student Email or ID</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4">
                <Mail size={20} color="#64748b" className="mr-3" />
                <TextInput
                  placeholder="Enter your student credentials"
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white text-base"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="space-y-2 mt-4">
              <View className="flex-row justify-between items-center px-1">
                <Text className="text-slate-300 text-sm font-medium">Password</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text className="text-teal-500 text-xs font-medium">Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4">
                <Lock size={20} color="#64748b" className="mr-3" />
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white text-base"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#64748b" />
                  ) : (
                    <Eye size={20} color="#64748b" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              onPress={onLogin}
              className="mt-8 bg-teal-500 rounded-2xl py-5 flex-row items-center justify-center shadow-lg shadow-teal-500/30"
            >
              <Text className="text-white text-lg font-bold mr-2">Sign In</Text>
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>

            {/* Secondary Options */}
            <View className="mt-8 flex-row justify-center items-center">
              <Text className="text-slate-500 text-sm">Don't have an account?</Text>
              <TouchableOpacity className="ml-2" onPress={() => navigation.navigate('Register')}>
                <Text className="text-teal-500 text-sm font-bold">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Branding */}
          <View className="mt-auto pt-10 items-center opacity-40">
            <Text className="text-slate-500 text-xs italic">Advanced Bone Visualization & QA Platform</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
