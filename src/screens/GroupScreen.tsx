import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import auth from '@react-native-firebase/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Group'>;

type Post = {
  id: string;
  author: string;
  content: string;
  createdAt: number;
};

const GroupScreen: React.FC<Props> = ({ route, navigation }) => {
  const { groupId, name, description } = route.params; // groupId currently not used but kept for future
  const user = auth().currentUser;

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [error, setError] = useState('');

  const handleAddPost = () => {
    const trimmed = newPostContent.trim();
    if (!trimmed) {
      setError('Post cannot be empty.');
      return;
    }

    const author = user?.displayName || user?.email || 'Trainer';

    const newPost: Post = {
      id: Date.now().toString(),
      author,
      content: trimmed,
      createdAt: Date.now(),
    };

    setPosts(prev => [newPost, ...prev]);
    setNewPostContent('');
    setError('');
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleString();
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View>
          <Text style={styles.postAuthor}>{item.author}</Text>
          <Text style={styles.postTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePost(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={2}>
              {description}
            </Text>
          </View>
        </View>
      </View>

      {/* Posts list */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPostItem}
        contentContainerStyle={posts.length === 0 ? styles.emptyList : styles.postsList}
        ListEmptyComponent={
          <View style={styles.noPostsContainer}>
            <Text style={styles.noPostsIcon}>📝</Text>
            <Text style={styles.noPostsText}>No posts yet</Text>
            <Text style={styles.noPostsSubtext}>
              Be the first to share something with the group!
            </Text>
          </View>
        }
      />

      {/* New post input */}
      <View style={styles.newPostContainer}>
        <TextInput
          style={styles.newPostInput}
          placeholder="Write a post..."
          placeholderTextColor="#999"
          value={newPostContent}
          onChangeText={text => {
            setNewPostContent(text);
            setError('');
          }}
          multiline
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.postButton}
          onPress={handleAddPost}
          activeOpacity={0.8}
        >
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#777',
  },

  postsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  emptyList: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },

  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  postAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC0A2D',
  },
  postTime: {
    fontSize: 11,
    color: '#777',
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFE5E8',
  },
  deleteButtonText: {
    fontSize: 11,
    color: '#DC0A2D',
    fontWeight: '600',
  },
  postContent: {
    fontSize: 14,
    color: '#333',
  },

  noPostsContainer: {
    alignItems: 'center',
  },
  noPostsIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  noPostsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  noPostsSubtext: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },

  newPostContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  newPostInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1a1a1a',
    minHeight: 40,
    maxHeight: 100,
  },
  errorText: {
    color: '#DC0A2D',
    fontSize: 12,
    marginTop: 4,
  },
  postButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#DC0A2D',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GroupScreen;
