import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { NavigationScreenProps } from "react-navigation";
import { Button, ButtonText } from "../styles";
import Touchable from "components/Touchable";

type ActionsProps = {
  id: string;
  navigation: NavigationScreenProps["navigation"];
};

export const Actions = (props: ActionsProps) => {
  return (
    <View>
      <View style={styles.Buttons}>
        <View style={styles.ButtonWrapper}>
          <Touchable
            onPress={() => props.navigation.navigate("Trade", { id: props.id })}
          >
            <View style={styles.Button}>
              <Text style={styles.ButtonText}>TRADE</Text>
            </View>
          </Touchable>
          <Touchable onPress={() => props.navigation.navigate("Plant")}>
            <View style={styles.Button}>
              <Text style={styles.ButtonText}>PLANT TREES</Text>
            </View>
          </Touchable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  Buttons: {
    marginTop: 30
  },
  ButtonWrapper: {
    alignItems: "center"
  },
  Button,
  ButtonText
});

export default React.memo(Actions);
