import { material, materialColors } from "react-native-typography";
import { FlexAlignType, ViewStyle } from "react-native";

export const Button = {
  backgroundColor: "#00a572",
  width: 150,
  height: 40,
  justifyContent: "center",
  alignItems: "center" as FlexAlignType
} as ViewStyle;

export const ButtonText = {
  ...material.buttonWhiteObject
};

export const TextInputStyle = {
  height: 40,
  borderWidth: 1,
  paddingLeft: 12,
  borderColor: materialColors.whiteSecondary,
  color: materialColors.whitePrimary,
  marginBottom: 16
};

export const Label = {
  ...material.subheadingWhiteObject
};
