import { Client, Databases, ID, Query } from "react-native-appwrite";
import { getCurrentUser } from "./auth";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!;
const WATCHLIST_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_WATCHLIST_COLLECTION_ID!;
const FAVORITES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID!;

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const database = new Databases(client);

export const updateSearchCount = async (query: string, movie: Movie) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("searchTerm", query),
    ]);

    if (result.documents.length > 0) {
      const existingMovie = result.documents[0];
      await database.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        existingMovie.$id,
        {
          count: existingMovie.count + 1,
        }
      );
    } else {
      await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm: query,
        movie_id: movie.id,
        title: movie.title,
        count: 1,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error("Error updating search count:", error);
    throw error;
  }
};

export const getTrendingMovies = async (): Promise<
  TrendingMovie[] | undefined
> => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(5),
      Query.orderDesc("count"),
    ]);

    return result.documents as unknown as TrendingMovie[];
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

// Watchlist Functions
export const addToWatchlist = async (movie: Movie) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    await database.createDocument(
      DATABASE_ID,
      WATCHLIST_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        movieId: movie.id,
        movieTitle: movie.title,
        posterPath: movie.poster_path,
        addedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    throw error;
  }
};

export const getWatchlist = async (): Promise<WatchlistItem[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const result = await database.listDocuments(
      DATABASE_ID,
      WATCHLIST_COLLECTION_ID,
      [Query.equal("userId", user.$id), Query.orderDesc("addedAt")]
    );
    return result.documents as unknown as WatchlistItem[];
  } catch (error) {
    console.error("Error getting watchlist:", error);
    return [];
  }
};

export const removeFromWatchlist = async (movieId: number) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const result = await database.listDocuments(
      DATABASE_ID,
      WATCHLIST_COLLECTION_ID,
      [Query.equal("userId", user.$id), Query.equal("movieId", movieId)]
    );
    
    if (result.documents.length > 0) {
      await database.deleteDocument(
        DATABASE_ID,
        WATCHLIST_COLLECTION_ID,
        result.documents[0].$id
      );
    }
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw error;
  }
};

export const isInWatchlist = async (movieId: number): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const result = await database.listDocuments(
      DATABASE_ID,
      WATCHLIST_COLLECTION_ID,
      [Query.equal("userId", user.$id), Query.equal("movieId", movieId)]
    );
    return result.documents.length > 0;
  } catch (error) {
    console.error("Error checking watchlist:", error);
    return false;
  }
};

// Favorites Functions
export const addToFavorites = async (movie: Movie) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    await database.createDocument(
      DATABASE_ID,
      FAVORITES_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        movieId: movie.id,
        movieTitle: movie.title,
        posterPath: movie.poster_path,
        addedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error("Error adding to favorites:", error);
    throw error;
  }
};

export const getFavorites = async (): Promise<FavoriteItem[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const result = await database.listDocuments(
      DATABASE_ID,
      FAVORITES_COLLECTION_ID,
      [Query.equal("userId", user.$id), Query.orderDesc("addedAt")]
    );
    return result.documents as unknown as FavoriteItem[];
  } catch (error) {
    console.error("Error getting favorites:", error);
    return [];
  }
};

export const removeFromFavorites = async (movieId: number) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const result = await database.listDocuments(
      DATABASE_ID,
      FAVORITES_COLLECTION_ID,
      [Query.equal("userId", user.$id), Query.equal("movieId", movieId)]
    );
    
    if (result.documents.length > 0) {
      await database.deleteDocument(
        DATABASE_ID,
        FAVORITES_COLLECTION_ID,
        result.documents[0].$id
      );
    }
  } catch (error) {
    console.error("Error removing from favorites:", error);
    throw error;
  }
};

export const isInFavorites = async (movieId: number): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const result = await database.listDocuments(
      DATABASE_ID,
      FAVORITES_COLLECTION_ID,
      [Query.equal("userId", user.$id), Query.equal("movieId", movieId)]
    );
    return result.documents.length > 0;
  } catch (error) {
    console.error("Error checking favorites:", error);
    return false;
  }
};