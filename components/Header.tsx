import React from 'react';
import { View, Text, Image } from 'react-native';
import { icons } from '@/constants/icons';

interface HeaderProps {
  title?: string;
  showTitle?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showTitle = false }) => {
  return (
    <View className="items-center mt-20 mb-8">
      <Image source={icons.logo} className="w-12 h-10 mb-2" />
      {showTitle && title && (
        <Text className="text-white text-xl font-bold">{title}</Text>
      )}
    </View>
  );
};

export default Header;