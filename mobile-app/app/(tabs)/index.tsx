import { Bell, BellDot, FileText, Home as HomeIcon, Upload, User } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function Home() {
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-10 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center space-x-2">
          <View className="bg-black rounded-xl p-2 mr-2">
            {/* Replace with actual logo if available */}
            <Text className="text-white font-bold text-lg">🧪</Text>
          </View>
          <Text className="font-bold text-xl">BioSentinel</Text>
        </View>
        <Bell size={28} color="#A3A3A3" />
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{paddingBottom: 90}}>
        {/* Session ID */}
        <Text className="px-6 text-xs text-gray-400 tracking-widest mt-2 mb-1">SESSION_ID: 0X8F92</Text>
        {/* Title */}
        <Text className="px-6 text-4xl font-bold leading-tight">Sequence Data{"\n"}Ingestion</Text>
        {/* Upload Card */}
        <View className="mx-4 mt-6 mb-4 bg-white border border-dashed border-gray-300 rounded-2xl py-10 items-center shadow-sm">
          <View className="bg-black rounded-full p-6 mb-4">
            <Upload size={40} color="white" />
          </View>
          <Text className="text-xl font-semibold mb-2">Upload FASTQ File</Text>
          <Text className="text-gray-400 tracking-widest text-xs">SUPPORTS <Text className="text-blue-500">.GZ</Text>, <Text className="text-blue-500">.FASTQ</Text>, <Text className="text-blue-500">.FASTA</Text></Text>
        </View>
        {/* Stats Cards */}
        <View className="flex-row justify-between mx-4 mb-4">
          <View className="flex-1 bg-white rounded-2xl p-4 mr-2 shadow-sm border border-gray-200">
            <View className="flex-row items-center justify-between mb-2">
              <FileText size={20} color="#A3A3A3" />
              <Text className="text-green-500 text-xs font-bold">+12%</Text>
            </View>
            <Text className="text-xs text-gray-400 mb-1">STORAGE USED</Text>
            <Text className="text-2xl font-bold">42.8<Text className="text-base">GB</Text></Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 ml-2 shadow-sm border border-gray-200">
            <View className="flex-row items-center justify-between mb-2">
              <BellDot size={20} color="#A3A3A3" />
              <Text className="text-xs text-gray-400">Active</Text>
            </View>
            <Text className="text-xs text-gray-400 mb-1">PIPELINES</Text>
            <Text className="text-2xl font-bold">03<Text className="text-base">/05</Text></Text>
          </View>
        </View>
        {/* Recent Analysis */}
        <View className="mx-4 mb-4">
          <Text className="text-lg font-bold mb-2">Recent Analysis</Text>
          <TouchableOpacity className="bg-black rounded-full py-4 items-center mb-2">
            <Text className="text-white text-lg font-semibold">Run Simulation Mode →</Text>
          </TouchableOpacity>
          <Text className="text-right text-xs text-gray-400">VIEW ALL</Text>
        </View>
      </ScrollView>
      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex-row justify-around items-center h-16">
        <TouchableOpacity className="items-center justify-center flex-1">
          <HomeIcon size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity className="items-center justify-center flex-1">
          <FileText size={28} color="#A3A3A3" />
        </TouchableOpacity>
        <TouchableOpacity className="items-center justify-center flex-1">
          <BellDot size={28} color="#A3A3A3" />
        </TouchableOpacity>
        <TouchableOpacity className="items-center justify-center flex-1">
          <User size={28} color="#A3A3A3" />
        </TouchableOpacity>
      </View>
    </View>
  );
}