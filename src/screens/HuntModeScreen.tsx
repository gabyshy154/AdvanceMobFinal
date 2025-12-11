// Simple Hunt Mode:
// - Shows a random wild Pokémon (1–151) from the API
// - "Catch" → increments local caught counter and shows next Pokémon
// - "Run" → skips to next Pokémon
// - Back button to return to Home

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Pokemon = {
  id: number;
  name: string;
  image: string;
  types: string[];
};

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

const getRandomId = () => Math.floor(Math.random() * 151) + 1;

const HuntModeScreen = () => {
  const navigation = useNavigation<any>();

  const [current, setCurrent] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caughtCount, setCaughtCount] = useState(0);
  const [lastCaught, setLastCaught] = useState<Pokemon[]>([]);

  const loadRandomPokemon = async () => {
    setLoading(true);
    setError(null);
    try {
      const id = getRandomId();
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await res.json();

      const poke: Pokemon = {
        id: data.id,
        name: data.name,
        image:
          data.sprites?.other?.['official-artwork']?.front_default ||
          data.sprites?.front_default,
        types: data.types.map((t: any) => t.type.name),
      };

      setCurrent(poke);
    } catch (e) {
      console.error('Error loading hunt Pokémon:', e);
      setError(
        'Failed to find a wild Pokémon. Check your internet connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRandomPokemon();
  }, []);

  const handleCatch = () => {
    if (!current) return;
    setCaughtCount(c => c + 1);
    setLastCaught(prev => [current, ...prev].slice(0, 5)); // keep last 5 recent
    loadRandomPokemon();
  };

  const handleRun = () => {
    loadRandomPokemon();
  };

  const primaryType = current?.types?.[0];
  const mainColor = primaryType ? TYPE_COLORS[primaryType] || '#DC0A2D' : '#DC0A2D';

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
            <Text style={styles.headerTitle}>Hunt Mode</Text>
            <Text style={styles.headerSubtitle}>
              Search the wild and try to catch Pokémon
            </Text>
          </View>
        </View>

        <View style={styles.huntStatsRow}>
          <View style={styles.huntStatBox}>
            <Text style={styles.huntStatNumber}>{caughtCount}</Text>
            <Text style={styles.huntStatLabel}>Caught this session</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && !current ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC0A2D" />
            <Text style={styles.loadingText}>Looking for wild Pokémon...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity onPress={loadRandomPokemon}>
              <Text style={styles.retryButton}>Tap here to retry</Text>
            </TouchableOpacity>
          </View>
        ) : current ? (
          <>
            {/* Encounter card */}
            <View style={[styles.encounterCard, { borderColor: mainColor }]}>
              <Text style={styles.encounterLabel}>A wild</Text>
              <Text style={[styles.encounterName, { color: mainColor }]}>
                {current.name.charAt(0).toUpperCase() + current.name.slice(1)}
              </Text>

              <View style={styles.encounterImageWrapper}>
                <View
                  style={[
                    styles.encounterImageBg,
                    { backgroundColor: mainColor + '22' },
                  ]}
                />
                {current.image ? (
                  <Image
                    source={{ uri: current.image }}
                    style={styles.encounterImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.noImageText}>No image</Text>
                )}
              </View>

              <View style={styles.typeRow}>
                {current.types.map((type, idx) => (
                  <View
                    key={idx}
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

            {/* Action buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.runButton]}
                onPress={handleRun}
                activeOpacity={0.8}
              >
                <Text style={styles.runButtonText}>Run</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.catchButton]}
                onPress={handleCatch}
                activeOpacity={0.8}
              >
                <Text style={styles.catchButtonText}>Catch</Text>
              </TouchableOpacity>
            </View>

            {/* Last caught list (simple preview) */}
            {lastCaught.length > 0 && (
              <View style={styles.lastCaughtSection}>
                <Text style={styles.lastCaughtTitle}>Recently caught</Text>
                <View style={styles.lastCaughtRow}>
                  {lastCaught.map(p => (
                    <View key={p.id} style={styles.lastCaughtItem}>
                      {p.image ? (
                        <Image
                          source={{ uri: p.image }}
                          style={styles.lastCaughtImage}
                          resizeMode="contain"
                        />
                      ) : null}
                      <Text style={styles.lastCaughtName} numberOfLines={1}>
                        {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : null}
      </View>
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

  huntStatsRow: {
    marginTop: 16,
    flexDirection: 'row',
  },
  huntStatBox: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  huntStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC0A2D',
    marginBottom: 2,
  },
  huntStatLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  errorContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC0A2D',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC0A2D',
    textDecorationLine: 'underline',
  },

  encounterCard: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginBottom: 20,
  },
  encounterLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 4,
  },
  encounterName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  encounterImageWrapper: {
    width: 180,
    height: 180,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  encounterImageBg: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  encounterImage: {
    width: 160,
    height: 160,
    zIndex: 1,
  },
  noImageText: {
    color: '#999',
  },

  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  catchButton: {
    backgroundColor: '#DC0A2D',
  },
  runButtonText: {
    color: '#444',
    fontSize: 15,
    fontWeight: '600',
  },
  catchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  lastCaughtSection: {
    marginTop: 8,
  },
  lastCaughtTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  lastCaughtRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  lastCaughtItem: {
    width: 70,
    alignItems: 'center',
  },
  lastCaughtImage: {
    width: 52,
    height: 52,
  },
  lastCaughtName: {
    fontSize: 11,
    color: '#444',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default HuntModeScreen;
