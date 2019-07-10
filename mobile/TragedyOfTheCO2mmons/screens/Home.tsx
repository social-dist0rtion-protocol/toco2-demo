import React, { useState, useEffect } from "react";
import { AsyncStorage, View, StyleSheet, RefreshControl } from "react-native";
import Signup from "components/Signup";
import { setJwt, setServer } from "../api";
import Status from "components/Status";
import Actions from "components/Actions";
import Overlay from "components/Overlay";
import { NavigationScreenProp } from "react-navigation";
import { ScrollView } from "react-native-gesture-handler";
import { Notifications } from "expo";

const HomeScreen = ({
  navigation
}: {
  navigation: NavigationScreenProp<any>;
}) => {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    Notifications.addListener(() => setRefreshing(true));

    AsyncStorage.multiGet(["server", "jwt", "id", "name", "avatar"])
      .then(values => {
        values.forEach(keyValue => {
          const [key, value] = keyValue;
          if (value) {
            switch (key) {
              case "server":
                setServer(value);
                break;
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

  const onRefresh = () => setTimeout(() => setRefreshing(false), 1000);

  if (!ready) return <Overlay show={true} />;

  return (
    <ScrollView
      contentContainerStyle={styles.Wrapper}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => setRefreshing(true)}
        />
      }
    >
      {loggedIn ? (
        <View>
          <Status
            id={id}
            name={name}
            avatar={avatar}
            navigation={navigation}
            doRefresh={refreshing}
            onRefresh={onRefresh}
          />
          <Actions id={id} navigation={navigation} />
        </View>
      ) : (
        <Signup onLoginSuccess={onLoginSuccess} />
      )}
    </ScrollView>
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
