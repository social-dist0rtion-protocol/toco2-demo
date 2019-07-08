import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { material, systemWeights } from "react-native-typography";
import { getStatus } from "../api";

type StatusProps = {
  id: string;
  name: string;
  avatar: string;
};

const Status = (props: StatusProps) => {
  const [balance, setBalance] = useState(0);
  const [CO2, setCO2] = useState(0);
  const [globalCO2, setGlobalCO2] = useState(0);

  useEffect(() => {
    getStatus().then(response => {
      setBalance(response.balance);
      setCO2(response.co2);
      setGlobalCO2(response.globalCO2);
    });
  }, []);

  return (
    <View style={styles.Wrapper}>
      <Text style={styles.Welcome}>Welcome back, {props.name}!</Text>
      <View style={styles.Info}>
        <Image style={styles.Image} source={{ uri: props.avatar }} />
        <Text>
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
  Info: {
    flexDirection: "row",
    marginTop: 12
  },
  Image: {
    width: 120,
    height: 120,
    resizeMode: "cover",
    marginRight: 12
  }
});

export default React.memo(Status);
