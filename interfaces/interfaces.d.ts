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

interface TrendingMovie {
  searchTerm: string;
  movie_id: number;
  title: string;
  count: number;
  poster_url: string;
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

interface MovieImage {
  file_path: string;
  aspect_ratio: number;
  height: number;
  width: number;
  iso_639_1: string | null;
  vote_average: number;
  vote_count: number;
}

interface MovieImages {
  backdrops: MovieImage[];
  posters: MovieImage[];
  logos: MovieImage[];
}

interface MovieDetails {
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string;
    backdrop_path: string;
  } | null;
  budget: number;
  genres: {
    id: number;
    name: string;
  }[];
  homepage: string | null;
  id: number;
  imdb_id: string | null;
  original_language: string;
  original_title: string;
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  production_companies: {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }[];
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  release_date: string;
  revenue: number;
  runtime: number | null;
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  // Additional fields from API
  cast?: CastMember[];
  crew?: CrewMember[];
  videos?: Video[];
  images?: MovieImages;
}

interface TrendingCardProps {
  movie: TrendingMovie;
  index: number;
}

interface Genre {
  id: number;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  preferences?: {
    favoriteGenres: number[];
    notifications: boolean;
  };
}

interface WatchlistItem {
  id: string;
  userId: string;
  movieId: number;
  movieTitle: string;
  posterPath: string;
  addedAt: string;
}

interface FavoriteItem {
  id: string;
  userId: string;
  movieId: number;
  movieTitle: string;
  posterPath: string;
  addedAt: string;
}
