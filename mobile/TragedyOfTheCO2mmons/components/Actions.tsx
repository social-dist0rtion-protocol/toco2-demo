import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  Alert,
  AsyncStorage
} from "react-native";
import { NavigationScreenProps } from "react-navigation";
import { Button, ButtonText } from "../styles";
import Touchable from "components/Touchable";
import { Updates } from "expo";

type ActionsProps = {
  id: string;
  navigation: NavigationScreenProps["navigation"];
};

export const allStoredKeys = ["server", "jwt", "id", "name", "avatar"];

export const Actions = (props: ActionsProps) => {
  const doReset = () => {
    AsyncStorage.multiRemove(allStoredKeys);
    Updates.reload();
  };

  const onResetPress = () =>
    Alert.alert(
      "Warning",
      "Really reset your data? You will lose your ID and tokens!",
      [
        {
          text: "Keep my data",
          style: "cancel"
        },
        {
          text: "Delete my data",
          onPress: doReset
        }
      ]
    );

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
          {Platform.OS == "ios" && (
            <Touchable onPress={onResetPress}>
              <View style={[styles.Button, { backgroundColor: "#c21807" }]}>
                <Text style={styles.ButtonText}>RESET</Text>
              </View>
            </Touchable>
          )}
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
