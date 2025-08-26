import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { icons } from '@/constants/icons';

interface LoginButtonsProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  passwordRef: React.RefObject<TextInput>;
  handleSignIn: () => void;
  loading: boolean;
}

const LoginButtons: React.FC<LoginButtonsProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  passwordRef,
  handleSignIn,
  loading,
}) => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-primary justify-center px-6">
      {/* Logo */}
      <View className="items-center mb-12">
        <Image 
          source={icons.logo}
          className="w-16 h-16 mb-4"
          resizeMode="contain"
        />
        <Text className="text-white text-3xl font-bold mb-2">
          Welcome Back
        </Text>
        <Text className="text-gray-400 text-base text-center">
          Sign in to continue watching
        </Text>
      </View>
      
      {/* Form */}
      <View>
        <TextInput
          className="bg-secondary p-4 rounded-xl text-white mb-4"
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        
        <View className="relative">
          <TextInput
            ref={passwordRef}
            className="bg-secondary p-4 pr-12 rounded-xl text-white"
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-4"
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity
        className={`mt-8 p-4 rounded-xl ${loading ? 'bg-gray-600' : 'bg-accent'}`}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        className="mt-6"
        onPress={() => router.push('/(auth)/signup')}
      >
        <Text className="text-gray-400 text-center">
          Don't have an account? <Text className="text-accent font-semibold">Sign Up</Text>
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity className="mt-4">
        <Text className="text-gray-500 text-center text-sm">
          Forgot your password?
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginButtons;