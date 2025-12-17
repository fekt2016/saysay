import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableHighlight, TouchableOpacity, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSearchNeighborhoods } from '../hooks/useNeighborhoods';
import { theme } from '../theme';

const NeighborhoodAutocomplete = ({
  value,
  onChange,
  city,
  placeholder = "Search neighborhood...",
  onSelect,
  disabled = false,
  error,
}) => {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const inputRef = useRef(null);

  const { data: neighborhoods = [], isLoading } = useSearchNeighborhoods(
    query,
    city,
    isOpen && query.length >= 2
  );

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const handleInputChange = (text) => {
    setQuery(text);
    setIsOpen(true);

    
    if (onChange) {
      onChange(text);
    }

    
    if (selectedNeighborhood) {
      setSelectedNeighborhood(null);
    }
  };

  const handleSelect = (neighborhood) => {
    setQuery(neighborhood.name);
    setSelectedNeighborhood(neighborhood);
    setIsOpen(false);

    
    if (onChange) {
      onChange(neighborhood.name);
    }

    
    if (onSelect) {
      onSelect(neighborhood);
    }
  };

  const handleFocus = () => {
    if (query.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <Wrapper>
      <InputWrapper>
        <SearchIcon>
          <Text style={{ fontSize: 16 }}>🔍</Text>
        </SearchIcon>
        <Input
          ref={inputRef}
          value={query}
          onChangeText={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          editable={!disabled}
          style={{
            borderColor: error ? theme.colors.error : theme.colors.grey300,
          }}
        />
        {selectedNeighborhood && (
          <SelectedIcon>
            <Text style={{ fontSize: 16, color: theme.colors.green700 }}>✓</Text>
          </SelectedIcon>
        )}
        {isLoading && (
          <LoadingIcon>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </LoadingIcon>
        )}
      </InputWrapper>

      {isOpen && query.length >= 2 && (
        <Dropdown>
          {isLoading ? (
            <DropdownItem>
              <Text style={{ color: theme.colors.grey600 }}>Searching...</Text>
            </DropdownItem>
          ) : neighborhoods.length === 0 ? (
            <DropdownItem>
              <Text style={{ color: theme.colors.grey500, fontStyle: 'italic' }}>
                No neighborhoods found
              </Text>
            </DropdownItem>
          ) : (
            <FlatList
              data={neighborhoods}
              keyExtractor={(item) => item._id || item.id || item.name}
              renderItem={({ item }) => (
                <DropdownItem
                  onPress={() => handleSelect(item)}
                  $selected={selectedNeighborhood?._id === item._id}
                >
                  <NeighborhoodName>{item.name}</NeighborhoodName>
                  {item.city && (
                    <NeighborhoodCity>{item.city}</NeighborhoodCity>
                  )}
                  {item.assignedZone && (
                    <NeighborhoodZone>Zone {item.assignedZone}</NeighborhoodZone>
                  )}
                </DropdownItem>
              )}
              style={{ maxHeight: 300 }}
            />
          )}
        </Dropdown>
      )}
    </Wrapper>
  );
};

export default NeighborhoodAutocomplete;



const Wrapper = ({style, ...props}) => (
  <View {...props} style={[styles.wrapper, style]} />
);


const InputWrapper = ({style, ...props}) => (
  <View {...props} style={[styles.inputWrapper, style]} />
);


const SearchIcon = ({style, ...props}) => (
  <View {...props} style={[styles.searchIcon, style]} />
);


const SelectedIcon = ({style, ...props}) => (
  <View {...props} style={[styles.selectedIcon, style]} />
);


const LoadingIcon = ({style, ...props}) => (
  <View {...props} style={[styles.loadingIcon, style]} />
);


const Input = ({style, ...props}) => (
  <TextInput {...props} style={[styles.input, style]} />
);


const Dropdown = ({style, ...props}) => (
  <View {...props} style={[styles.dropdown, style]} />
);


const DropdownItem = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.dropdownItem, style]} />
);


const NeighborhoodName = ({style, ...props}) => (
  <Text {...props} style={[styles.neighborhoodName, style]} />
);


const NeighborhoodCity = ({style, ...props}) => (
  <Text {...props} style={[styles.neighborhoodCity, style]} />
);


const NeighborhoodZone = ({style, ...props}) => (
  <Text {...props} style={[styles.neighborhoodZone, style]} />
);


const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    zIndex: 1,
    pointerEvents: 'none',
  },
  selectedIcon: {
    position: 'absolute',
    zIndex: 1,
    pointerEvents: 'none',
  },
  loadingIcon: {
    position: 'absolute',
    zIndex: 1,
    pointerEvents: 'none',
  },
  input: {
    flex: 1,
    borderWidth: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    maxHeight: 300,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: '0 4',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: {
    borderBottomWidth: 1,
  },
  neighborhoodName: {
  },
  neighborhoodCity: {
  },
  neighborhoodZone: {
  },
});
