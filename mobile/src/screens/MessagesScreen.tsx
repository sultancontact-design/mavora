/**
 * MessagesScreen - Placeholder Screen
 * @module screens/MessagesScreen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MessagesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>MessagesScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  text: {
    fontSize: 18,
    color: '#374151',
    fontFamily: 'Cairo',
  },
});

export default MessagesScreen;
