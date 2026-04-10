import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export default function ChatScreen({ route }: any) {
  const mode = route?.params?.mode || 'Q&A Chat';
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: `Hello! You have selected: ${mode}. What questions do you have today?`, sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    // Add user message
    const newMsg: Message = { id: Date.now().toString(), text: inputText.trim(), sender: 'user' };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: `This is a simulated AI response mimicking the web RAG system. You asked: "${newMsg.text}"`,
        sender: 'ai'
      }]);
    }, 1000);
  };

  const renderBubble = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View className={`rounded-xl px-4 py-3 mb-2 max-w-[80%] ${isUser ? 'bg-primary' : 'bg-gray-100'}`}
            style={{ 
              alignSelf: isUser ? 'flex-end' : 'flex-start',
              backgroundColor: isUser ? '#14b8a6' : '#f3f4f6',
              paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, marginBottom: 8, maxWidth: '80%'
            }}>
        <Text style={{ color: isUser ? '#fff' : '#111827', fontSize: 15 }}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white" 
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90} // To counteract the header bar
    >
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderBubble}
        contentContainerStyle={{ padding: 16 }}
      />
      
      <View className="flex-row items-center p-3 border-t border-gray-200 bg-white" style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' }}>
        <TextInput
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 mr-2 text-base"
          style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, fontSize: 16 }}
          placeholder="Ask AI a question..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity 
          className="bg-primary rounded-full items-center justify-center h-11 w-11"
          style={{ backgroundColor: '#14b8a6', borderRadius: 9999, height: 44, width: 44, alignItems: 'center', justifyContent: 'center' }}
          onPress={handleSend}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
