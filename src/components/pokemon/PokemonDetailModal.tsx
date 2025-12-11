// Modal for detailed Pokémon info:
// - Shows description, physical stats, abilities, base stats
// - Lets user mark as Caught / Missing.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { TYPE_COLORS, MAX_BASE_STAT } from '../../constants/pokemon';

const { height } = Dimensions.get('window');

// This part is for describing the detailed Pokémon object.
export type PokemonDetail = {
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

type Props = {
  visible: boolean;                    // This part controls if modal is open.
  loading: boolean;                    // This part shows loading state.
  pokemon: PokemonDetail | null;       // Detailed Pokémon data.
  isCaught: (id: number) => boolean;   // Checks if Pokémon is caught.
  onToggleCaught: (poke: PokemonDetail) => void; // Toggles caught / missing.
  onClose: () => void;                 // Closes the modal.
};

// Helper for rendering a single stat bar.
const renderStatBar = (statName: string, value: number) => {
  const percentage = (value / MAX_BASE_STAT) * 100;
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

const PokemonDetailModal: React.FC<Props> = ({
  visible,
  loading,
  pokemon,
  isCaught,
  onToggleCaught,
  onClose,
}) => {
  const primaryType = pokemon?.types?.[0];
  const headerColor = primaryType
    ? TYPE_COLORS[primaryType] || '#A8A878'
    : '#A8A878';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {loading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#DC0A2D" />
              <Text style={styles.loadingText}>Loading details...</Text>
            </View>
          ) : pokemon ? (
            <>
              {/* Modal Header */}
              <View
                style={[
                  styles.modalHeader,
                  {
                    backgroundColor: headerColor,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                <Image
                  source={{ uri: pokemon.image }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />

                <Text style={styles.modalPokemonName}>
                  {pokemon.name.charAt(0).toUpperCase() +
                    pokemon.name.slice(1)}
                </Text>
                <Text style={styles.modalPokemonId}>
                  #{pokemon.id.toString().padStart(3, '0')}
                </Text>

                <View style={styles.modalTypes}>
                  {pokemon.types.map((type, i) => (
                    <View key={i} style={styles.modalTypeBadge}>
                      <Text style={styles.modalTypeText}>{type}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Toggle caught status from detail view */}
              <View style={styles.caughtButtonWrapper}>
                <TouchableOpacity
                  style={[
                    styles.caughtButton,
                    isCaught(pokemon.id) && styles.caughtButtonActive,
                  ]}
                  onPress={() => onToggleCaught(pokemon)}
                >
                  <Text
                    style={[
                      styles.caughtButtonText,
                      isCaught(pokemon.id) && styles.caughtButtonTextActive,
                    ]}
                  >
                    {isCaught(pokemon.id) ? 'Mark as Missing' : 'Mark as Caught'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                {/* Description */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.description}>
                    {pokemon.description}
                  </Text>
                </View>

                {/* Physical Stats */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Physical Stats</Text>
                  <View style={styles.physicalStats}>
                    <View style={styles.physicalStatItem}>
                      <Text style={styles.physicalStatLabel}>Height</Text>
                      <Text style={styles.physicalStatValue}>
                        {pokemon.height} m
                      </Text>
                    </View>
                    <View style={styles.physicalStatDivider} />
                    <View style={styles.physicalStatItem}>
                      <Text style={styles.physicalStatLabel}>Weight</Text>
                      <Text style={styles.physicalStatValue}>
                        {pokemon.weight} kg
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Abilities */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Abilities</Text>
                  <View style={styles.abilitiesContainer}>
                    {pokemon.abilities?.map((ability, i) => (
                      <View key={i} style={styles.abilityBadge}>
                        <Text style={styles.abilityText}>
                          {ability.charAt(0).toUpperCase() + ability.slice(1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Base Stats */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Base Stats</Text>
                  {pokemon.stats?.map(stat =>
                    renderStatBar(stat.name, stat.value),
                  )}
                </View>
              </ScrollView>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  loadingText: { color: '#666', marginTop: 12, fontSize: 16 },

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

export default PokemonDetailModal;
