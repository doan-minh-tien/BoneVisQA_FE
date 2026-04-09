import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView
} from 'react-native';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleReset = () => {
    // UI Only: Simulate sending email
    setIsSent(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="px-6 py-8 flex-1">
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full items-center justify-center mb-8"
          >
            <ArrowLeft size={20} color="#94a3b8" />
          </TouchableOpacity>

          {!isSent ? (
            <View className="flex-1">
              {/* Header */}
              <View className="mb-8">
                <Text className="text-3xl font-bold text-white mb-2">Reset Password</Text>
                <Text className="text-slate-400">Enter your email address and we'll send you a link to reset your password.</Text>
              </View>

              {/* Form */}
              <View className="space-y-6">
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

                <TouchableOpacity 
                  onPress={handleReset}
                  className="bg-teal-500 rounded-2xl py-5 flex-row items-center justify-center shadow-lg shadow-teal-500/30"
                >
                  <Text className="text-white text-lg font-bold mr-2">Send Reset Link</Text>
                  <Send size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center -mt-20">
              <View className="w-20 h-20 bg-teal-500/10 rounded-full items-center justify-center mb-6 border border-teal-500/20">
                <Mail size={40} color="#14b8a6" />
              </View>
              <Text className="text-2xl font-bold text-white text-center mb-2">Check your email</Text>
              <Text className="text-slate-400 text-center mb-8 px-4">
                We've sent a password reset link to <Text className="text-teal-400 font-medium">{email}</Text>
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-5 items-center justify-center"
              >
                <Text className="text-white text-lg font-bold">Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
