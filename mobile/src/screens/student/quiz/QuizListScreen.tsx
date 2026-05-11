import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { mockQuizzes } from '../../../constants/mockData';
import { TabKey } from '../../../components/student/quiz/types';

export default function QuizListScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const filteredQuizzes = mockQuizzes.filter((q) => {
    if (activeTab !== 'all' && q.status !== activeTab) return false;
    return true;
  });

  const renderTab = (key: TabKey, label: string) => {
    const isActive = activeTab === key;
    return (
      <TouchableOpacity
        onPress={() => setActiveTab(key)}
        className={`px-4 py-2 rounded-md ${isActive ? 'bg-primary' : 'bg-gray-200'} mx-1`}
        style={{ backgroundColor: isActive ? '#14b8a6' : '#e5e7eb' }} // Fallback if tailwind fails immediately
      >
        <Text className={isActive ? 'text-white' : 'text-gray-700'} style={{ color: isActive ? '#fff' : '#374151' }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white p-4" style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      
      {/* Tabs */}
      <View className="flex-row mb-4" style={{ flexDirection: 'row', marginBottom: 16 }}>
        {renderTab('all', 'All Quizzes')}
        {renderTab('not_started', 'Not Started')}
        {renderTab('completed', 'Completed')}
      </View>

      {/* List */}
      <FlatList
        data={filteredQuizzes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <Text className="text-lg font-bold text-gray-900" style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
              {item.title}
            </Text>
            <Text className="text-sm text-gray-500 mt-1" style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              {item.topic} • {item.difficulty} • {item.totalQuestions} Questions
            </Text>
            
            <View className="mt-3 flex-row justify-between items-center" style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text className="text-sm font-medium" style={{ fontSize: 14, fontWeight: '500', color: item.status === 'completed' ? '#22c55e' : '#6b7280' }}>
                {item.status === 'completed' ? `Score: ${item.score}` : 'Not Started'}
              </Text>
              
              <TouchableOpacity className="bg-primary px-3 py-1.5 rounded" style={{ backgroundColor: '#14b8a6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }}>
                <Text className="text-white text-sm" style={{ color: '#fff', fontSize: 14 }}>
                  {item.status === 'completed' ? 'Review' : 'Start'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
