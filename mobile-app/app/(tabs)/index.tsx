import { BellDot, FileText, Upload, User } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function Home() {
  // Simulate user role: 'lab', 'doctor', 'patient'
  const [role, setRole] = useState<'lab' | 'doctor' | 'patient'>('lab');

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-8 pb-4 border-b border-black">
        <Text className="text-black text-2xl font-bold tracking-widest">BIOSENTINEL</Text>
        <View className="bg-black px-3 py-1 rounded">
          <Text className="text-white text-xs font-bold tracking-widest">LAB_ID:884-XJ</Text>
        </View>
      </View>
      {/* Role Switcher for demo/testing */}
      <View className="flex-row justify-center items-center py-2">
        <TouchableOpacity onPress={() => setRole('lab')} className={`px-3 py-1 mx-1 rounded ${role==='lab'?'bg-black':'bg-gray-200'}`}> <Text className={`font-bold ${role==='lab'?'text-white':'text-black'}`}>Lab</Text> </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('doctor')} className={`px-3 py-1 mx-1 rounded ${role==='doctor'?'bg-black':'bg-gray-200'}`}> <Text className={`font-bold ${role==='doctor'?'text-white':'text-black'}`}>Doctor</Text> </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('patient')} className={`px-3 py-1 mx-1 rounded ${role==='patient'?'bg-black':'bg-gray-200'}`}> <Text className={`font-bold ${role==='patient'?'text-white':'text-black'}`}>Patient</Text> </TouchableOpacity>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{paddingBottom: 90}}>
        {/* Stats Cards */}
        <View className="flex-row justify-between mx-4 mt-6 mb-6">
          <View className="flex-1 border border-black p-6 mr-2 rounded-md flex-col items-start justify-center">
            <FileText size={32} color="#000" />
            <Text className="text-4xl font-bold tracking-tight mt-2">12</Text>
            <Text className="text-xs font-bold tracking-widest mt-1">ACTIVE JOBS</Text>
          </View>
          <View className="flex-1 border border-black p-6 ml-2 rounded-md flex-col items-start justify-center">
            <BellDot size={32} color="#000" />
            <Text className="text-4xl font-bold tracking-tight mt-2">04</Text>
            <Text className="text-xs font-bold tracking-widest mt-1">PENDING AUDIT</Text>
          </View>
        </View>
        {/* Only Lab can upload and simulate */}
        {role === 'lab' && (
          <>
            <Text className="mx-4 text-lg font-bold tracking-widest mb-2">NEW SEQUENCE</Text>
            <View className="mx-4 mb-2">
              <Text className="text-xs font-bold tracking-widest mb-1">SAMPLE ID</Text>
              <View className="border border-black rounded px-2 py-2 mb-2">
                <Text className="text-xs text-gray-500">EX: SEQ-2024-A</Text>
              </View>
              <Text className="text-xs font-bold tracking-widest mb-1">BATCH NO.</Text>
              <View className="border border-black rounded px-2 py-2">
                <Text className="text-xs text-gray-500">EX: B-99-X</Text>
              </View>
            </View>
            {/* Upload FASTQ File Card */}
            <View className="mx-4 border border-black border-dashed rounded-md py-10 items-center mb-4">
              <View className="bg-black rounded-full p-6 mb-4">
                <Upload size={40} color="white" />
              </View>
              <Text className="text-lg font-bold tracking-widest mb-2">UPLOAD FASTQ FILE</Text>
              <Text className="text-xs text-gray-500 mb-4">.GZ, .FASTQ formats supported</Text>
              <TouchableOpacity className="border border-black rounded px-4 py-2 mb-2">
                <Text className="text-black text-base font-bold tracking-widest">BROWSE FILES</Text>
              </TouchableOpacity>
            </View>
            {/* Initiate Simulation Button */}
            <TouchableOpacity className="mx-4 bg-black flex-row items-center justify-center py-4 mb-6 rounded" style={{width: '92%'}}>
              <Text className="text-white text-lg font-bold tracking-widest">INITIATE SIMULATION</Text>
            </TouchableOpacity>
          </>
        )}
        {/* Recent Sequences (visible to all roles) */}
        <View className="mx-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-bold tracking-widest">RECENT SEQUENCES</Text>
            <Text className="text-xs font-bold underline">VIEW ALL</Text>
          </View>
          <View className="border-t border-black mb-2" />
          {/* Sequence 1 - Processing */}
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <Text className="text-black text-lg mr-2">⏳</Text>
              <View>
                <Text className="text-base font-mono">SEQ_009.fastq</Text>
                <Text className="text-xs text-gray-500">PROCESSING...</Text>
              </View>
            </View>
            <Text className="text-xs font-bold">128 MB</Text>
          </View>
          {/* Sequence 2 - Complete */}
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <Text className="text-black text-lg mr-2">✔️</Text>
              <View>
                <Text className="text-base font-mono">SEQ_008.fastq</Text>
                <Text className="text-xs text-gray-500">COMPLETE</Text>
              </View>
            </View>
            <Text className="text-xs font-bold">420 MB</Text>
          </View>
          {/* Sequence 3 - Complete */}
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <Text className="text-black text-lg mr-2">✔️</Text>
              <View>
                <Text className="text-base font-mono">SEQ_007.fastq</Text>
                <Text className="text-xs text-gray-500">COMPLETE</Text>
              </View>
            </View>
            <Text className="text-xs font-bold">315 MB</Text>
          </View>
        </View>
        {/* Report/Review section for Doctor and Patient */}
        {(role === 'doctor' || role === 'patient') && (
          <View className="mx-4 mb-4">
            <Text className="text-lg font-bold tracking-widest mb-2">REPORT REVIEW</Text>
            <View className="border border-black rounded p-4 mb-2">
              <Text className="text-base font-bold mb-1">RESULT: ACTION REQUIRED</Text>
              <Text className="text-xs mb-2">Genetic marker identified. Consultation recommended immediately.</Text>
              <TouchableOpacity className="bg-black rounded px-4 py-2 mb-2 flex-row items-center justify-center">
                <Text className="text-white text-base font-bold tracking-widest">DOWNLOAD PDF REPORT</Text>
              </TouchableOpacity>
              <TouchableOpacity className="border border-black rounded px-4 py-2 flex-row items-center justify-center">
                <Text className="text-black text-base font-bold tracking-widest">VERIFY HEALTH DATA</Text>
              </TouchableOpacity>
            </View>
            <View className="border border-black rounded p-4">
              <Text className="text-xs font-bold mb-1">SUMMARY DATA</Text>
              <Text className="text-xs">RISK LEVEL: HIGH</Text>
              <Text className="text-xs">VARIANT DETECTED: BRCA1</Text>
              <Text className="text-xs">ANALYSIS TYPE: WHOLE EXOME SEQ</Text>
              <Text className="text-xs">DATE PROCESSED: OCT 24, 2023</Text>
              <Text className="text-xs">LAB ID: BS-9921-X</Text>
            </View>
          </View>
        )}
      </ScrollView>
      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-black flex-row justify-around items-center h-20">
        <TouchableOpacity className="items-center justify-center flex-1">
          <Upload size={28} color="#000" />
          <Text className="text-xs font-bold mt-1">UPLOADS</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center justify-center flex-1">
          <FileText size={28} color="#000" />
          <Text className="text-xs font-bold mt-1">ANALYSIS</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center justify-center flex-1">
          <BellDot size={28} color="#000" />
          <Text className="text-xs font-bold mt-1">AUDIT</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center justify-center flex-1">
          <User size={28} color="#000" />
          <Text className="text-xs font-bold mt-1">PROFILE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}