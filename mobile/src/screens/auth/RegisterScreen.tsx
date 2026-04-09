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
import { User, Mail, Lock, GraduationCap, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cohort, setCohort] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = () => {
    // UI Only: Simulate success
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center px-6">
        <View className="w-20 h-20 bg-emerald-500/20 rounded-full items-center justify-center mb-6 border border-emerald-500/30">
          <CheckCircle size={40} color="#10b981" />
        </View>
        <Text className="text-2xl font-bold text-white text-center mb-2">Registration Success!</Text>
        <Text className="text-slate-400 text-center mb-8 px-4">
          Your account has been created. Please wait for an administrator to activate your account.
        </Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')}
          className="w-full bg-teal-500 rounded-2xl py-5 items-center justify-center"
        >
          <Text className="text-white text-lg font-bold">Back to Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-8">
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full items-center justify-center mb-8"
          >
            <ArrowLeft size={20} color="#94a3b8" />
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-white mb-2">Create Account</Text>
            <Text className="text-slate-400">Join the medical visualization portal</Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {/* Full Name */}
            <View className="space-y-2">
              <Text className="text-slate-300 text-sm font-medium ml-1">Full Name</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4">
                <User size={20} color="#64748b" className="mr-3" />
                <TextInput
                  placeholder="John Doe"
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white text-base"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Email */}
            <View className="space-y-2">
              <Text className="text-slate-300 text-sm font-medium ml-1">Email Address</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4">
                <Mail size={20} color="#64748b" className="mr-3" />
                <TextInput
                  placeholder="student@example.com"
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white text-base"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password */}
            <View className="space-y-2">
              <Text className="text-slate-300 text-sm font-medium ml-1">Password</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4">
                <Lock size={20} color="#64748b" className="mr-3" />
                <TextInput
                  placeholder="Create a password"
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white text-base"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Cohort */}
            <View className="space-y-2">
              <Text className="text-slate-300 text-sm font-medium ml-1">School Cohort</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4">
                <GraduationCap size={20} color="#64748b" className="mr-3" />
                <TextInput
                  placeholder="e.g. K68 Medical"
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white text-base"
                  value={cohort}
                  onChangeText={setCohort}
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              onPress={handleRegister}
              className="mt-6 bg-teal-500 rounded-2xl py-5 items-center justify-center shadow-lg shadow-teal-500/30"
            >
              <Text className="text-white text-lg font-bold">Sign Up</Text>
            </TouchableOpacity>

            {/* Link to Login */}
            <View className="mt-6 flex-row justify-center items-center pb-8">
              <Text className="text-slate-500 text-sm">Already have an account?</Text>
              <TouchableOpacity className="ml-2" onPress={() => navigation.navigate('Login')}>
                <Text className="text-teal-500 text-sm font-bold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
