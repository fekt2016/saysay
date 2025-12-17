import { LogBox } from 'react-native';
import { registerRootComponent } from "expo";

import App from "./App";

LogBox.ignoreLogs([
  'Expected style',
  'to contain units',
]);

registerRootComponent(App);


