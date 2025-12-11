import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

// ----- Types -----
type Group = {
  id: string;
  name: string;
  description: string;
  members: number;
};

type CommunityNav = NativeStackNavigationProp<RootStackParamList, 'Community'>;

// Sample starting groups
const INITIAL_GROUPS: Group[] = [
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
  const navigation = useNavigation<CommunityNav>();

  // Groups state
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);

  // Search state
  const [search, setSearch] = useState('');

  // Create Group modal state
  const [isCreateGroupVisible, setIsCreateGroupVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [createGroupError, setCreateGroupError] = useState('');

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter(group =>
      group.name.toLowerCase().includes(query),
    );
  }, [search, groups]);

  const openCreateGroupModal = () => {
    setCreateGroupError('');
    setNewGroupName('');
    setNewGroupDescription('');
    setIsCreateGroupVisible(true);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      setCreateGroupError('Group name is required.');
      return;
    }

    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || 'No description yet.',
      members: 1,
    };

    setGroups(prev => [newGroup, ...prev]);
    setIsCreateGroupVisible(false);
  };

  const handleOpenGroup = (group: Group) => {
    navigation.navigate('Group', {
      groupId: group.id,
      name: group.name,
      description: group.description,
    });
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      activeOpacity={0.8}
      onPress={() => handleOpenGroup(item)}
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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.headerSubtitle}>
              Create groups and share posts with other trainers
            </Text>
          </View>
        </View>
      </View>

      {/* Search bar */}
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

      {/* Groups grid */}
      <FlatList
        data={filteredGroups}
        renderItem={renderGroupItem}
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

      {/* Add Group FAB */}
      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.8}
        onPress={openCreateGroupModal}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Create Group Modal */}
      <Modal
        visible={isCreateGroupVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateGroupVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.createGroupModalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Group name"
              placeholderTextColor="#999"
              value={newGroupName}
              onChangeText={text => {
                setNewGroupName(text);
                setCreateGroupError('');
              }}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#999"
              value={newGroupDescription}
              onChangeText={text => {
                setNewGroupDescription(text);
                setCreateGroupError('');
              }}
              multiline
            />

            {createGroupError ? (
              <Text style={styles.modalError}>{createGroupError}</Text>
            ) : null}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setIsCreateGroupVisible(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreateGroup}
              >
                <Text style={styles.modalButtonPrimaryText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  createGroupModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 10,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalError: {
    color: '#DC0A2D',
    fontSize: 13,
    marginBottom: 6,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  modalButtonSecondary: {
    backgroundColor: '#F1F1F1',
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  modalButtonPrimary: {
    backgroundColor: '#DC0A2D',
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CommunityScreen;
