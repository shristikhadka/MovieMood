import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import { getCurrentUser, logout, changePassword, AuthUser } from '@/services/auth';
import { getWatchlist, getFavorites } from '@/services/appwrite';
import { Ionicons } from '@expo/vector-icons';
import { images } from '@/constants/images';
import { icons } from '@/constants/icons';

const Profile = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [currentUser, watchlist, favorites] = await Promise.all([
        getCurrentUser(),
        getWatchlist(),
        getFavorites()
      ]);
      
      setUser(currentUser);
      setWatchlistCount(watchlist.length);
      setFavoritesCount(favorites.length);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Force reload the user state
              setUser(null);
              // Navigate to login
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="bg-primary flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-4">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-primary">
      <Image
        source={images.bg}
        className="absolute w-full h-full z-0"
        resizeMode="cover"
      />
      
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Header */}
          <Image source={icons.logo} className="w-12 h-10 mt-20 mb-8 mx-auto" />

        {/* Profile Card */}
        <View className="mx-6 bg-gray-800 rounded-2xl p-6 mb-6">
          <View className="items-center">
            <View className="bg-accent rounded-full p-4 mb-4">
              <Ionicons name="person" size={48} color="white" />
            </View>
            
            {user && (
              <View className="items-center">
                <Text className="text-white text-2xl font-bold mb-1">{user.name}</Text>
                <Text className="text-gray-400 text-base mb-4">{user.email}</Text>
                <Text className="text-gray-500 text-sm">
                  Member since {new Date(user.$createdAt || Date.now()).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View className="mx-6 mb-6">
          <Text className="text-white text-lg font-bold mb-4">Your Stats</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity 
              className="bg-gray-800 rounded-xl p-4 flex-1 mr-3"
              onPress={() => router.push('/saved')}
            >
              <View className="items-center">
                <Ionicons name="bookmark" size={24} color="#3b82f6" />
                <Text className="text-white text-xl font-bold mt-2">{watchlistCount}</Text>
                <Text className="text-gray-400 text-sm">Watchlist</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-gray-800 rounded-xl p-4 flex-1 ml-3"
              onPress={() => router.push('/saved')}
            >
              <View className="items-center">
                <Ionicons name="heart" size={24} color="#ef4444" />
                <Text className="text-white text-xl font-bold mt-2">{favoritesCount}</Text>
                <Text className="text-gray-400 text-sm">Favorites</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

          {/* Account Settings */}
          <View className="mb-6">
            <Text className="text-white text-lg font-bold mb-4">Account</Text>
            
            <TouchableOpacity 
              className="bg-gray-800 rounded-xl p-4 mb-6 flex-row items-center justify-between"
              onPress={() => setShowPasswordModal(true)}
            >
              <View className="flex-row items-center">
                <Ionicons name="lock-closed-outline" size={24} color="white" />
                <Text className="text-white text-base ml-3">Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <View className="mb-8">
            <TouchableOpacity
              className="bg-red-600 p-4 rounded-xl flex-row items-center justify-center"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Change Password Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showPasswordModal}
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-gray-800 rounded-2xl p-6 mx-6 w-5/6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Change Password</Text>
                <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <TextInput
                className="bg-secondary p-4 rounded-xl text-white mb-4"
                placeholder="Current Password"
                placeholderTextColor="#666"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={true}
              />

              <TextInput
                className="bg-secondary p-4 rounded-xl text-white mb-4"
                placeholder="New Password (min 6 characters)"
                placeholderTextColor="#666"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={true}
              />

              <TextInput
                className="bg-secondary p-4 rounded-xl text-white mb-6"
                placeholder="Confirm New Password"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
              />

              <TouchableOpacity
                className={`p-4 rounded-xl ${passwordLoading ? 'bg-gray-600' : 'bg-accent'}`}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    Change Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

export default Profile;