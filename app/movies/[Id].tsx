import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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