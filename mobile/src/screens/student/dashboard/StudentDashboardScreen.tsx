import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { BookOpen, MessageSquare, Trophy, Target, BotMessageSquare, ImageUp } from 'lucide-react-native';
import StatCard from '../../../../components/StatCard';

export default function StudentDashboardScreen({ navigation }: any) {
  // Use generic mock data for layout purposes before full API hookup
  const mockProgress = {
    totalCasesViewed: 45,
    totalQuestionsAsked: 128,
    escalatedAnswers: 12,
    avgQuizScore: 84,
    completedQuizzes: 15,
    quizAccuracyRate: 82,
    totalQuizAttempts: 18,
  };

  return (
    <ScrollView className="flex-1 bg-slate-900 px-4 pt-6">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-white mb-1">Welcome back</Text>
        <Text className="text-sm text-slate-400">Your live progress snapshot across cases, Q&A, and quizzes</Text>
      </View>

      <Text className="text-lg font-semibold text-white mb-3">Live Progress</Text>
      
      <StatCard
        title="Cases viewed"
        value={mockProgress.totalCasesViewed}
        change="Pulled from live progress analytics"
        icon={BookOpen}
        iconBgColor="bg-blue-500/10"
        iconTintColor="#3b82f6"
      />
      
      <StatCard
        title="Questions asked"
        value={mockProgress.totalQuestionsAsked}
        change={`${mockProgress.escalatedAnswers} escalated to experts`}
        icon={MessageSquare}
        iconBgColor="bg-cyan-500/10"
        iconTintColor="#06b6d4"
      />

      <StatCard
        title="Average quiz score"
        value={`${mockProgress.avgQuizScore}%`}
        change={`${mockProgress.completedQuizzes} completed quizzes`}
        changeType="positive"
        icon={Trophy}
        iconBgColor="bg-yellow-500/10"
        iconTintColor="#eab308"
      />

      <Text className="text-lg font-semibold text-white mt-4 mb-3">Quick Actions</Text>
      
      <View className="flex-row justify-between mb-8">
        <TouchableOpacity 
          className="flex-1 bg-slate-800 rounded-xl p-4 mr-2 border border-slate-700 items-center"
          onPress={() => navigation.navigate('QA')}
        >
          <View className="h-10 w-10 bg-cyan-500/10 rounded-full items-center justify-center mb-2">
            <ImageUp size={20} color="#06b6d4" />
          </View>
          <Text className="text-white font-medium text-center text-sm">Visual QA</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-1 bg-slate-800 rounded-xl p-4 ml-2 border border-slate-700 items-center"
          onPress={() => navigation.navigate('Quizzes')}
        >
          <View className="h-10 w-10 bg-yellow-500/10 rounded-full items-center justify-center mb-2">
            <Trophy size={20} color="#eab308" />
          </View>
          <Text className="text-white font-medium text-center text-sm">Practice Quiz</Text>
        </TouchableOpacity>
      </View>

      <View className="h-10" />
    </ScrollView>
  );
}
