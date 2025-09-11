import { Link } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

import { icons } from "@/constants/icons";

const TrendingMovieCard = ({
  id,
  poster_path,
  title,
  vote_average,
  release_date,
}: Movie) => {
  return (
    <Link href={`/movies/${id}`} asChild>
      <TouchableOpacity style={{ width: 120, marginRight: 16 }}>
        <Image
          source={{
            uri: poster_path
              ? `https://image.tmdb.org/t/p/w500${poster_path}`
              : "https://placehold.co/600x400/1a1a1a/FFFFFF.png",
          }}
          style={{ width: 120, height: 180, borderRadius: 8 }}
          resizeMode="cover"
        />

        <Text style={{ 
          fontSize: 12, 
          fontWeight: 'bold', 
          color: '#FFFFFF', 
          marginTop: 6,
          textAlign: 'center'
        }} numberOfLines={2}>
          {title}
        </Text>

        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: 4
        }}>
          <Image source={icons.star} style={{ width: 14, height: 14 }} />
          <Text style={{ 
            fontSize: 11, 
            color: '#FFFFFF', 
            fontWeight: 'bold',
            marginLeft: 4
          }}>
            {Math.round(vote_average / 2)}
          </Text>
        </View>

        <Text style={{ 
          fontSize: 10, 
          color: '#B0B0B0', 
          textAlign: 'center',
          marginTop: 2
        }}>
          {release_date?.split("-")[0]}
        </Text>
      </TouchableOpacity>
    </Link>
  );
};

export default TrendingMovieCard;
