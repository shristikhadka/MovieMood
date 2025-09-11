import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { icons } from '@/constants/icons';
import { images } from '@/constants/images';
import { getFavorites, getWatchlist, removeFromFavorites, removeFromWatchlist } from '@/services/appwrite';

const Save = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'favorites'>('watchlist');
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedMovies();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadSavedMovies();
    }, [])
  );

  const loadSavedMovies = async () => {
    try {
      setLoading(true);
      const [watchlistData, favoritesData] = await Promise.all([
        getWatchlist(),
        getFavorites()
      ]);
      setWatchlist(watchlistData || []);
      setFavorites(favoritesData || []);
    } catch (error) {
      console.error('Error loading saved movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (movieId: number) => {
    try {
      await removeFromWatchlist(movieId);
      setWatchlist(prev => prev.filter(movie => movie.movieId !== movieId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const handleRemoveFromFavorites = async (movieId: number) => {
    try {
      await removeFromFavorites(movieId);
      setFavorites(prev => prev.filter(movie => movie.movieId !== movieId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const renderMovieItem = ({ item, isFavorite = false }: { item: WatchlistItem | FavoriteItem; isFavorite?: boolean }) => (
    <TouchableOpacity
      className="flex-row bg-gray-800 rounded-lg p-3 mb-3"
      onPress={() => router.push(`/movies/${item.movieId}`)}
    >
      <Image
        source={{
          uri: item.posterPath
            ? `https://image.tmdb.org/t/p/w200${item.posterPath}`
            : 'https://placehold.co/200x300/1a1a1a/FFFFFF.png',
        }}
        className="w-16 h-24 rounded-lg"
        resizeMode="cover"
      />
      
      <View className="flex-1 ml-3 justify-between">
        <View>
          <Text className="text-white font-bold text-base" numberOfLines={2}>
            {item.movieTitle}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            Added {new Date(item.addedAt).toLocaleDateString()}
          </Text>
        </View>
        
        <TouchableOpacity
          className="bg-red-600 px-3 py-1 rounded-full self-start"
          onPress={() => isFavorite 
            ? handleRemoveFromFavorites(item.movieId)
            : handleRemoveFromWatchlist(item.movieId)
          }
        >
          <Text className="text-white text-xs font-bold">
            Remove
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-primary">
        <Image
          source={images.bg}
          className="absolute w-full h-full z-0"
          resizeMode="cover"
        />
        <SafeAreaView className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-4">Loading saved movies...</Text>
        </SafeAreaView>
      </View>
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
        {/* Header */}
        <Image source={icons.logo} className="w-12 h-10 mt-20 mb-8 mx-auto" />

        {/* Tab Navigation */}
        <View className="flex-row mx-5 mb-6 bg-gray-800 rounded-lg p-1">
          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-lg ${
              activeTab === 'watchlist' ? 'bg-accent' : 'bg-transparent'
            }`}
            onPress={() => setActiveTab('watchlist')}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons 
                name="bookmark-outline" 
                size={20} 
                color={activeTab === 'watchlist' ? '#fff' : '#9ca3af'} 
              />
              <Text className={`ml-2 font-bold ${
                activeTab === 'watchlist' ? 'text-white' : 'text-gray-400'
              }`}>
                Watchlist ({watchlist.length})
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-lg ${
              activeTab === 'favorites' ? 'bg-accent' : 'bg-transparent'
            }`}
            onPress={() => setActiveTab('favorites')}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons 
                name="heart-outline" 
                size={20} 
                color={activeTab === 'favorites' ? '#fff' : '#9ca3af'} 
              />
              <Text className={`ml-2 font-bold ${
                activeTab === 'favorites' ? 'text-white' : 'text-gray-400'
              }`}>
                Favorites ({favorites.length})
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-5">
          {activeTab === 'watchlist' ? (
            watchlist.length > 0 ? (
              <FlatList
                data={watchlist}
                renderItem={renderMovieItem}
                keyExtractor={(item, index) => `${item.movieId}_${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
              />
            ) : (
              <View className="flex-1 justify-center items-center">
                <Ionicons name="bookmark-outline" size={64} color="#6b7280" />
                <Text className="text-gray-500 text-lg mt-4 text-center">
                  Your watchlist is empty
                </Text>
                <Text className="text-gray-400 text-sm mt-2 text-center">
                  Add movies to your watchlist to see them here
                </Text>
                <TouchableOpacity
                  className="bg-accent px-6 py-3 rounded-lg mt-6"
                  onPress={() => router.push('/')}
                >
                  <Text className="text-white font-bold">Browse Movies</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            favorites.length > 0 ? (
              <FlatList
                data={favorites}
                renderItem={({ item }) => renderMovieItem({ item, isFavorite: true })}
                keyExtractor={(item, index) => `${item.movieId}_${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
              />
            ) : (
              <View className="flex-1 justify-center items-center">
                <Ionicons name="heart-outline" size={64} color="#6b7280" />
                <Text className="text-gray-500 text-lg mt-4 text-center">
                  No favorite movies yet
                </Text>
                <Text className="text-gray-400 text-sm mt-2 text-center">
                  Like movies to add them to your favorites
                </Text>
                <TouchableOpacity
                  className="bg-accent px-6 py-3 rounded-lg mt-6"
                  onPress={() => router.push('/')}
                >
                  <Text className="text-white font-bold">Discover Movies</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Save;