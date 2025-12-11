// Card component for a single Pokémon (used in grids on Home / Caught / Missing).

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { TYPE_COLORS } from '../../constants/pokemon';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// This part is for describing the Pokémon shape used by this card.
export type PokemonCardData = {
  id: number;
  name: string;
  image: string;
  types: string[];
};

type Props = {
  pokemon: PokemonCardData; // Data for one Pokémon.
  onPress: () => void;      // Function when card is tapped.
};

const PokemonCard: React.FC<Props> = ({ pokemon, onPress }) => {
  const primaryType = pokemon.types[0];
  const bgColor = TYPE_COLORS[primaryType] || '#A8A878';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress} // This part opens the detail when pressed.
    >
      <View
        style={[
          styles.cardBackground,
          { backgroundColor: bgColor + '20' }, // Light tint based on type.
        ]}
      >
        {/* Top-right ID */}
        <View style={styles.cardHeader}>
          <Text style={[styles.pokemonId, { color: bgColor }]}>
            #{pokemon.id.toString().padStart(3, '0')}
          </Text>
        </View>

        {/* Image area */}
        <View style={styles.imageWrapper}>
          <View
            style={[styles.imageBg, { backgroundColor: bgColor + '15' }]} // Faint circle behind Pokémon.
          />
          <Image
            source={{ uri: pokemon.image }}
            style={styles.pokemonImage}
            resizeMode="contain"
          />
        </View>

        {/* Name + types */}
        <View style={styles.cardFooter}>
          <Text style={styles.pokemonName} numberOfLines={1}>
            {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
          </Text>

          <View style={styles.typesContainer}>
            {pokemon.types.slice(0, 2).map((type, i) => (
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

const styles = StyleSheet.create({
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
});

export default PokemonCard;
