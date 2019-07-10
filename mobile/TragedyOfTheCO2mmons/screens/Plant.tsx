import React, { useState } from "react";
import { StyleSheet, View, Text, TextInput } from "react-native";
import { Button, ButtonText, Label, TextInputStyle } from "../styles";
import { plantTrees } from "../api";
import Overlay from "components/Overlay";
import Touchable from "components/Touchable";
import { showAlert } from "components/Alert";

export const PlantScreen = () => {
  const [trees, setTrees] = useState(10);
  const [overlayVisible, setOverlayVisible] = useState(false);

  const doPlant = async () => {
    setOverlayVisible(true);
    try {
      const response = await plantTrees(trees);
      setOverlayVisible(false);
      if (response.success) {
        showAlert(
          `${trees} tree${
            trees === 1 ? "" : "s"
          } planted! 🌳\nYour new whatevzDAI balance: ${response.balance}`
        );
      } else {
        showAlert(`Couldn't plant 😔 ${response.error}`);
      }
    } catch (e) {
      setOverlayVisible(false);
      showAlert(`Something went wrong 🤦‍♂️ ${e}`);
    }
  };

  return (
    <View style={styles.Wrapper}>
      <Text>
        Ideally here we'd have the cost of planting a tree, and how much CO₂ it
        will sequester from the atmosphere
      </Text>
      <Text style={styles.Label}>Tree count</Text>
      <TextInput
        style={styles.TextInputStyle}
        keyboardType="number-pad"
        onChangeText={text => setTrees(parseInt(text, 10) || 0)}
        value={trees.toString()}
        maxLength={4}
      />
      <View style={styles.ButtonWrapper}>
        <Touchable onPress={doPlant}>
          <View style={styles.Button}>
            <Text style={styles.ButtonText}>PLANT TREES</Text>
          </View>
        </Touchable>
      </View>
      <Overlay show={overlayVisible} />
    </View>
  );
};

const styles = StyleSheet.create({
  Wrapper: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00a572"
  },
  ButtonWrapper: {
    alignItems: "center",
    marginTop: 16
  },
  Button: {
    ...Button,
    backgroundColor: "#50c878"
  },
  TextInputStyle: {
    ...TextInputStyle,
    minWidth: 80
  },
  ButtonText,
  Label
});

PlantScreen.navigationOptions = () => ({
  title: "Plant trees"
});

export default PlantScreen;
