// src/screens/FeedScreen.tsx - COMPLETE COMMUNITY FEED
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StatusBar, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

type FeedPost = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  pokemonId: number;
  pokemonName: string;
  pokemonImage: string;
  pokemonTypes: string[];
  capturedAt: any;
  caption?: string;
  photoUri?: string;
  likes: number;
  likedBy: string[];
};

const TYPE_COLORS: { [key: string]: string } = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC',
};

const FeedScreen = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [recentCaught, setRecentCaught] = useState<any[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<any>(null);
  const [sharing, setSharing] = useState(false);

  const user = auth().currentUser;

  useEffect(() => {
    loadFeed();
    loadRecentCaught();
  }, []);

  const loadFeed = async () => {
    try {
      const snapshot = await firestore()
        .collection('feed')
        .orderBy('capturedAt', 'desc')
        .limit(50)
        .get();

      const feedPosts: FeedPost[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as FeedPost));

      setPosts(feedPosts);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRecentCaught = async () => {
    if (!user) return;

    try {
      const snapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('caught')
        .orderBy('caughtAt', 'desc')
        .limit(10)
        .get();

      const caught = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${data.pokemonId}`);
            const pokemonData = await res.json();
            return {
              id: data.pokemonId,
              name: data.pokemonName,
              image: pokemonData.sprites.other['official-artwork'].front_default,
              types: pokemonData.types.map((t: any) => t.type.name),
            };
          } catch (e) {
            return null;
          }
        })
      );

      setRecentCaught(caught.filter(p => p !== null));
    } catch (error) {
      console.error('Error loading recent caught:', error);
    }
  };

  const handleShare = async () => {
    if (!selectedPokemon || !user) {
      Alert.alert('Error', 'Please select a Pokémon to share');
      return;
    }

    setSharing(true);
    try {
      await firestore().collection('feed').add({
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split('@')[0] || 'Trainer',
        pokemonId: selectedPokemon.id,
        pokemonName: selectedPokemon.name,
        pokemonImage: selectedPokemon.image,
        pokemonTypes: selectedPokemon.types,
        caption: caption.trim() || `I caught ${selectedPokemon.name}!`,
        capturedAt: firestore.FieldValue.serverTimestamp(),
        likes: 0,
        likedBy: [],
      });

      Alert.alert('Success! 🎉', 'Your catch has been shared to the community!');
      setShowShareModal(false);
      setCaption('');
      setSelectedPokemon(null);
      await loadFeed();
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleLike = async (post: FeedPost) => {
    if (!user) return;

    const hasLiked = post.likedBy.includes(user.uid);
    const newLikes = hasLiked ? post.likes - 1 : post.likes + 1;
    const newLikedBy = hasLiked
      ? post.likedBy.filter(id => id !== user.uid)
      : [...post.likedBy, user.uid];

    // Optimistic update
    setPosts(posts.map(p => 
      p.id === post.id 
        ? { ...p, likes: newLikes, likedBy: newLikedBy }
        : p
    ));

    try {
      await firestore()
        .collection('feed')
        .doc(post.id)
        .update({
          likes: newLikes,
          likedBy: newLikedBy,
        });
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert on error
      setPosts(posts);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeed();
    loadRecentCaught();
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderPost = ({ item }: { item: FeedPost }) => {
    const primaryType = item.pokemonTypes[0];
    const bgColor = TYPE_COLORS[primaryType] || '#A8A878';
    const hasLiked = user ? item.likedBy.includes(user.uid) : false;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {item.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.postHeaderInfo}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.postTime}>{formatTimestamp(item.capturedAt)}</Text>
          </View>
        </View>

        <View style={[styles.pokemonContainer, { backgroundColor: bgColor + '20' }]}>
          <Image 
            source={{ uri: item.pokemonImage }} 
            style={styles.pokemonImage}
            resizeMode="contain"
          />
          <View style={[styles.pokemonBg, { backgroundColor: bgColor + '10' }]} />
        </View>

        <View style={styles.postContent}>
          <View style={styles.pokemonInfo}>
            <Text style={styles.pokemonName}>
              {item.pokemonName.charAt(0).toUpperCase() + item.pokemonName.slice(1)}
            </Text>
            <Text style={styles.pokemonId}>#{item.pokemonId.toString().padStart(3, '0')}</Text>
          </View>
          
          <View style={styles.typesContainer}>
            {item.pokemonTypes.map((type, i) => (
              <View
                key={i}
                style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[type] }]}
              >
                <Text style={styles.typeText}>{type}</Text>
              </View>
            ))}
          </View>

          {item.caption && (
            <Text style={styles.caption}>{item.caption}</Text>
          )}

          <View style={styles.postActions}>
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={() => handleLike(item)}
            >
              <Text style={styles.likeIcon}>{hasLiked ? '❤️' : '🤍'}</Text>
              <Text style={styles.likeText}>{item.likes}</Text>
            </TouchableOpacity>
            <Text style={styles.catchText}>🎯 Caught!</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderShareModal = () => (
    <Modal
      visible={showShareModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowShareModal(false)}
    >
      <View style={styles.modalContainer}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowShareModal(false)}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Share Your Catch</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.selectLabel}>Select a Pokémon:</Text>
          <FlatList
            data={recentCaught}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.selectPokemonCard,
                  selectedPokemon?.id === item.id && styles.selectPokemonCardActive
                ]}
                onPress={() => setSelectedPokemon(item)}
              >
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.selectPokemonImage}
                  resizeMode="contain"
                />
                <Text style={styles.selectPokemonName}>
                  {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.selectList}
            ListEmptyComponent={
              <View style={styles.emptySelect}>
                <Text style={styles.emptySelectText}>
                  Catch some Pokémon first to share!
                </Text>
              </View>
            }
          />

          {selectedPokemon && (
            <>
              <Text style={styles.captionLabel}>Add a caption (optional):</Text>
              <TextInput
                style={styles.captionInput}
                placeholder={`I caught ${selectedPokemon.name}!`}
                placeholderTextColor="#999"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{caption.length}/200</Text>

              <TouchableOpacity 
                style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
                onPress={handleShare}
                disabled={sharing}
              >
                {sharing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.shareButtonText}>Share to Community 🌐</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.title}>Community Feed</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC0A2D" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Community Feed</Text>
        <TouchableOpacity 
          style={styles.shareIconButton}
          onPress={() => setShowShareModal(true)}
        >
          <Text style={styles.shareIcon}>➕</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🌐</Text>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptyHint}>Be the first to share your catch!</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setShowShareModal(true)}
            >
              <Text style={styles.emptyButtonText}>Share Now</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {renderShareModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { 
    backgroundColor: '#fff', 
    paddingTop: 20, 
    paddingBottom: 16, 
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  shareIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC0A2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: { fontSize: 24, color: '#fff' },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  feedList: { padding: 16 },
  
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC0A2D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  postHeaderInfo: { flex: 1 },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#999',
  },
  pokemonContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pokemonImage: {
    width: 200,
    height: 200,
    zIndex: 1,
  },
  pokemonBg: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  postContent: { padding: 16 },
  pokemonInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pokemonName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  pokemonId: {
    fontSize: 14,
    color: '#666',
  },
  typesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeIcon: { fontSize: 20 },
  likeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  catchText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1a1a1a', 
    marginBottom: 8 
  },
  emptyHint: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#DC0A2D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  modalContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modalClose: { fontSize: 28, color: '#1a1a1a' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  modalContent: { flex: 1, padding: 20 },
  selectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  selectList: { paddingVertical: 12 },
  selectPokemonCard: {
    width: 120,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectPokemonCardActive: {
    borderColor: '#DC0A2D',
  },
  selectPokemonImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  selectPokemonName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  emptySelect: {
    padding: 40,
    alignItems: 'center',
  },
  emptySelectText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  captionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 12,
  },
  captionInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  shareButton: {
    backgroundColor: '#DC0A2D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FeedScreen;