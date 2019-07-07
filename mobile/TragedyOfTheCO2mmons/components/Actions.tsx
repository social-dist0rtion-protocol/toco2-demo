import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableNativeFeedback } from "react-native";
import { NavigationScreenProps } from "react-navigation";
import { Button, ButtonText } from "../styles";

type ActionsProps = {
  navigation: NavigationScreenProps["navigation"];
};

export const Actions = (props: ActionsProps) => {
  return (
    <View style={styles.Wrapper}>
      <View style={styles.Buttons}>
        <View style={styles.ButtonWrapper}>
          <TouchableNativeFeedback
            style={styles.Button}
            onPress={() => props.navigation.navigate("Trade")}
          >
            <Text style={styles.ButtonText}>TRADE</Text>
          </TouchableNativeFeedback>
        </View>
        <View style={styles.ButtonWrapper}>
          <TouchableNativeFeedback
            style={styles.Button}
            onPress={() => props.navigation.navigate("Plant")}
          >
            <Text style={styles.ButtonText}>PLANT TREES</Text>
          </TouchableNativeFeedback>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  Wrapper: {
    flex: 1,
    alignSelf: "stretch"
  },
  Buttons: {
    flex: 1
  },
  ButtonWrapper: {
    alignItems: "center"
  },
  Button: {
    backgroundColor: "red",
    width: 150,
    height: 40,
    justifyContent: "center",
    alignItems: "center"
  },
  ButtonText
});

export default React.memo(Actions);
