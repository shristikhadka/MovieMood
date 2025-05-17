import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MovieDetails = () => {
  return (
    <View style={styles.container}>
      <Text>Component content goes here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MovieDetails;