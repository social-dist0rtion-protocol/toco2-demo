import React, { useState, useEffect } from "react";
import { AsyncStorage, Text, View, StyleSheet } from "react-native";

const HomeScreen = ({ navigation }) => {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("jwt")
      .then(value => setLoggedIn(value == "true"))
      .catch(_ => setLoggedIn(false));
  }, []);

  return (
    <View style={styles.Wrapper}>
      <Text>{loggedIn ? "Welcome back!" : "Sign up!"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  Wrapper: {
    flex: 1
  }
});

HomeScreen.navigationOptions = ({ navigation }) => ({
  title: "Tragedy of the CO₂mmons"
});

export default HomeScreen;
