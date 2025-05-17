
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { ScrollView, Text, View } from "react-native";
import { Image } from 'react-native';
import { SearchBar } from "react-native-screens";

export default function Index() {
  return (

   <View className="flex-1 bg-primary">
      <Image source={images.bg} className="absolute w-full z-0"/>
        <ScrollView className="flex-1 px-5"
        showsVerticalScrollIndicator={false} contentContainerStyle={{minHeight:"100%",paddingBottom:10}}
        >
          <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto"/>
        </ScrollView>

        <View className="flex-1 mt-5">
          <SearchBar/>
        </View>

   </View>
  );
}
