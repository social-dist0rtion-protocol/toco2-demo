import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

type OverlayProps = {
  show: boolean;
};

const Overlay = (props: OverlayProps) => {
  if (!props.show) return null;
  return (
    <View style={styles.Overlay}>
      <ActivityIndicator size="large" color="white" />
    </View>
  );
};

const styles = StyleSheet.create({
  Overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingTop: 250,
    backgroundColor: "rgba(0, 0, 0, 0.8)"
  }
});

export default React.memo(Overlay);
