export const TMDB_CONFIG= {
    BASE_URL:'https://api.themoviedb.org/3',
    API_KEY:process.env.EXPO_PUBLIC_MOVIE_API_KEY,
    headers:{
        accept: 'application/json',
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`
    },
};

export const fetchMovies=async({query}:{query:string})=>{
    const endpoint=query
        ?`${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
    
        :`${TMDB_CONFIG.BASE_URL}/discover/movie?sort_by=popularity.desc`;

    const response=await fetch(endpoint,{
        method:'GET',
        headers:TMDB_CONFIG.headers,
    });

    if(!response.ok){
        //@ts-ignore
        throw new Error('Failed to fetch movies',response.statusText);
    }
    const data=await response.json();

    return data.results;
}

// Fetch detailed movie information
export const fetchMovieDetails = async (movieId: number): Promise<MovieDetails> => {
    const endpoint = `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?append_to_response=credits,videos,images`;
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: TMDB_CONFIG.headers,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch movie details');
    }

    const data = await response.json();
    
    // Transform the data to match our interface
    return {
        ...data,
        cast: data.credits?.cast || [],
        crew: data.credits?.crew || [],
        videos: data.videos?.results || [],
        images: data.images || {},
    };
};

// Fetch similar movies
export const fetchSimilarMovies = async (movieId: number): Promise<Movie[]> => {
    const endpoint = `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/similar`;
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: TMDB_CONFIG.headers,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch similar movies');
    }

    const data = await response.json();
    return data.results;
};

// Fetch movie trailers
export const fetchMovieTrailers = async (movieId: number): Promise<any[]> => {
    const endpoint = `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/videos`;
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: TMDB_CONFIG.headers,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch movie trailers');
    }

    const data = await response.json();
    // Filter for trailers only
    return data.results.filter((video: any) => video.type === 'Trailer');
};

// Fetch movie credits (cast and crew)
export const fetchMovieCredits = async (movieId: number): Promise<any> => {
    const endpoint = `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/credits`;
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: TMDB_CONFIG.headers,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch movie credits');
    }

    return await response.json();
};

// Fetch movies by genre
export const fetchMoviesByGenre = async (genreId: number): Promise<Movie[]> => {
    const endpoint = `${TMDB_CONFIG.BASE_URL}/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`;
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: TMDB_CONFIG.headers,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch movies by genre');
    }

    const data = await response.json();
    return data.results;
};

// Fetch genres list
export const fetchGenres = async (): Promise<any[]> => {
    const endpoint = `${TMDB_CONFIG.BASE_URL}/genre/movie/list`;
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: TMDB_CONFIG.headers,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch genres');
    }

    const data = await response.json();
    return data.genres;
};

// Fetch movies by multiple genres (for mood-based recommendations)
export const fetchMoviesByGenres = async (genreIds: number[]): Promise<Movie[]> => {
    const genreString = genreIds.join(',');
    const endpoint = `${TMDB_CONFIG.BASE_URL}/discover/movie?with_genres=${genreString}&sort_by=popularity.desc&vote_average.gte=6.0`;
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: TMDB_CONFIG.headers,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch movies by genres');
    }

    const data = await response.json();
    return data.results;
};

// Fetch trending movies (for mood recommendations)
export const fetchTrendingMovies = async (timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> => {
    const endpoint = `${TMDB_CONFIG.BASE_URL}/trending/movie/${timeWindow}`;
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: TMDB_CONFIG.headers,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch trending movies');
    }

    const data = await response.json();
    return data.results;
};

// Fetch top rated movies (for high-quality recommendations)
export const fetchTopRatedMovies = async (): Promise<Movie[]> => {
    const endpoint = `${TMDB_CONFIG.BASE_URL}/movie/top_rated`;
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: TMDB_CONFIG.headers,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch top rated movies');
    }

    const data = await response.json();
    return data.results;
};

