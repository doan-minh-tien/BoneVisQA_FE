import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const modes = [
  {
    title: 'Q&A by Topic',
    description: 'Choose a bone/joint topic and chat with AI using our medical knowledge base (RAG).',
    color: '#e0f2fe',
    textColor: '#0284c7'
  },
  {
    title: 'Q&A by Image',
    description: 'Upload an X-ray, CT, or MRI image and ask AI questions about it.',
    color: '#fef9c3',
    textColor: '#ca8a04'
  },
];

export default function QAModeSelectScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView className="flex-1 bg-white p-4" style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      <Text className="text-2xl font-bold text-gray-900 mb-2" style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
        AI Q&A
      </Text>
      <Text className="text-base text-gray-500 mb-6" style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
        Choose a mode to start asking questions
      </Text>

      {modes.map((mode, index) => (
        <TouchableOpacity
          key={index}
          className="bg-white border rounded-xl p-6 mb-4 shadow-sm"
          style={{ backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 12, padding: 24, marginBottom: 16, elevation: 2 }}
          onPress={() => navigation.navigate('Chat', { mode: mode.title })}
        >
          <View 
            className="w-14 h-14 rounded-xl items-center justify-center mb-4" 
            style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: mode.color, marginBottom: 16 }}
          >
            <Text style={{ fontSize: 24, color: mode.textColor, fontWeight: 'bold' }}>AI</Text>
          </View>
          <Text className="text-xl font-bold mb-2" style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
            {mode.title}
          </Text>
          <Text className="text-gray-500 mb-4" style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
            {mode.description}
          </Text>
          <Text style={{ color: '#14b8a6', fontWeight: 'bold' }}>
            Get started →
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
