import { createStackNavigator, createAppContainer } from 'react-navigation';
import Screens from "./Screens/index";

const MainNavigator = createStackNavigator({
  Home: { screen: Screens.HomeScreen },
  TaskTypes: { screen: Screens.TaskTypes },
  Task: { screen: Screens.Task }
},
  {
    initialRouteName: "Home",
    headerMode: "none"
  });

const App = createAppContainer(MainNavigator);

export default App;
