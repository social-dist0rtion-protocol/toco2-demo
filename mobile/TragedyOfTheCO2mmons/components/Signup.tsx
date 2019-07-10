import { Notifications } from "expo";
import * as Permissions from "expo-permissions";
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  AsyncStorage,
  Alert
} from "react-native";
import { material, materialColors } from "react-native-typography";
import { defaultServer, login, getRandomAvatar, setServer } from "../api";
import { Button, ButtonText, TextInputStyle, Label } from "../styles";
import Overlay from "components/Overlay";
import Touchable from "components/Touchable";

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
  const [backend, setBackend] = useState(defaultServer);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    getRandomAvatar().then(response => setAvatar(response.message));
  }, []);

  const onLoginPress = async () => {
    if (!name.trim().length || !backend.trim().length) return;

    let status: string;
    setServer(backend);
    AsyncStorage.setItem("server", backend);
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
        Alert.alert(`Couldn't enable push notifications: ${error}`);
        status = "error";
      }
      finalStatus = status;
    }

    let token: string;

    // stop here if the user did not grant permissions
    if (finalStatus === "granted") {
      // get the token that uniquely identifies this device
      try {
        token = await Notifications.getExpoPushTokenAsync();
      } catch (error) {
        Alert.alert(
          `Couldn't get a token, push notifications will be disabled.\n${error}`
        );
        token = `fake-token-${Date.now()}`;
      }
    } else {
      token = `fake-token-${Date.now()}`;
    }

    try {
      const response = await login(token, name, avatar);
      setLoading(false);
      props.onLoginSuccess(response.auth, response.id, name, avatar);
    } catch (error) {
      setLoading(false);
      Alert.alert(`Something's wrong: ${error} 🤷`);
    }
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
          <Touchable style={styles.Button} onPress={onLoginPress}>
            <Text style={styles.ButtonText}>LOGIN</Text>
          </Touchable>
        </View>
      </View>
      <Overlay show={loading} />
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
  Label,
  Button,
  ButtonText,
  TextInputStyle
});

export default React.memo(Signup);
