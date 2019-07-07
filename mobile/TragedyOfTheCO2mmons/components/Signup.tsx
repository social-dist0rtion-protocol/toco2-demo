import { Notifications } from "expo";
import * as Permissions from "expo-permissions";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator
} from "react-native";
import { material, materialColors } from "react-native-typography";
import { server, login } from "../api";
import { TouchableNativeFeedback } from "react-native-gesture-handler";
import { Button, ButtonText, TextInputStyle, Label } from "../styles";

type SignupProps = {
  onLoginSuccess: (jwt: string, id: string, name: string) => void;
};

const Signup = (props: SignupProps) => {
  const [name, setName] = useState("");
  const [backend, setBackend] = useState(server);
  const [loading, setLoading] = useState(false);

  const onLoginPress = async () => {
    if (!name.trim().length) return;
    setLoading(true);
    const { status: existingStatus } = await Permissions.getAsync(
      Permissions.NOTIFICATIONS
    );
    let finalStatus = existingStatus;

    // only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== "granted") {
      // Android remote notification permissions are granted during the app
      // install, so this will only ask on iOS
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      finalStatus = status;
    }

    // Stop here if the user did not grant permissions
    if (finalStatus !== "granted") {
      setLoading(false);
      return;
    }

    // Get the token that uniquely identifies this device
    const token = await Notifications.getExpoPushTokenAsync();

    const response = await login(token, name, "placeholder");
    setLoading(false);
    props.onLoginSuccess(response.auth, response.id, name);
  };

  return (
    <View style={styles.Wrapper}>
      <Text style={styles.Title}>Login</Text>
      <View style={styles.Form}>
        <Text style={styles.Label}>Name</Text>
        <TextInput
          style={styles.TextInputStyle}
          onChangeText={text => setName(text)}
          value={name}
          placeholder="Your public name"
          placeholderTextColor={materialColors.whiteTertiary}
        />
        <Text style={styles.Label}>Server</Text>
        <TextInput
          style={styles.TextInputStyle}
          onChangeText={text => setBackend(text)}
          value={backend}
          placeholder="URL to connect to"
          placeholderTextColor={materialColors.whiteTertiary}
        />
        <View style={styles.ButtonWrapper}>
          <TouchableNativeFeedback style={styles.Button} onPress={onLoginPress}>
            <Text style={styles.ButtonText}>LOGIN</Text>
          </TouchableNativeFeedback>
        </View>
      </View>
      {loading && (
        <View style={styles.Overlay}>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  Wrapper: {
    flex: 1,
    alignSelf: "stretch",
    backgroundColor: "#043927",
    padding: 16
  },
  Title: {
    ...material.headlineObject,
    color: materialColors.whitePrimary,
    textAlign: "center"
  },
  Form: {
    flex: 1
  },
  ButtonWrapper: {
    marginTop: 16,
    alignItems: "center"
  },
  Overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingTop: 250,
    backgroundColor: "rgba(0, 0, 0, 0.8)"
  },
  Label,
  Button,
  ButtonText,
  TextInputStyle
});

export default React.memo(Signup);
