import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

const USER_BLUE = '#0055ff';
const AI_GRAY = '#f1f5f9';

export default function ChatScreen({ route }: { route?: { params?: { mode?: string } } }) {
  const mode = route?.params?.mode || 'Q&A Chat';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! You have selected: ${mode}. What questions do you have today?`,
      sender: 'ai',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(t);
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: Message = { id: Date.now().toString(), text: inputText.trim(), sender: 'user' };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: `This is a simulated AI response aligned with the web Visual QA flow. You asked: "${newMsg.text}"`,
          sender: 'ai',
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  const renderBubble = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          backgroundColor: isUser ? USER_BLUE : AI_GRAY,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 18,
          marginBottom: 8,
          maxWidth: '82%',
          borderWidth: isUser ? 0 : 1,
          borderColor: '#e2e8f0',
        }}
      >
        <Text style={{ color: isUser ? '#ffffff' : '#0f172a', fontSize: 15, lineHeight: 20 }}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderBubble}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          isTyping ? (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: AI_GRAY,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderRadius: 18,
                marginBottom: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Text style={{ color: '#64748b', fontWeight: '700' }}>•</Text>
              <Text style={{ color: '#64748b', fontWeight: '700' }}>•</Text>
              <Text style={{ color: '#64748b', fontWeight: '700' }}>•</Text>
            </View>
          ) : null
        }
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderColor: '#e5e7eb',
          backgroundColor: '#ffffff',
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: '#f3f4f6',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            marginRight: 8,
            fontSize: 16,
            maxHeight: 120,
          }}
          placeholder="Message…"
          placeholderTextColor="#64748b"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={{
            backgroundColor: USER_BLUE,
            borderRadius: 999,
            height: 44,
            width: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={handleSend}
          accessibilityLabel="Send message"
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
