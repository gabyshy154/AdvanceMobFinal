// src/screens/PokedexScreen.tsx - COMPLETE WITH ALL FEATURES
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar, Dimensions, Modal, ScrollView, 
  Alert, Share, Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VoiceSearchButton from './components/VoiceSearchButton';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const TYPE_COLORS: { [key: string]: string } = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC',
};

const ALL_TYPES = ['all', 'normal', 'fire', 'water', 'electric', 'grass', 'ice', 
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 
  'dragon', 'dark', 'steel', 'fairy'];

type Pokemon = {
  id: number;
  name: string;
  image: string;
  types: string[];
  caught: boolean;
};

type PokemonDetail = Pokemon & {
  height: number;
  weight: number;
  abilities: string[];
  stats: { name: string; value: number }[];
  flavorText?: string;
  evolutionChain?: EvolutionNode;
};

type EvolutionNode = {
  id: number;
  name: string;
  image: string;
  level?: number;
  next?: EvolutionNode;
};

type SortType = 'id' | 'name' | 'type';

const PokedexScreen = () => {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [filtered, setFiltered] = useState<Pokemon[]>([]);
  const [caughtPokemon, setCaughtPokemon] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCaughtOnly, setShowCaughtOnly] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<SortType>('id');

  const user = auth().currentUser;

  useEffect(() => {
    loadCaughtPokemon();
    fetchPokemon();
  }, []);

  useEffect(() => {
    filterPokemon();
  }, [search, pokemon, showCaughtOnly, caughtPokemon, selectedType, sortBy]);

  const loadCaughtPokemon = async () => {
    if (!user) return;

    try {
      const cached = await AsyncStorage.getItem(`caught_${user.uid}`);
      if (cached) {
        setCaughtPokemon(new Set(JSON.parse(cached)));
      }

      const snapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('caught')
        .get();

      const caughtIds = snapshot.docs.map(doc => parseInt(doc.id));
      const caughtSet = new Set(caughtIds);
      setCaughtPokemon(caughtSet);

      await AsyncStorage.setItem(`caught_${user.uid}`, JSON.stringify(caughtIds));
    } catch (error) {
      console.error('Error loading caught pokemon:', error);
    }
  };

  const filterPokemon = () => {
    let result = [...pokemon];

    // Filter by search
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toString().includes(search) ||
        p.types.some(t => t.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter(p => p.types.includes(selectedType));
    }

    // Filter by caught status
    if (showCaughtOnly) {
      result = result.filter(p => caughtPokemon.has(p.id));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.types[0].localeCompare(b.types[0]);
        case 'id':
        default:
          return a.id - b.id;
      }
    });

    setFiltered(result);
  };

  const fetchPokemon = async () => {
    try {
      const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      const details: Pokemon[] = await Promise.all(
        data.results.map(async (p: any, index: number) => {
          try {
            const r = await fetch(p.url);
            const d = await r.json();
            return {
              id: d.id,
              name: d.name,
              image: d.sprites.other['official-artwork'].front_default || d.sprites.front_default,
              types: d.types.map((t: any) => t.type.name),
              caught: false,
            };
          } catch (error) {
            return {
              id: index + 1,
              name: p.name,
              image: '',
              types: ['normal'],
              caught: false,
            };
          }
        })
      );

      setPokemon(details);
      setFiltered(details);
    } catch (e: any) {
      Alert.alert(
        'Network Error',
        'Failed to load Pokémon data. Please check your internet connection.',
        [
          { text: 'Retry', onPress: () => fetchPokemon() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPokemonDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      // Fetch basic data
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await res.json();

      // Fetch species for flavor text
      const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
      const speciesData = await speciesRes.json();

      // Get English flavor text
      const flavorTextEntry = speciesData.flavor_text_entries.find(
        (entry: any) => entry.language.name === 'en'
      );
      const flavorText = flavorTextEntry 
        ? flavorTextEntry.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ')
        : 'No description available.';

      // Fetch evolution chain
      let evolutionChain: EvolutionNode | undefined;
      try {
        const evolutionRes = await fetch(speciesData.evolution_chain.url);
        const evolutionData = await evolutionRes.json();
        evolutionChain = await parseEvolutionChain(evolutionData.chain);
      } catch (e) {
        console.log('Evolution chain error:', e);
      }

      const detail: PokemonDetail = {
        id: data.id,
        name: data.name,
        image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
        types: data.types.map((t: any) => t.type.name),
        height: data.height,
        weight: data.weight,
        abilities: data.abilities.map((a: any) => a.ability.name),
        stats: data.stats.map((s: any) => ({
          name: s.stat.name,
          value: s.base_stat,
        })),
        caught: caughtPokemon.has(id),
        flavorText,
        evolutionChain,
      };

      setSelectedPokemon(detail);
    } catch (e) {
      console.error('Error fetching detail:', e);
      Alert.alert('Error', 'Failed to load Pokémon details');
    } finally {
      setDetailLoading(false);
    }
  };

  const parseEvolutionChain = async (chain: any): Promise<EvolutionNode | undefined> => {
    const id = parseInt(chain.species.url.split('/').slice(-2, -1)[0]);
    
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await res.json();

      const node: EvolutionNode = {
        id,
        name: chain.species.name,
        image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
      };

      if (chain.evolves_to.length > 0) {
        const nextChain = chain.evolves_to[0];
        const minLevel = nextChain.evolution_details[0]?.min_level;
        
        node.next = await parseEvolutionChain(nextChain);
        if (node.next && minLevel) {
          node.next.level = minLevel;
        }
      }

      return node;
    } catch (e) {
      return undefined;
    }
  };

  const handleShare = async () => {
    if (!selectedPokemon) return;

    try {
      const message = `Check out ${selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)} (#${selectedPokemon.id})!\n\nType: ${selectedPokemon.types.join(', ')}\nHeight: ${selectedPokemon.height / 10}m\nWeight: ${selectedPokemon.weight / 10}kg\n\n${selectedPokemon.flavorText}\n\nCaught in PokéExplorer!`;

      await Share.share({
        message,
        title: `Pokémon: ${selectedPokemon.name}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleVoiceSearch = (text: string) => {
    setSearch(text);
  };

  const cycleSortType = () => {
    const types: SortType[] = ['id', 'name', 'type'];
    const currentIndex = types.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % types.length;
    setSortBy(types[nextIndex]);
  };

  const renderTypeFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.typeFilterContainer}
      contentContainerStyle={styles.typeFilterContent}
    >
      {ALL_TYPES.map(type => (
        <TouchableOpacity
          key={type}
          style={[
            styles.typeFilterButton,
            selectedType === type && styles.typeFilterButtonActive,
            type !== 'all' && { backgroundColor: TYPE_COLORS[type] + '40' }
          ]}
          onPress={() => setSelectedType(type)}
        >
          <Text style={[
            styles.typeFilterText,
            selectedType === type && styles.typeFilterTextActive
          ]}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderItem = ({ item }: { item: Pokemon }) => {
    const primaryType = item.types[0];
    const bgColor = TYPE_COLORS[primaryType] || '#A8A878';
    const isCaught = caughtPokemon.has(item.id);

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8}
        onPress={() => fetchPokemonDetail(item.id)}
      >
        <View style={[
          styles.cardBackground, 
          { backgroundColor: bgColor + '20' },
          !isCaught && styles.cardUncaught
        ]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.pokemonId, { color: bgColor }]}>
              #{item.id.toString().padStart(3, '0')}
            </Text>
            {isCaught && <Text style={styles.caughtBadge}>✓</Text>}
          </View>

          <View style={styles.imageWrapper}>
            <View style={[styles.imageBg, { backgroundColor: bgColor + '15' }]} />
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={[styles.pokemonImage, !isCaught && styles.uncaughtImage]}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.noImage}>?</Text>
            )}
          </View>

          <View style={styles.cardFooter}>
            <Text style={[styles.pokemonName, !isCaught && styles.uncaughtText]} numberOfLines={1}>
              {isCaught ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : '???'}
            </Text>

            <View style={styles.typesContainer}>
              {isCaught ? item.types.slice(0, 2).map((type, i) => (
                <View
                  key={i}
                  style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[type] || '#777' }]}
                >
                  <Text style={styles.typeText}>{type}</Text>
                </View>
              )) : (
                <View style={[styles.typeBadge, { backgroundColor: '#999' }]}>
                  <Text style={styles.typeText}>???</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEvolutionChain = (node: EvolutionNode | undefined) => {
    if (!node) return null;

    const nodes: EvolutionNode[] = [];
    let current: EvolutionNode | undefined = node;
    while (current) {
      nodes.push(current);
      current = current.next;
    }

    return (
      <View style={styles.evolutionContainer}>
        {nodes.map((n, index) => (
          <React.Fragment key={n.id}>
            <View style={styles.evolutionNode}>
              <Image source={{ uri: n.image }} style={styles.evolutionImage} />
              <Text style={styles.evolutionName}>
                {n.name.charAt(0).toUpperCase() + n.name.slice(1)}
              </Text>
              <Text style={styles.evolutionId}>#{n.id.toString().padStart(3, '0')}</Text>
            </View>
            {index < nodes.length - 1 && (
              <View style={styles.evolutionArrow}>
                <Text style={styles.evolutionArrowText}>→</Text>
                {nodes[index + 1].level && (
                  <Text style={styles.evolutionLevel}>Lv.{nodes[index + 1].level}</Text>
                )}
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderDetail = () => {
    if (!selectedPokemon) return null;

    const primaryType = selectedPokemon.types[0];
    const bgColor = TYPE_COLORS[primaryType] || '#A8A878';

    return (
      <Modal
        visible={!!selectedPokemon}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedPokemon(null)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
          
          <View style={[styles.modalHeader, { backgroundColor: bgColor }]}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setSelectedPokemon(null)}
              >
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShare}
              >
                <Text style={styles.shareText}>Share ↗</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>
              {selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}
            </Text>
            <Text style={styles.modalId}>#{selectedPokemon.id.toString().padStart(3, '0')}</Text>
            {selectedPokemon.caught && (
              <View style={styles.caughtIndicator}>
                <Text style={styles.caughtIndicatorText}>✓ Caught</Text>
              </View>
            )}
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.detailImageContainer, { backgroundColor: bgColor + '20' }]}>
              <Image
                source={{ uri: selectedPokemon.image }}
                style={styles.detailImage}
                resizeMode="contain"
              />
            </View>

            {/* Flavor Text */}
            {selectedPokemon.flavorText && (
              <View style={styles.detailSection}>
                <Text style={styles.flavorText}>{selectedPokemon.flavorText}</Text>
              </View>
            )}

            {/* Type */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Type</Text>
              <View style={styles.typesContainer}>
                {selectedPokemon.types.map((type, i) => (
                  <View
                    key={i}
                    style={[styles.detailTypeBadge, { backgroundColor: TYPE_COLORS[type] }]}
                  >
                    <Text style={styles.detailTypeText}>{type.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Physical Stats */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Physical Stats</Text>
              <View style={styles.physicalStats}>
                <View style={styles.physicalStatItem}>
                  <Text style={styles.physicalStatLabel}>Height</Text>
                  <Text style={styles.physicalStatValue}>{selectedPokemon.height / 10} m</Text>
                </View>
                <View style={styles.physicalStatItem}>
                  <Text style={styles.physicalStatLabel}>Weight</Text>
                  <Text style={styles.physicalStatValue}>{selectedPokemon.weight / 10} kg</Text>
                </View>
              </View>
            </View>

            {/* Abilities */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Abilities</Text>
              <View style={styles.abilitiesContainer}>
                {selectedPokemon.abilities.map((ability, i) => (
                  <View key={i} style={styles.abilityBadge}>
                    <Text style={styles.abilityText}>
                      {ability.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Evolution Chain */}
            {selectedPokemon.evolutionChain && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Evolution Chain</Text>
                {renderEvolutionChain(selectedPokemon.evolutionChain)}
              </View>
            )}

            {/* Base Stats */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Base Stats</Text>
              {selectedPokemon.stats.map((stat, i) => (
                <View key={i} style={styles.statRow}>
                  <Text style={styles.statName}>
                    {stat.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                  <View style={styles.statBarContainer}>
                    <View 
                      style={[
                        styles.statBar, 
                        { 
                          width: `${(stat.value / 255) * 100}%`,
                          backgroundColor: bgColor 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const caughtCount = caughtPokemon.size;
  const totalCount = 151;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.title}>Pokédex</Text>
        <Text style={styles.progressText}>Caught: {caughtCount}/{totalCount}</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Pokémon..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <VoiceSearchButton onResult={handleVoiceSearch} style={styles.voiceButton} />
        </View>

        {renderTypeFilter()}

        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterButton, showCaughtOnly && styles.filterButtonActive]}
            onPress={() => setShowCaughtOnly(!showCaughtOnly)}
          >
            <Text style={[styles.filterText, showCaughtOnly && styles.filterTextActive]}>
              {showCaughtOnly ? '✓ Caught Only' : 'Show All'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sortButton}
            onPress={cycleSortType}
          >
            <Text style={styles.sortText}>
              Sort: {sortBy === 'id' ? '#' : sortBy === 'name' ? 'ABC' : '🏷️'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC0A2D" />
          <Text style={styles.loadingText}>Loading Pokémon...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>No Pokémon found</Text>
                <Text style={styles.emptyHint}>Try adjusting your filters</Text>
              </View>
            }
          />
          {renderDetail()}
        </>
      )}
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
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  progressText: { fontSize: 14, color: '#DC0A2D', fontWeight: '600', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  searchContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8F8F8', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 52 
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#1a1a1a' },
  clearButton: { fontSize: 18, color: '#999', padding: 4 },
  voiceButton: { width: 52, height: 52 },
  
  typeFilterContainer: { marginBottom: 12 },
  typeFilterContent: { paddingRight: 20 },
  typeFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F8F8F8',
  },
  typeFilterButtonActive: {
    backgroundColor: '#DC0A2D',
  },
  typeFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  typeFilterTextActive: {
    color: '#fff',
  },

  filterRow: { flexDirection: 'row', gap: 12 },
  filterButton: { 
    flex: 1, 
    backgroundColor: '#F8F8F8', 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  filterButtonActive: { backgroundColor: '#DC0A2D' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  filterTextActive: { color: '#fff' },
  
  sortButton: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  listContent: { padding: 16 },
  
  card: { width: CARD_WIDTH, marginBottom: 16, marginHorizontal: 8 },
  cardBackground: { 
    borderRadius: 20, 
    overflow: 'hidden', 
    backgroundColor: '#fff', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 3 
  },
  cardUncaught: { opacity: 0.6 },
  cardHeader: { 
    paddingHorizontal: 12, 
    paddingTop: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  pokemonId: { fontSize: 12, fontWeight: 'bold' },
  caughtBadge: { fontSize: 16, color: '#4CAF50' },
  imageWrapper: { alignItems: 'center', justifyContent: 'center', height: 100 },
  imageBg: { position: 'absolute', width: 80, height: 80, borderRadius: 40 },
  pokemonImage: { width: 90, height: 90, zIndex: 1 },
  uncaughtImage: { tintColor: '#000', opacity: 0.3 },
  noImage: { fontSize: 48, color: '#ccc' },
  cardFooter: { paddingHorizontal: 12, paddingVertical: 12 },
  pokemonName: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 6 },
  uncaughtText: { color: '#999' },
  typesContainer: { flexDirection: 'row', gap: 6 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  emptyHint: { fontSize: 16, color: '#666', textAlign: 'center' },
  
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  modalHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12 
  },
  backButton: {},
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  shareButton: {},
  shareText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
  modalId: { color: '#fff', fontSize: 18, opacity: 0.9 },
  caughtIndicator: { 
    backgroundColor: 'rgba(76, 175, 80, 0.9)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    marginTop: 8, 
    alignSelf: 'flex-start' 
  },
  caughtIndicatorText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  modalContent: { flex: 1 },
  detailImageContainer: { alignItems: 'center', justifyContent: 'center', height: 250, marginBottom: 20 },
  detailImage: { width: 200, height: 200 },
  detailSection: { paddingHorizontal: 20, marginBottom: 24 },
  detailLabel: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  flavorText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  detailTypeBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  detailTypeText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  physicalStats: { flexDirection: 'row', gap: 16 },
  physicalStatItem: { 
    flex: 1, 
    backgroundColor: '#F8F8F8', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  physicalStatLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  physicalStatValue: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  abilitiesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  abilityBadge: { backgroundColor: '#F8F8F8', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  abilityText: { fontSize: 14, color: '#1a1a1a', fontWeight: '600' },
  
  evolutionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  evolutionNode: {
    alignItems: 'center',
    padding: 8,
  },
  evolutionImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  evolutionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  evolutionId: {
    fontSize: 11,
    color: '#666',
  },
  evolutionArrow: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  evolutionArrowText: {
    fontSize: 24,
    color: '#DC0A2D',
    fontWeight: 'bold',
  },
  evolutionLevel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statName: { 
    width: 120, 
    fontSize: 14, 
    color: '#666', 
    textTransform: 'capitalize' 
  },
  statBarContainer: { 
    flex: 1, 
    height: 8, 
    backgroundColor: '#E0E0E0', 
    borderRadius: 4, 
    marginHorizontal: 12 
  },
  statBar: { height: '100%', borderRadius: 4 },
  statValue: { 
    width: 40, 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#1a1a1a', 
    textAlign: 'right' 
  },
});

export default PokedexScreen;