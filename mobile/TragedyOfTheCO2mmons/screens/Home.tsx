import React, { useState, useEffect } from "react";
import { AsyncStorage, Text, View, StyleSheet } from "react-native";
import Signup from "../components/Signup";
import { setJwt } from "../api";
import Status from "../components/Status";
import Actions from "../components/Actions";

const HomeScreen = ({ navigation }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    AsyncStorage.multiGet(["jwt", "id", "name"])
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
            }
          }
        });
      })
      .catch(_ => setLoggedIn(false));
  }, []);

  const onLoginSuccess = (jwt: string, id: string, name: string) => {
    setJwt(jwt);
    setName(name);
    setId(id);
    AsyncStorage.multiSet([["jwt", jwt], ["id", id], ["name", name]]);
    setLoggedIn(true);
  };

  return (
    <View style={styles.Wrapper}>
      {loggedIn ? (
        <View>
          <Status id={id} name={name} />
          <Actions navigation={navigation} />
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
