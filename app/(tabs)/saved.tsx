import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Saved = () => {
  return (
    <View style={styles.container}>
      <Text>Saved</Text>
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

export default Saved;