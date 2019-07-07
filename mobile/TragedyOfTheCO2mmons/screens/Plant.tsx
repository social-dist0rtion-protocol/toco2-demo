import React from "react";
import { StyleSheet, View, ViewStyle, Text } from "react-native";

export const PlantScreen = () => (
  <View style={styles.Wrapper}>
    <Text>Plant some trees!</Text>
  </View>
);

const styles = StyleSheet.create({
  Wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  } as ViewStyle
});

PlantScreen.navigationOptions = () => ({
  title: "Plant trees"
});

export default PlantScreen;
