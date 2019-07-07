import React from "react";
import { StyleSheet, View, ViewStyle, Text } from "react-native";

export const TradeScreen = () => (
  <View style={styles.Wrapper}>
    <Text>trade!</Text>
  </View>
);

const styles = StyleSheet.create({
  Wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  } as ViewStyle
});

TradeScreen.navigationOptions = () => ({
  title: "Trade"
});

export default TradeScreen;
