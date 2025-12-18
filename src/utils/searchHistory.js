import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

export const getSearchHistory = async () => {
  try {
    const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
};

export const saveSearchToHistory = async (searchTerm) => {
  try {
    if (!searchTerm || !searchTerm.trim()) return;

    const trimmedTerm = searchTerm.trim();
    const history = await getSearchHistory();

    // FIXED: Case-insensitive deduplication
    const filteredHistory = history.filter(
      (item) => item.toLowerCase() !== trimmedTerm.toLowerCase()
    );

    const newHistory = [trimmedTerm, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (error) {
    console.error('Error saving search history:', error);
    return [];
  }
};

export const clearSearchHistory = async () => {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    return [];
  } catch (error) {
    console.error('Error clearing search history:', error);
    return [];
  }
};

export const removeSearchFromHistory = async (searchTerm) => {
  try {
    const history = await getSearchHistory();
    // FIXED: Case-insensitive removal
    const filteredHistory = history.filter(
      (item) => item.toLowerCase() !== searchTerm.toLowerCase()
    );
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
    return filteredHistory;
  } catch (error) {
    console.error('Error removing search from history:', error);
    return [];
  }
};


