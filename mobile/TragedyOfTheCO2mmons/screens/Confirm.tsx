import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, FlatList, Alert } from "react-native";
import { Player } from "../screens/Trade";
import { material } from "react-native-typography";
import { getPendingTransactions, confirmTx } from "../api";
import Touchable from "components/Touchable";
import { showAlert } from "components/Alert";

type Transaction = {
  id: string;
  from: Player;
};

const EmptyList = () => (
  <View style={styles.Empty}>
    <Text>No pending transactions at the moment 🧐</Text>
  </View>
);

export const ConfirmScreen = () => {
  const [pending, setPending] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (refreshing) {
      getPendingTransactions().then(pendingDict => {
        setPending(
          Object.entries<Transaction>(pendingDict.pending).map(([id, tx]) => ({
            id,
            from: tx.from
          }))
        );
        setRefreshing(false);
      });
    } else {
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    // load list of transactions on mount
    setRefreshing(true);
  }, []);

  const doRefresh = () => setRefreshing(true);

  const keyExtractor = (item: Transaction) => item.id;

  const askConfirm = (txId: string, name: string) => () =>
    Alert.alert("Fair trade? 🤨", `Do you want to be fair with ${name}?`, [
      {
        text: "No, exploit!",
        style: "cancel",
        onPress: doConfirm(txId, name, false)
      },
      { text: "Yes, be fair", onPress: doConfirm(txId, name, true) }
    ]);

  const doConfirm = (
    txId: string,
    name: string,
    beFair: boolean
  ) => async () => {
    try {
      const response = await confirmTx(txId, beFair);
      if (response.success) {
        const happy = response.points >= response.otherPoints;
        showAlert(
          `${happy ? "Yay! " : ""}You just got ${
            response.points
          } whatevzDAI releasing ${
            response.co2
          } tons of CO₂ to the atmosphere! 🔥\n${
            happy ? "" : "...but "
          }${name} got ${response.otherPoints} and emitted ${
            response.otherCo2
          } tons of CO₂${happy ? "! 🏭" : " 🤔"}`
        );
        doRefresh();
      } else {
        showAlert(
          `Couldn't confirm tx ${txId} with ${name}: ${response.error ||
            JSON.stringify(response)} ☹️`
        );
      }
    } catch (error) {
      showAlert(`Something went wrong: ${error} 😟`);
    }
  };

  const renderPending = ({ item }: { item: Transaction }) => (
    <View style={styles.Transaction} key={item.id}>
      <Image style={styles.Image} source={{ uri: item.from.avatar }} />
      <View style={styles.TouchableWrapper}>
        <Touchable
          style={styles.Touchable}
          onPress={askConfirm(item.id, item.from.name)}
        >
          <View>
            <Text style={styles.TransactionId}>{item.id}</Text>
            <Text style={styles.Name} numberOfLines={1}>
              {item.from.name}
            </Text>
          </View>
        </Touchable>
      </View>
    </View>
  );

  return (
    <FlatList
      data={pending}
      keyExtractor={keyExtractor}
      renderItem={renderPending}
      refreshing={refreshing}
      onRefresh={doRefresh}
      ListEmptyComponent={EmptyList}
    />
  );
};

const styles = StyleSheet.create({
  Empty: {
    margin: 16
  },
  Transaction: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center"
  },
  Image: {
    width: 60,
    height: 60,
    resizeMode: "cover"
  },
  Touchable: {
    height: 60,
    justifyContent: "center",
    paddingLeft: 12
  },
  TouchableWrapper: {
    flex: 1
  },
  TransactionId: {
    ...material.body2Object
  },
  Name: {
    ...material.body1Object
  }
});

ConfirmScreen.navigationOptions = () => ({
  title: "Pending transactions"
});

export default ConfirmScreen;
