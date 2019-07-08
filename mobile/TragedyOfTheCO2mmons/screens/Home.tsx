import React, { useState, useEffect } from "react";
import { AsyncStorage, Text, View, StyleSheet } from "react-native";
import Signup from "../components/Signup";
import { setJwt } from "../api";
import Status from "../components/Status";
import Actions from "../components/Actions";
import Overlay from "../components/Overlay";
import { NavigationScreenProp } from "react-navigation";

const HomeScreen = ({
  navigation
}: {
  navigation: NavigationScreenProp<any>;
}) => {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    AsyncStorage.multiGet(["jwt", "id", "name", "avatar"])
      .then(values => {
        values.forEach(keyValue => {
          const [key, value] = keyValue;
          if (value) {
            switch (key) {
              case "jwt":
                setLoggedIn(true);
                setJwt(value);
                break;
              case "id":
                setId(value);
                break;
              case "name":
                setName(value);
                break;
              case "avatar":
                setAvatar(value);
                break;
            }
          }
        });
        setReady(true);
      })
      .catch(_ => {
        setLoggedIn(false);
        setReady(true);
      });
  }, []);

  const onLoginSuccess = (
    jwt: string,
    id: string,
    name: string,
    avatar: string
  ) => {
    setJwt(jwt);
    setName(name);
    setId(id);
    setAvatar(avatar);
    AsyncStorage.multiSet([
      ["jwt", jwt],
      ["id", id],
      ["name", name],
      ["avatar", avatar]
    ]);
    setLoggedIn(true);
  };

  if (!ready) return <Overlay show={true} />;

  return (
    <View style={styles.Wrapper}>
      {loggedIn ? (
        <View>
          <Status id={id} name={name} avatar={avatar} navigation={navigation} />
          <Actions id={id} navigation={navigation} />
        </View>
      ) : (
        <Signup onLoginSuccess={onLoginSuccess} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  Wrapper: {
    flex: 1,
    backgroundColor: "#01796f",
    alignItems: "center"
  }
});

HomeScreen.navigationOptions = ({ navigation }) => ({
  title: "Tragedy of the CO₂mmons"
});

export default HomeScreen;
