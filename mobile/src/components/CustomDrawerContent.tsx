import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { 
  DrawerContentScrollView, 
  DrawerItemList, 
  DrawerItem 
} from '@react-navigation/drawer';
import { LogOut, User, Settings, ShieldCheck } from 'lucide-react-native';

const CustomDrawerContent = (props: any) => {
  const { onLogout } = props;

  return (
    <View className="flex-1 bg-slate-950">
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Profile Header */}
        <View className="px-5 py-8 bg-slate-900 mb-4 items-center border-b border-slate-800">
          <View className="w-16 h-16 bg-teal-500 rounded-2xl items-center justify-center mb-3">
            <User size={32} color="white" />
          </View>
          <Text className="text-white text-lg font-bold">Student User</Text>
          <Text className="text-slate-400 text-sm italic">Medical School - K68</Text>
          
          <View className="flex-row items-center mt-3 bg-teal-500/10 px-2 py-1 rounded-full border border-teal-500/20">
            <ShieldCheck size={14} color="#14b8a6" />
            <Text className="text-teal-500 text-[10px] font-bold ml-1 uppercase">Verified Student</Text>
          </View>
        </View>

        {/* Navigation Items */}
        <DrawerItemList {...props} />

        {/* Separator */}
        <View className="mx-5 my-4 border-t border-slate-800" />
        
        <Text className="px-5 text-slate-500 text-xs font-bold uppercase mb-2">Account Settings</Text>
        
        <DrawerItem
          label="Profile Settings"
          labelStyle={{ color: '#94a3b8', marginLeft: -16 }}
          icon={({ color, size }) => <Settings size={20} color="#64748b" />}
          onPress={() => {}}
        />
      </DrawerContentScrollView>

      {/* Logout Footer */}
      <View className="p-5 border-t border-slate-800">
        <TouchableOpacity 
          onPress={onLogout}
          className="flex-row items-center bg-red-500/10 p-4 rounded-xl border border-red-500/20"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-500 font-bold ml-3">Log Out</Text>
        </TouchableOpacity>
        
        <Text className="text-slate-600 text-[10px] text-center mt-4">BoneVisQA Mobile v1.0.0</Text>
      </View>
    </View>
  );
};

export default CustomDrawerContent;
