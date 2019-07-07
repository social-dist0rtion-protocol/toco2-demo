import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { material, systemWeights } from "react-native-typography";
import { getStatus } from "../api";

type StatusProps = {
  id: string;
  name: string;
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
      <Text>Your id: {props.id}</Text>
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
    flex: 1,
    marginTop: 30
  },
  Welcome: {
    ...material.headlineWhiteObject
  },
  Status: {
    flex: 1,
    marginTop: 30
  },
  StatusText: {
    ...material.subheadingWhiteObject
  },
  Bold: {
    ...systemWeights.bold
  }
});

export default React.memo(Status);
