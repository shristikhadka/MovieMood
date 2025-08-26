import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { icons } from '@/constants/icons';

interface SignupButtonsProps {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  nameRef: React.RefObject<TextInput>;
  emailRef: React.RefObject<TextInput>;
  passwordRef: React.RefObject<TextInput>;
  confirmPasswordRef: React.RefObject<TextInput>;
  handleSignUp: () => void;
  loading: boolean;
}

const SignupButtons: React.FC<SignupButtonsProps> = ({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  nameRef,
  emailRef,
  passwordRef,
  confirmPasswordRef,
  handleSignUp,
  loading,
}) => {
  const router = useRouter();

  return (
    <ScrollView 
      className="flex-1 bg-primary" 
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View className="items-center mb-10">
        <Image 
          source={icons.logo}
          className="w-16 h-16 mb-4"
          resizeMode="contain"
        />
        <Text className="text-white text-3xl font-bold mb-2">
          Create Account
        </Text>
        <Text className="text-gray-400 text-base text-center">
          Join MovieMood and discover movies
        </Text>
      </View>
      
      {/* Form */}
      <View>
        <TextInput
          ref={nameRef}
          className="bg-secondary p-4 rounded-xl text-white mb-4"
          placeholder="Full Name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        
        <TextInput
          ref={emailRef}
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
        
        <View className="relative mb-4">
          <TextInput
            ref={passwordRef}
            className="bg-secondary p-4 pr-12 rounded-xl text-white"
            placeholder="Password (min 6 characters)"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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
        
        <View className="relative">
          <TextInput
            ref={confirmPasswordRef}
            className="bg-secondary p-4 pr-12 rounded-xl text-white"
            placeholder="Confirm Password"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-4"
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity
        className={`mt-8 p-4 rounded-xl ${loading ? 'bg-gray-600' : 'bg-accent'}`}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        className="mt-6"
        onPress={() => router.push('/(auth)/login')}
      >
        <Text className="text-gray-400 text-center">
          Already have an account? <Text className="text-accent font-semibold">Sign In</Text>
        </Text>
      </TouchableOpacity>
      
      <Text className="text-gray-500 text-xs text-center mt-4">
        By signing up, you agree to our Terms of Service and Privacy Policy
      </Text>
    </ScrollView>
  );
};

export default SignupButtons;