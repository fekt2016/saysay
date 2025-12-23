let currentScreenName = 'Unknown';
let currentRouteParams = null;

export const setCurrentScreen = (screenName, params = null) => {
  currentScreenName = screenName || 'Unknown';
  currentRouteParams = params;

  if (__DEV__) {
    console.log(`[ScreenTracker] Current screen: ${currentScreenName}`, params ? `Params: ${JSON.stringify(params)}` : '');
  }
};

export const getCurrentScreen = () => {
  return currentScreenName;
};

export const getCurrentRouteParams = () => {
  return currentRouteParams;
};

