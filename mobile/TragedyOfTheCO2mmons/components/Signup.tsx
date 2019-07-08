import { Notifications } from "expo";
import * as Permissions from "expo-permissions";
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator
} from "react-native";
import { material, materialColors } from "react-native-typography";
import { server, login, getRandomAvatar } from "../api";
import { TouchableNativeFeedback } from "react-native-gesture-handler";
import { Button, ButtonText, TextInputStyle, Label, Overlay } from "../styles";

type SignupProps = {
  onLoginSuccess: (
    jwt: string,
    id: string,
    name: string,
    avatar: string
  ) => void;
};

const Signup = (props: SignupProps) => {
  const [name, setName] = useState("");
  const [backend, setBackend] = useState(server);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    getRandomAvatar().then(response => setAvatar(response.message));
  }, []);

  const onLoginPress = async () => {
    if (!name.trim().length) return;

    let status: string;
    setLoading(true);

    try {
      status = (await Permissions.getAsync(Permissions.NOTIFICATIONS)).status;
    } catch (error) {
      status = "unknown";
    }

    let finalStatus = status;

    // only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (status !== "granted") {
      // Android remote notification permissions are granted during the app
      // install, so this will only ask on iOS
      try {
        status = (await Permissions.askAsync(Permissions.NOTIFICATIONS)).status;
      } catch (error) {
        alert(`Couldn't enable push notifications: ${error}`);
        status = "error";
      }
      finalStatus = status;
    }

    // stop here if the user did not grant permissions
    if (finalStatus !== "granted") {
      setLoading(false);
      return;
    }

    // get the token that uniquely identifies this device
    let token: string;
    try {
      token = await Notifications.getExpoPushTokenAsync();
    } catch (error) {
      alert(
        `Couldn't get a token, push notifications will be disabled.\n${error}`
      );
      token = `fake-token-${Date.now()}`;
    }

    const response = await login(token, name, avatar);
    setLoading(false);
    props.onLoginSuccess(response.auth, response.id, name, avatar);
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
          onEndEditing={onLoginPress}
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
  Overlay,
  Label,
  Button,
  ButtonText,
  TextInputStyle
});

export default React.memo(Signup);
