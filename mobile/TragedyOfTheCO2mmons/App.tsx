import { createStackNavigator, createAppContainer } from "react-navigation";
import HomeScreen from "./screens/Home";
import SignupScreen from "./screens/Signup";

const AppNavigator = createStackNavigator(
  {
    Home: { screen: HomeScreen },
    Signup: { screen: SignupScreen }
  },
  { initialRouteName: "Home" }
);

export default createAppContainer(AppNavigator);
