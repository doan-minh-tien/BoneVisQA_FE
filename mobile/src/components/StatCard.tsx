import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

export type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconBgColor?: string;
  iconTintColor?: string;
};

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconBgColor = 'bg-teal-500/10',
  iconTintColor = '#14b8a6', // tailwind teal-500
}: StatCardProps) {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-emerald-500';
    if (changeType === 'negative') return 'text-rose-500';
    return 'text-slate-400';
  };

  return (
    <View className="mb-4 rounded-2xl border border-slate-700 bg-slate-800 p-5">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm font-medium text-slate-400">{title}</Text>
          <Text className="mt-2 text-3xl font-bold text-white">{value}</Text>
        </View>
        <View className={`h-12 w-12 items-center justify-center rounded-xl ${iconBgColor}`}>
          <Icon size={24} color={iconTintColor} />
        </View>
      </View>
      {change && (
        <View className="mt-4 flex-row items-center">
          <Text className={`text-xs font-semibold ${getChangeColor()}`}>{change}</Text>
        </View>
      )}
    </View>
  );
}
