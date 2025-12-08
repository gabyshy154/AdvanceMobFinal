// This screen is for the Community feature based on groups.
// - Shows a list of groups in 2 columns
// - Has a search bar to filter groups
// - Has a circular "add group" button (UI only for now)
// - Has a back button to return to Home

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// This part is for describing a simple group object.
type Group = {
  id: string;
  name: string;
  description: string;
  members: number;
};

// This part is for sample static groups (temporary data).
const SAMPLE_GROUPS: Group[] = [
  {
    id: '1',
    name: 'Kanto Shiny Hunters',
    description: 'Share your shiny finds from the Kanto region.',
    members: 128,
  },
  {
    id: '2',
    name: 'Manila Trainers',
    description: 'Local trainers around Metro Manila.',
    members: 94,
  },
  {
    id: '3',
    name: 'Water-Type Squad',
    description: 'All things Water-type. Strategy, teams, and more.',
    members: 57,
  },
  {
    id: '4',
    name: 'AR Capture Fans',
    description: 'Post your AR screenshots and capture stories.',
    members: 73,
  },
];

const CommunityScreen = () => {
  // This part is for navigation (back to Home).
  const navigation = useNavigation<any>();

  // This part is for managing search text.
  const [search, setSearch] = useState('');

  // This part is for filtering groups based on search.
  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return SAMPLE_GROUPS;
    return SAMPLE_GROUPS.filter(group =>
      group.name.toLowerCase().includes(query),
    );
  }, [search]);

  // This part is for rendering each group card in the grid.
  const renderItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      activeOpacity={0.8}
      // This part is for future navigation to a Group detail / chat screen.
      onPress={() => {
        // TODO: Navigate to GroupChatScreen in the future.
        console.log('Pressed group:', item.name);
      }}
    >
      <Text style={styles.groupName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.groupDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.groupMembers}>{item.members} members</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* This part is for the top header of the Community screen. */}
      <View style={styles.header}>
        {/* Header top row with Back button and title */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()} // This part returns to Home.
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.headerSubtitle}>
              Join groups and chat with other trainers
            </Text>
          </View>
        </View>
      </View>

      {/* This part is for the search bar to filter groups by name. */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* This part is for the 2-column grid of groups. */}
      <FlatList
        data={filteredGroups}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No groups found</Text>
            <Text style={styles.emptySubtext}>
              Try a different name or create a new group
            </Text>
          </View>
        }
      />

      {/* This part is for the circular "Add Group" button (UI only for now). */}
      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.8}
        onPress={() => {
          // TODO: Navigate to CreateGroup screen in the future.
          console.log('Add Group pressed');
        }}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

// This part is for styling the CommunityScreen.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  // This part is for the top header row with back button + title block.
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 22,
    color: '#333',
    marginTop: -2,
  },
  headerTitleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#777',
  },

  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
    paddingHorizontal: 4,
  },

  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 80,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },

  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC0A2D',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 13,
    color: '#444',
    marginBottom: 6,
  },
  groupMembers: {
    fontSize: 11,
    color: '#777',
    fontWeight: '500',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },

  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC0A2D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC0A2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: -2,
  },
});

export default CommunityScreen;
