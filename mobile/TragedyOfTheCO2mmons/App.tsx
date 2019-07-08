import { createStackNavigator, createAppContainer } from "react-navigation";
import HomeScreen from "./screens/Home";
import PlantScreen from "./screens/Plant";
import TradeScreen from "./screens/Trade";
import ConfirmScreen from "./screens/Confirm";

const AppNavigator = createStackNavigator(
  {
    Home: { screen: HomeScreen },
    Plant: { screen: PlantScreen },
    Trade: { screen: TradeScreen },
    Confirm: { screen: ConfirmScreen }
  },
  { initialRouteName: "Home" }
);

export default createAppContainer(AppNavigator);
