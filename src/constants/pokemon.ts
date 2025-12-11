// File: src/constants/pokemon.ts
// Centralized Pokemon-related constants (API URL, limits, type colors, etc.).

// This part is for PokeAPI base values.
export const POKE_API_BASE_URL = 'https://pokeapi.co/api/v2'; // Base URL for all PokeAPI calls.
export const POKE_API_LIMIT = 151;                            // Number of Pokémon to fetch for Kanto.
export const MAX_BASE_STAT = 255;                             // Max base stat used for stat bar calculation.

// This part is for defining colors for each Pokémon type.
export const TYPE_COLORS: { [key: string]: string } = {
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
