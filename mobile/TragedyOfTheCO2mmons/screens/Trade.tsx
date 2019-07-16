import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, FlatList, Image, Alert } from "react-native";
import { getPlayerList, trade } from "../api";
import { material } from "react-native-typography";
import { NavigationScreenProps } from "react-navigation";
import Touchable from "components/Touchable";
import { showAlert } from "components/Alert";

interface PlayerInfo {
  name: string;
  avatar: string;
  balance: number;
  co2: number;
  trees: number;
}

export interface Player extends PlayerInfo {
  id: string;
}

type TradeProps = {
  navigation: NavigationScreenProps["navigation"];
};

const EmptyList = () => (
  <View style={styles.Empty}>
    <Text>No one is playing yet 😭</Text>
  </View>
);

export const TradeScreen = (props: TradeProps) => {
  const [players, setPlayers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (refreshing) {
      getPlayerList().then(playerDict => {
        setPlayers(
          Object.entries<PlayerInfo>(playerDict)
            .filter(
              ([id, _]) => id !== props.navigation.getParam("id", "unset")
            )
            .map<Player>(([id, player]) => ({
              id,
              name: player.name,
              avatar: player.avatar,
              balance: player.balance,
              co2: player.co2,
              trees: player.trees
            }))
            .sort((p1, p2) => {
              const n1 = p1.name.toLowerCase();
              const n2 = p2.name.toLowerCase();
              return n1 > n2 ? 1 : n1 < n2 ? -1 : 0;
            })
        );
        setRefreshing(false);
      });
    } else {
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    // load list of players on mount
    setRefreshing(true);
  }, []);

  const doRefresh = () => setRefreshing(true);

  const keyExtractor = (item: Player) => item.id;

  const onTrade = (id: string, dstPlayerName: string) => () =>
    Alert.alert(
      "Fair trade? 🤨",
      `Do you want to be fair with ${dstPlayerName}?`,
      [
        {
          text: "No, exploit!",
          style: "cancel",
          onPress: doTrade(id, dstPlayerName, false)
        },
        { text: "Yes, be fair", onPress: doTrade(id, dstPlayerName, true) }
      ]
    );

  const doTrade = (
    id: string,
    dstPlayerName: string,
    beFair: boolean
  ) => async () => {
    try {
      const response = await trade(id, beFair);
      if (response.success) {
        showAlert(
          `Your transaction was created with id ${
            response.tx
          } and must be approved by ${dstPlayerName} ⏳`
        );
      } else {
        showAlert(`Couldn't trade with ${dstPlayerName}: ${response.error} 🤷‍♂️`);
      }
    } catch (error) {
      showAlert(`Something went wrong: ${error} 🤦‍♂️`);
    }
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.Player} key={item.id}>
      <Image style={styles.Image} source={{ uri: item.avatar }} />
      <View style={styles.TouchableWrapper}>
        <Touchable
          style={styles.Touchable}
          onPress={onTrade(item.id, item.name)}
        >
          <Text style={styles.Name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text>
            💰 {item.balance} 🌫️ {item.co2} 🌳 {item.trees}
          </Text>
        </Touchable>
      </View>
    </View>
  );

  return (
    <FlatList
      data={players}
      keyExtractor={keyExtractor}
      renderItem={renderPlayer}
      refreshing={refreshing}
      onRefresh={doRefresh}
      ListEmptyComponent={EmptyList}
    />
  );
};

const styles = StyleSheet.create({
  Wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  Empty: {
    margin: 16
  },
  Player: {
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
  Name: {
    ...material.titleObject
  }
});

TradeScreen.navigationOptions = () => ({
  title: "Trade with..."
});

export default TradeScreen;
