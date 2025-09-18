import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";

import { fetchMovies, fetchTrendingMovies } from "@/services/api";
import useFetch from "@/services/useFetch";

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

import MoodMatcher from "@/components/MoodMatcher";
import MoodRecommendations from "@/components/MoodRecommendations";
import MovieCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";
import TrendingMovieCard from "@/components/TrendingMovieCard";
import { MoodAnalysis } from "@/services/aiService";

// Import Movie type from interfaces
declare global {
  interface Movie {
    id: number;
    title: string;
    adult: boolean;
    backdrop_path: string;
    genre_ids: number[];
    original_language: string;
    original_title: string;
    overview: string;
    popularity: number;
    poster_path: string;
    release_date: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
  }
}

const Index = () => {
  const router = useRouter();
  
  // Mood-based recommendations state
  const [moodRecommendations, setMoodRecommendations] = useState<{
    movies: Movie[];
    moodAnalysis: MoodAnalysis;
    contextInfo: {
      weather: string | null;
      time: string;
      season: string;
    };
  } | null>(null);

  const {
    data: trendingMovies,
    loading: trendingLoading,
    error: trendingError,
  } = useFetch(fetchTrendingMovies);

  const {
    data: movies,
    loading: moviesLoading,
    error: moviesError,
  } = useFetch(() => fetchMovies({ query: "" }));

  const handleMoodRecommendations = (movies: Movie[], moodAnalysis: MoodAnalysis, contextInfo: {
    weather: string | null;
    time: string;
    season: string;
  }) => {
    setMoodRecommendations({ movies, moodAnalysis, contextInfo });
  };

  const handleResetMood = () => {
    setMoodRecommendations(null);
  };

  const handleMoviePress = (movie: Movie) => {
    router.push(`/movies/${movie.id}`);
  };

  return (
    <View className="flex-1 bg-primary">
      <Image
        source={images.bg}
        className="absolute w-full z-0"
        resizeMode="cover"
      />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 10 }}
      >
        <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />

        {moviesLoading || trendingLoading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            className="mt-10 self-center"
          />
        ) : moviesError || trendingError ? (
          <Text>Error: {moviesError?.message || trendingError?.message}</Text>
        ) : (
          <View className="flex-1 mt-5">
            <SearchBar
              onPress={() => {
                router.push("/search");
              }}
              placeholder="Search for a movie"
            />

            {/* Mood Matcher Section */}
            {!moodRecommendations ? (
              <MoodMatcher onRecommendations={handleMoodRecommendations} />
            ) : (
              <MoodRecommendations
                movies={moodRecommendations.movies}
                moodAnalysis={moodRecommendations.moodAnalysis}
                contextInfo={moodRecommendations.contextInfo}
                onMoviePress={handleMoviePress}
                onReset={handleResetMood}
              />
            )}

            {trendingMovies && Array.isArray(trendingMovies) && trendingMovies.length > 0 && (
              <View className="mt-10">
                <Text className="text-lg text-white font-bold mb-3">
                  Trending Movies
                </Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4 mt-3"
                  data={trendingMovies}
                  contentContainerStyle={{
                    gap: 26,
                  }}
                  renderItem={({ item }) => (
                    <TrendingMovieCard {...item} />
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  ItemSeparatorComponent={() => <View className="w-4" />}
                />
              </View>
            )}

            <>
              <Text className="text-lg text-white font-bold mt-5 mb-3">
                Latest Movies
              </Text>

              <FlatList
                data={movies || []}
                renderItem={({ item }) => <MovieCard {...item} />}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                columnWrapperStyle={{
                  justifyContent: "space-between",
                  paddingHorizontal: 2,
                  marginBottom: 6,
                }}
                className="mt-2 pb-32"
                scrollEnabled={false}
              />
            </>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Index;
