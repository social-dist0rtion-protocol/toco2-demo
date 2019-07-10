import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { material, systemWeights } from "react-native-typography";
import { getStatus } from "../api";
import { NavigationScreenProps } from "react-navigation";
import { Button, ButtonText } from "../styles";
import Touchable from "components/Touchable";

type StatusProps = {
  id: string;
  name: string;
  avatar: string;
  navigation: NavigationScreenProps["navigation"];
};

const Status = (props: StatusProps) => {
  const [balance, setBalance] = useState(0);
  const [CO2, setCO2] = useState(0);
  const [globalCO2, setGlobalCO2] = useState(0);
  const [trees, setTrees] = useState(0);
  const [pending, setPending] = useState([]);
  const [refreshStatus, setRefreshStatus] = useState(false);

  useEffect(() => {
    if (refreshStatus) {
      getStatus().then(response => {
        setBalance(response.balance);
        setCO2(response.co2);
        setGlobalCO2(response.globalCO2);
        setTrees(response.trees);
        setPending(response.pending);
      });
      setRefreshStatus(false);
    }
  }, [refreshStatus]);

  // load data on mount
  useEffect(() => setRefreshStatus(true), []);

  props.navigation.addListener("didFocus", _ => setRefreshStatus(true));

  return (
    <View style={styles.Wrapper}>
      <Text style={styles.Welcome}>Welcome back, {props.name}!</Text>
      <View style={styles.Info}>
        <Image style={styles.Image} source={{ uri: props.avatar }} />
        <Text style={styles.Id}>
          Your id:{"\n"}
          {props.id}
        </Text>
      </View>
      <View style={styles.Status}>
        <Text style={styles.StatusText}>
          Your balance:<Text style={styles.Bold}> {balance} </Text>whatevzDAI
        </Text>
        <Text style={styles.StatusText}>
          Your emissions:<Text style={styles.Bold}> {CO2} </Text>tons of CO₂
        </Text>
        <Text style={styles.StatusText}>
          Current CO₂ levels:<Text style={styles.Bold}> {globalCO2} </Text>ppm
        </Text>
        <Text style={styles.StatusText}>
          Trees planted:<Text style={styles.Bold}> {trees}</Text>
        </Text>
        {pending.length ? (
          <View style={styles.ButtonWrapper}>
            <Touchable onPress={() => props.navigation.navigate("Confirm")}>
              <View style={styles.Button}>
                <Text style={styles.ButtonText}>
                  {pending.length} pending tx
                </Text>
              </View>
            </Touchable>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  Wrapper: {
    marginTop: 30
  },
  Welcome: {
    ...material.headlineWhiteObject
  },
  Status: {
    marginTop: 30,
    alignItems: "center"
  },
  StatusText: {
    ...material.subheadingWhiteObject
  },
  Bold: {
    ...systemWeights.bold
  },
  ButtonWrapper: {
    alignItems: "center"
  },
  Button: {
    ...Button,
    backgroundColor: "#f9812a",
    marginTop: 12
  },
  Info: {
    flexDirection: "row",
    marginTop: 12
  },
  Image: {
    width: 120,
    height: 120,
    resizeMode: "cover",
    marginRight: 12
  },
  Id: {
    flex: 1,
    flexWrap: "wrap"
  },
  ButtonText
});

export default Status;
