import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import UserAvatar from '../components/UserAvatar';


const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ===== Pokémon type colors =====
const TYPE_COLORS: { [key: string]: string } = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

// ===== Local Pokémon type =====
type Pokemon = {
  id: number;
  name: string;
  image: string;
  types: string[];
  height?: number;
  weight?: number;
  abilities?: string[];
  stats?: { name: string; value: number }[];
  description?: string;
};

const CaughtPoke = () => {
  // ===== Auth user =====
  const user = auth().currentUser;

  // ===== Profile menu state (avatar dropdown) =====
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ===== Pokedex state =====
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [filtered, setFiltered] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ===== Caught state (local to this screen) =====
  const [caughtIds, setCaughtIds] = useState<number[]>([]);

  // ===== Fetch base list once =====
  useEffect(() => {
    fetchPokemon();
  }, []);

  // ===== Filter ONLY caught Pokémon + search =====
  useEffect(() => {
    // Start from only caught Pokémon
    let baseList = pokemon.filter(p => caughtIds.includes(p.id));

    if (search.trim()) {
      const query = search.toLowerCase();
      baseList = baseList.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.id.toString().includes(search),
      );
    }

    setFiltered(baseList);
  }, [search, pokemon, caughtIds]);

  // ===== Fetch list of first 151 Pokémon =====
  const fetchPokemon = async () => {
    try {
      const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
      const data = await res.json();

      const details: Pokemon[] = await Promise.all(
        data.results.map(async (p: any) => {
          const r = await fetch(p.url);
          const d = await r.json();

          return {
            id: d.id,
            name: d.name,
            image:
              d.sprites?.other?.['official-artwork']?.front_default ||
              d.sprites?.front_default,
            types: d.types.map((t: any) => t.type.name),
          };
        }),
      );

      setPokemon(details);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching Pokémon list:', e);
      setLoading(false);
    }
  };

  // ===== Fetch full details for modal =====
  const fetchPokemonDetails = async (id: number) => {
    setDetailLoading(true);

    try {
      const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const pokemonData = await pokemonRes.json();

      const speciesRes = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${id}`,
      );
      const speciesData = await speciesRes.json();

      const flavorText = speciesData.flavor_text_entries.find(
        (entry: any) => entry.language.name === 'en',
      );

      const detailedPokemon: Pokemon = {
        id: pokemonData.id,
        name: pokemonData.name,
        image:
          pokemonData.sprites?.other?.['official-artwork']?.front_default ||
          pokemonData.sprites?.front_default,
        types: pokemonData.types.map((t: any) => t.type.name),
        height: pokemonData.height / 10,
        weight: pokemonData.weight / 10,
        abilities: pokemonData.abilities.map((a: any) =>
          a.ability.name.replace('-', ' '),
        ),
        stats: pokemonData.stats.map((s: any) => ({
          name: s.stat.name,
          value: s.base_stat,
        })),
        description:
          flavorText?.flavor_text.replace(/\f/g, ' ') ||
          'No description available.',
      };

      setSelectedPokemon(detailedPokemon);
    } catch (e) {
      console.error('Error fetching Pokémon details:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  // ===== Handlers =====
  const handlePokemonPress = (poke: Pokemon) => {
    fetchPokemonDetails(poke.id);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    auth().signOut();
  };

  const isPokemonCaught = (id: number) => caughtIds.includes(id);

  const handleToggleCaught = (poke: Pokemon) => {
    setCaughtIds(prev =>
      prev.includes(poke.id)
        ? prev.filter(pid => pid !== poke.id)
        : [...prev, poke.id],
    );
  };

  // ===== Render helpers =====
  const renderItem = ({ item }: { item: Pokemon }) => {
    const primaryType = item.types[0];
    const bgColor = TYPE_COLORS[primaryType] || '#A8A878';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handlePokemonPress(item)}
      >
        <View
          style={[
            styles.cardBackground,
            { backgroundColor: bgColor + '20' },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.pokemonId, { color: bgColor }]}>
              #{item.id.toString().padStart(3, '0')}
            </Text>
          </View>

          <View style={styles.imageWrapper}>
            <View
              style={[styles.imageBg, { backgroundColor: bgColor + '15' }]}
            />
            <Image
              source={{ uri: item.image }}
              style={styles.pokemonImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.pokemonName} numberOfLines={1}>
              {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
            </Text>

            <View style={styles.typesContainer}>
              {item.types.slice(0, 2).map((type, i) => (
                <View
                  key={i}
                  style={[
                    styles.typeBadge,
                    { backgroundColor: TYPE_COLORS[type] || '#777' },
                  ]}
                >
                  <Text style={styles.typeText}>{type}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatBar = (statName: string, value: number) => {
    const maxStat = 255;
    const percentage = (value / maxStat) * 100;
    const statColor =
      value > 100 ? '#4CAF50' : value > 50 ? '#FFC107' : '#FF5722';

    return (
      <View style={styles.statRow} key={statName}>
        <Text style={styles.statName}>{statName.toUpperCase()}</Text>
        <View style={styles.statBarContainer}>
          <View
            style={[
              styles.statBarFill,
              { width: `${percentage}%`, backgroundColor: statColor },
            ]}
          />
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    );
  };

  // ===== Render =====
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header with avatar + menu + stats + static tabs + search */}
      <View style={styles.header}>
        {/* Greeting + avatar */}
<View style={styles.headerTop}>
  <View>
    <Text style={styles.greeting}>Welcome back,</Text>
    <Text style={styles.userName}>{user?.displayName || 'Trainer'}</Text>
  </View>

  <UserAvatar
    label={(user?.displayName || 'T').charAt(0).toUpperCase()} // user initial
    onPress={() => setIsMenuOpen(prev => !prev)}               // toggle dropdown
  />
</View>


        {/* Avatar dropdown menu */}
        {isMenuOpen && (
          <View style={styles.profileMenu}>
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={() => setIsMenuOpen(false)} // Edit Profile (static for now)
            >
              <Text style={styles.profileMenuItemText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={handleLogout}
            >
              <Text style={[styles.profileMenuItemText, styles.logoutText]}>
                Log out
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{caughtIds.length}</Text>
            <Text style={styles.statLabel}>Caught</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>151</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {Math.round((caughtIds.length / 151) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>

        {/* Tabs – visually highlight Caught here (no navigation yet) */}
        <View style={styles.viewToggleRow}>
          <View style={styles.viewToggleButton}>
            <Text style={styles.viewToggleText}>All</Text>
          </View>
          <View style={[styles.viewToggleButton, styles.viewToggleButtonActive]}>
            <Text
              style={[styles.viewToggleText, styles.viewToggleTextActive]}
            >
              Caught
            </Text>
          </View>
          <View style={styles.viewToggleButton}>
            <Text style={styles.viewToggleText}>Missing</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrapper}>
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
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Content: list of caught Pokémon (or empty state) */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC0A2D" />
          <Text style={styles.loadingText}>Loading Pokémon...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No caught Pokémon yet</Text>
              <Text style={styles.emptySubtext}>
                Mark some Pokémon as caught to see them here
              </Text>
            </View>
          }
        />
      )}

      {/* Detail modal */}
      <Modal
        visible={selectedPokemon !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPokemon(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {detailLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#DC0A2D" />
                <Text style={styles.loadingText}>Loading details...</Text>
              </View>
            ) : selectedPokemon ? (
              <>
                {/* Header */}
                <View
                  style={[
                    styles.modalHeader,
                    {
                      backgroundColor:
                        TYPE_COLORS[selectedPokemon.types[0]] || '#A8A878',
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedPokemon(null)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>

                  <Image
                    source={{ uri: selectedPokemon.image }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />

                  <Text style={styles.modalPokemonName}>
                    {selectedPokemon.name.charAt(0).toUpperCase() +
                      selectedPokemon.name.slice(1)}
                  </Text>
                  <Text style={styles.modalPokemonId}>
                    #{selectedPokemon.id.toString().padStart(3, '0')}
                  </Text>

                  <View style={styles.modalTypes}>
                    {selectedPokemon.types.map((type, i) => (
                      <View key={i} style={styles.modalTypeBadge}>
                        <Text style={styles.modalTypeText}>{type}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Caught toggle */}
                <View style={styles.caughtButtonWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.caughtButton,
                      isPokemonCaught(selectedPokemon.id) &&
                        styles.caughtButtonActive,
                    ]}
                    onPress={() => handleToggleCaught(selectedPokemon)}
                  >
                    <Text
                      style={[
                        styles.caughtButtonText,
                        isPokemonCaught(selectedPokemon.id) &&
                          styles.caughtButtonTextActive,
                      ]}
                    >
                      {isPokemonCaught(selectedPokemon.id)
                        ? 'Mark as Missing'
                        : 'Mark as Caught'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Body */}
                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.description}>
                      {selectedPokemon.description}
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Physical Stats</Text>
                    <View style={styles.physicalStats}>
                      <View style={styles.physicalStatItem}>
                        <Text style={styles.physicalStatLabel}>Height</Text>
                        <Text style={styles.physicalStatValue}>
                          {selectedPokemon.height} m
                        </Text>
                      </View>
                      <View style={styles.physicalStatDivider} />
                      <View style={styles.physicalStatItem}>
                        <Text style={styles.physicalStatLabel}>Weight</Text>
                        <Text style={styles.physicalStatValue}>
                          {selectedPokemon.weight} kg
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Abilities</Text>
                    <View style={styles.abilitiesContainer}>
                      {selectedPokemon.abilities?.map((ability, i) => (
                        <View key={i} style={styles.abilityBadge}>
                          <Text style={styles.abilityText}>
                            {ability.charAt(0).toUpperCase() +
                              ability.slice(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Base Stats</Text>
                    {selectedPokemon.stats?.map(stat =>
                      renderStatBar(stat.name, stat.value),
                    )}
                  </View>
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ===== Styles (same as HomeScreen, reused) =====
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: { fontSize: 14, color: '#666', marginBottom: 2 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC0A2D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC0A2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  profileMenu: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 20,
  },
  profileMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  profileMenuItemText: {
    fontSize: 14,
    color: '#333',
  },
  logoutText: {
    color: '#DC0A2D',
    fontWeight: '600',
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC0A2D',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  viewToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  viewToggleButtonActive: {
    borderColor: '#DC0A2D',
    backgroundColor: '#FDECEF',
  },
  viewToggleText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  viewToggleTextActive: {
    color: '#DC0A2D',
  },

  searchWrapper: { paddingHorizontal: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#1a1a1a' },
  clearIcon: { fontSize: 18, color: '#999', paddingHorizontal: 8 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#666', marginTop: 12, fontSize: 16 },

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
    elevation: 3,
  },
  cardHeader: { paddingHorizontal: 12, paddingTop: 12, alignItems: 'flex-end' },
  pokemonId: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    position: 'relative',
  },
  imageBg: { position: 'absolute', width: 80, height: 80, borderRadius: 40 },
  pokemonImage: { width: 90, height: 90, zIndex: 1 },
  cardFooter: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pokemonName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  typesContainer: { flexDirection: 'row', gap: 6 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  emptySubtext: { fontSize: 14, color: '#999' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    overflow: 'hidden',
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalImage: {
    width: 180,
    height: 180,
    marginBottom: 12,
  },
  modalPokemonName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  modalPokemonId: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  modalTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  modalTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  caughtButtonWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  caughtButton: {
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC0A2D',
    backgroundColor: '#FFFFFF',
  },
  caughtButtonActive: {
    backgroundColor: '#DC0A2D',
  },
  caughtButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC0A2D',
  },
  caughtButtonTextActive: {
    color: '#FFFFFF',
  },

  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#666',
  },
  physicalStats: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
  },
  physicalStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  physicalStatDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 16,
  },
  physicalStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  physicalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  abilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  abilityBadge: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  abilityText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    width: 60,
    textTransform: 'uppercase',
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    width: 40,
    textAlign: 'right',
  },
});

export default CaughtPoke;
