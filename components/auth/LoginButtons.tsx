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
    <View className="flex-1 bg-primary justify-center px-8">
      {/* Logo */}
      <View className="items-center mb-12">
        <Image 
          source={icons.logo}
          className="w-20 h-20 mb-6"
          resizeMode="contain"
        />
        <Text className="text-white text-3xl font-bold mb-3">
          Welcome Back
        </Text>
        <Text className="text-gray-400 text-lg text-center">
          Sign in to continue watching
        </Text>
      </View>
      
      {/* Form */}
      <View className="mb-8">
        <TextInput
          className="bg-secondary p-5 rounded-xl text-white mb-6"
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
            className="bg-secondary p-5 pr-14 rounded-xl text-white"
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
            className="absolute right-5 top-5"
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity
        className={`p-5 rounded-xl mb-8 ${loading ? 'bg-gray-600' : 'bg-accent'}`}
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
      
      <View className="items-center">
        <TouchableOpacity
          className="mb-4"
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text className="text-gray-400 text-center text-lg">
            Don&apos;t have an account? <Text className="text-accent font-semibold">Sign Up</Text>
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Text className="text-gray-500 text-center">
            Forgot your password?
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginButtons;