import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { icons } from '@/constants/icons';
import { fetchMovieDetails, fetchSimilarMovies, fetchMovieTrailers } from '@/services/api';
import { addToFavorites, removeFromFavorites, addToWatchlist, removeFromWatchlist, isInWatchlist, isInFavorites } from '@/services/appwrite';

const { width, height } = Dimensions.get('window');

const MovieDetails = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [trailers, setTrailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMovieInWatchlist, setIsMovieInWatchlist] = useState(false);
  const [isMovieInFavorites, setIsMovieInFavorites] = useState(false);

  useEffect(() => {
    loadMovieData();
    checkSavedStatus();
  }, [id]);

  const checkSavedStatus = async () => {
    if (!id) return;
    
    try {
      const [watchlistStatus, favoritesStatus] = await Promise.all([
        isInWatchlist(Number(id)),
        isInFavorites(Number(id))
      ]);
      
      setIsMovieInWatchlist(watchlistStatus);
      setIsMovieInFavorites(favoritesStatus);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const loadMovieData = async () => {
    try {
      setLoading(true);
      const [details, similar, movieTrailers] = await Promise.all([
        fetchMovieDetails(Number(id)),
        fetchSimilarMovies(Number(id)),
        fetchMovieTrailers(Number(id))
      ]);
      
      setMovieDetails(details);
      setSimilarMovies(similar.slice(0, 10));
      setTrailers(movieTrailers.slice(0, 3));
    } catch (err) {
      setError('Failed to load movie details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!movieDetails) return;
    
    try {
      await Share.share({
        message: `Check out "${movieDetails.title}" on MovieMood!`,
        url: `https://www.themoviedb.org/movie/${movieDetails.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleWatchTrailer = (trailerKey: string) => {
    const url = `https://www.youtube.com/watch?v=${trailerKey}`;
    Linking.openURL(url);
  };

  const toggleFavorite = async () => {
    if (!movieDetails) return;
    
    try {
      if (isMovieInFavorites) {
        await removeFromFavorites(movieDetails.id);
        setIsMovieInFavorites(false);
      } else {
        // Check if already in favorites before adding
        const alreadyInFavorites = await isInFavorites(movieDetails.id);
        if (!alreadyInFavorites) {
          await addToFavorites({
            id: movieDetails.id,
            title: movieDetails.title,
            poster_path: movieDetails.poster_path || '',
            vote_average: movieDetails.vote_average,
            release_date: movieDetails.release_date,
            adult: movieDetails.adult,
            backdrop_path: movieDetails.backdrop_path || '',
            genre_ids: movieDetails.genres?.map(g => g.id) || [],
            original_language: movieDetails.original_language,
            original_title: movieDetails.original_title,
            overview: movieDetails.overview || '',
            popularity: movieDetails.popularity,
            video: movieDetails.video,
            vote_count: movieDetails.vote_count,
          });
          setIsMovieInFavorites(true);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const toggleWatchlist = async () => {
    if (!movieDetails) return;
    
    try {
      if (isMovieInWatchlist) {
        await removeFromWatchlist(movieDetails.id);
        setIsMovieInWatchlist(false);
      } else {
        // Check if already in watchlist before adding
        const alreadyInWatchlist = await isInWatchlist(movieDetails.id);
        if (!alreadyInWatchlist) {
          await addToWatchlist({
            id: movieDetails.id,
            title: movieDetails.title,
            poster_path: movieDetails.poster_path || '',
            vote_average: movieDetails.vote_average,
            release_date: movieDetails.release_date,
            adult: movieDetails.adult,
            backdrop_path: movieDetails.backdrop_path || '',
            genre_ids: movieDetails.genres?.map(g => g.id) || [],
            original_language: movieDetails.original_language,
            original_title: movieDetails.original_title,
            overview: movieDetails.overview || '',
            popularity: movieDetails.popularity,
            video: movieDetails.video,
            vote_count: movieDetails.vote_count,
          });
          setIsMovieInWatchlist(true);
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-4">Loading movie details...</Text>
      </View>
    );
  }

  if (error || !movieDetails) {
    return (
      <View className="flex-1 bg-primary justify-center items-center px-5">
        <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
        <Text className="text-white text-lg mt-4 text-center">{error || 'Movie not found'}</Text>
        <TouchableOpacity 
          className="bg-accent px-6 py-3 rounded-lg mt-4"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-primary">
      {/* Hero Section */}
      <View className="relative">
        <Image
          source={{
            uri: movieDetails.backdrop_path
              ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}`
              : 'https://placehold.co/600x400/1a1a1a/FFFFFF.png',
          }}
          className="w-full h-96"
          resizeMode="cover"
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
          className="absolute bottom-0 w-full h-32"
        />
        
        {/* Back Button */}
        <TouchableOpacity
          className="absolute top-12 left-4 bg-black/50 rounded-full p-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View className="absolute top-12 right-4 flex-row gap-2">
          <TouchableOpacity
            className="bg-black/50 rounded-full p-2"
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-black/50 rounded-full p-2"
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isMovieInFavorites ? "heart" : "heart-outline"} 
              size={24} 
              color={isMovieInFavorites ? "#ff6b6b" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Movie Info */}
      <View className="px-5 -mt-20 relative z-10">
        <View className="flex-row gap-4">
          <Image
            source={{
              uri: movieDetails.poster_path
                ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
                : 'https://placehold.co/600x400/1a1a1a/FFFFFF.png',
            }}
            className="w-32 h-48 rounded-lg"
            resizeMode="cover"
          />
          
          <View className="flex-1 justify-between">
            <View>
              <Text className="text-2xl font-bold text-white mb-2">
                {movieDetails.title}
              </Text>
              <Text className="text-gray-300 mb-2">
                {movieDetails.release_date?.split('-')[0]} • {movieDetails.runtime}min
              </Text>
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="star" size={16} color="#ffd700" />
                <Text className="text-white font-semibold">
                  {movieDetails.vote_average.toFixed(1)}
                </Text>
                <Text className="text-gray-400">
                  ({movieDetails.vote_count.toLocaleString()} votes)
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              className="bg-accent py-3 px-6 rounded-lg flex-row items-center justify-center gap-2"
              onPress={toggleWatchlist}
            >
              <Ionicons 
                name={isMovieInWatchlist ? "checkmark" : "add"} 
                size={20} 
                color="#fff" 
              />
              <Text className="text-white font-bold">
                {isMovieInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Genres */}
        {movieDetails.genres && (
          <View className="flex-row flex-wrap gap-2 mt-4">
            {movieDetails.genres.map((genre) => (
              <View key={genre.id} className="bg-gray-800 px-3 py-1 rounded-full">
                <Text className="text-white text-sm">{genre.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Overview */}
        <View className="mt-6">
          <Text className="text-xl font-bold text-white mb-3">Overview</Text>
          <Text className="text-gray-300 leading-6">
            {movieDetails.overview || 'No overview available.'}
          </Text>
        </View>

        {/* Trailers */}
        {trailers.length > 0 && (
          <View className="mt-6">
            <Text className="text-xl font-bold text-white mb-3">Trailers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {trailers.map((trailer) => (
                <TouchableOpacity
                  key={trailer.key}
                  className="mr-4"
                  onPress={() => handleWatchTrailer(trailer.key)}
                >
                  <View className="w-64 h-36 bg-gray-800 rounded-lg justify-center items-center">
                    <Ionicons name="play-circle" size={48} color="#fff" />
                    <Text className="text-white text-center mt-2 px-2">
                      {trailer.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Cast */}
        {movieDetails.cast && movieDetails.cast.length > 0 && (
          <View className="mt-6">
            <Text className="text-xl font-bold text-white mb-3">Cast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {movieDetails.cast.slice(0, 10).map((actor) => (
                <View key={actor.id} className="mr-4 items-center">
                  <Image
                    source={{
                      uri: actor.profile_path
                        ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                        : 'https://placehold.co/200x300/1a1a1a/FFFFFF.png',
                    }}
                    className="w-16 h-16 rounded-full"
                    resizeMode="cover"
                  />
                  <Text className="text-white text-sm mt-2 text-center w-16">
                    {actor.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Similar Movies */}
        {similarMovies.length > 0 && (
          <View className="mt-6 mb-8">
            <Text className="text-xl font-bold text-white mb-3">Similar Movies</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {similarMovies.map((movie) => (
                <TouchableOpacity
                  key={movie.id}
                  className="mr-4"
                  onPress={() => router.push(`/movies/${movie.id}`)}
                >
                  <Image
                    source={{
                      uri: movie.poster_path
                        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                        : 'https://placehold.co/200x300/1a1a1a/FFFFFF.png',
                    }}
                    className="w-32 h-48 rounded-lg"
                    resizeMode="cover"
                  />
                  <Text className="text-white text-sm mt-2 w-32" numberOfLines={2}>
                    {movie.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default MovieDetails;