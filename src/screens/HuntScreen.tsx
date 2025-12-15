// src/screens/HuntScreen.tsx - FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  Linking,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type PokemonSpawn = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  image: string;
  types: string[];
  distance?: number;
};

const TYPE_COLORS: { [key: string]: string } = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC',
};

const CATCH_RADIUS = 50; // meters

const HuntScreen = ({ navigation }: any) => {
  const [region, setRegion] = useState<Region>({
    latitude: 10.3157,
    longitude: 123.8854,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pokemonSpawns, setPokemonSpawns] = useState<PokemonSpawn[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonSpawn | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied' | 'blocked'>('checking');

  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    checkLocationPermission();
    return () => {
      // Cleanup watch position on unmount
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Update distances whenever user location changes
  useEffect(() => {
    if (userLocation && pokemonSpawns.length > 0) {
      updatePokemonDistances();
    }
  }, [userLocation]);

  const checkLocationPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await check(permission);

      if (result === RESULTS.GRANTED) {
        setPermissionStatus('granted');
        setLocationEnabled(true);
        startLocationTracking();
      } else if (result === RESULTS.BLOCKED) {
        setPermissionStatus('blocked');
        setLoading(false);
      } else {
        setPermissionStatus('denied');
        setLoading(false);
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setPermissionStatus('denied');
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);

      if (result === RESULTS.GRANTED) {
        setPermissionStatus('granted');
        setLocationEnabled(true);
        setLoading(true);
        startLocationTracking();
      } else if (result === RESULTS.BLOCKED) {
        setPermissionStatus('blocked');
        Alert.alert(
          'Permission Blocked',
          'Location permission is blocked. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setPermissionStatus('denied');
    }
  };

  const startLocationTracking = () => {
    console.log('Starting continuous location tracking...');
    
    // Get initial position
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Initial location:', latitude, longitude);
        
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setRegion(newRegion);
        setUserLocation({ latitude, longitude });
        generatePokemonSpawns(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        console.log('Initial location error:', error);
        setUserLocation({ latitude: region.latitude, longitude: region.longitude });
        generatePokemonSpawns(region.latitude, region.longitude);
        setLoading(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000, 
        maximumAge: 1000 
      }
    );

    // Start watching position for continuous updates
    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Location updated:', latitude, longitude);
        
        setUserLocation({ latitude, longitude });
        
        // Optional: Update map region to follow user
        // mapRef.current?.animateToRegion({
        //   latitude,
        //   longitude,
        //   latitudeDelta: 0.01,
        //   longitudeDelta: 0.01,
        // }, 1000);
      },
      (error) => {
        console.log('Watch position error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 5, // Update every 5 meters
        interval: 5000, // Update every 5 seconds
        fastestInterval: 3000,
      }
    );
  };

  const updatePokemonDistances = () => {
    if (!userLocation) return;

    const updatedSpawns = pokemonSpawns.map(pokemon => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        pokemon.latitude,
        pokemon.longitude
      );
      return { ...pokemon, distance };
    });

    setPokemonSpawns(updatedSpawns);

    // Update selected pokemon distance
    if (selectedPokemon) {
      const updatedSelected = updatedSpawns.find(p => p.id === selectedPokemon.id);
      if (updatedSelected) {
        setSelectedPokemon(updatedSelected);
      }
    }
  };

  const generatePokemonSpawns = async (centerLat: number, centerLng: number) => {
    console.log('Generating Pokemon spawns around:', centerLat, centerLng);
    
    const count = Math.floor(Math.random() * 6) + 5;
    const spawns: PokemonSpawn[] = [];
    const biomeTypes = getBiomeTypes(centerLat, centerLng);

    for (let i = 0; i < count; i++) {
      const offsetLat = (Math.random() - 0.5) * 0.008;
      const offsetLng = (Math.random() - 0.5) * 0.008;
      const pokemonId = selectPokemonByBiome(biomeTypes);
      
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        const lat = centerLat + offsetLat;
        const lng = centerLng + offsetLng;

        spawns.push({
          id: data.id,
          name: data.name,
          latitude: lat,
          longitude: lng,
          image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
          types: data.types.map((t: any) => t.type.name),
          distance: calculateDistance(centerLat, centerLng, lat, lng),
        });

        console.log(`Spawned ${data.name}`);
      } catch (error: any) {
        console.log(`Failed to fetch Pokemon ${pokemonId}:`, error.message);
      }
    }

    console.log(`Generated ${spawns.length} Pokemon spawns`);
    setPokemonSpawns(spawns);
  };

  const getBiomeTypes = (lat: number, lng: number) => {
    return ['water', 'grass', 'normal', 'flying'];
  };

  const selectPokemonByBiome = (biomes: string[]) => {
    const typeRanges: { [key: string]: number[] } = {
      water: [7, 54, 60, 72, 90, 98, 116, 120, 129, 130, 131, 134],
      grass: [1, 43, 46, 69, 102, 114],
      fire: [4, 37, 58, 77, 126, 136, 146],
      electric: [25, 26, 81, 82, 100, 101, 125, 135, 145],
      normal: [16, 19, 21, 39, 52, 83, 108, 113, 115, 128, 132, 133, 137, 143],
      flying: [16, 17, 18, 21, 22, 41, 42, 83, 84, 85, 142, 144, 145, 146],
    };

    const selectedBiome = biomes[Math.floor(Math.random() * biomes.length)];
    const availablePokemon = typeRanges[selectedBiome] || typeRanges.normal;
    
    return availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
  };

  const handleCatchPokemon = async (pokemon: PokemonSpawn) => {
    if (!userLocation) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    const distance = pokemon.distance ?? calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      pokemon.latitude,
      pokemon.longitude
    );

    if (distance > CATCH_RADIUS) {
      Alert.alert(
        'Too Far! 🚶',
        `You need to be within ${CATCH_RADIUS}m to catch ${pokemon.name}. You're ${Math.round(distance)}m away.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Save pokemon data for AR Camera
    try {
      await AsyncStorage.setItem('huntPokemon', JSON.stringify(pokemon));
      
      // Navigate to AR Camera
      navigation.navigate('AR Camera', { 
        fromHunt: true,
        pokemonId: pokemon.id 
      });
    } catch (error) {
      console.error('Error saving pokemon data:', error);
      Alert.alert('Error', 'Failed to launch AR Camera');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const refreshSpawns = () => {
    if (userLocation) {
      setPokemonSpawns([]);
      setSelectedPokemon(null);
      generatePokemonSpawns(userLocation.latitude, userLocation.longitude);
    }
  };

  // Loading State
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC0A2D" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  // Permission Denied/Blocked State
  if (!locationEnabled) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Text style={styles.title}>Hunt Mode</Text>
          <Text style={styles.subtitle}>Find Pokémon near you!</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📍</Text>
          </View>
          <Text style={styles.errorTitle}>Location Required</Text>
          <Text style={styles.description}>
            {permissionStatus === 'blocked' 
              ? 'Location permission is blocked. Please enable it in your device Settings.'
              : 'Please enable location permissions to start hunting Pokémon in your area.'
            }
          </Text>

          {permissionStatus === 'blocked' ? (
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.buttonText}>Open Settings</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.button} 
              onPress={requestLocationPermission}
            >
              <Text style={styles.buttonText}>Enable Location</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Main Map View
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.mapHeader}>
        <View>
          <Text style={styles.mapTitle}>Hunt Mode</Text>
          <Text style={styles.mapSubtitle}>
            {pokemonSpawns.length} Pokémon nearby
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshSpawns}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton
        onRegionChangeComplete={setRegion}
      >
        {/* User's catch radius */}
        {userLocation && (
          <Circle
            center={userLocation}
            radius={CATCH_RADIUS}
            strokeColor="rgba(220, 10, 45, 0.5)"
            fillColor="rgba(220, 10, 45, 0.1)"
            strokeWidth={2}
          />
        )}

        {/* Pokemon Markers */}
        {pokemonSpawns.map((pokemon, index) => (
          <Marker
            key={`${pokemon.id}-${index}`}
            coordinate={{
              latitude: pokemon.latitude,
              longitude: pokemon.longitude,
            }}
            onPress={() => setSelectedPokemon(pokemon)}
          >
            <View style={styles.markerContainer}>
              <Image
                source={{ uri: pokemon.image }}
                style={styles.markerImage}
                resizeMode="contain"
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Pokemon Detail Card */}
      {selectedPokemon && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Image
              source={{ uri: selectedPokemon.image }}
              style={styles.detailImage}
              resizeMode="contain"
            />
            <View style={styles.detailInfo}>
              <Text style={styles.detailName}>
                {selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}
              </Text>
              <Text style={styles.detailId}>#{selectedPokemon.id.toString().padStart(3, '0')}</Text>
              <View style={styles.detailTypes}>
                {selectedPokemon.types.map((type, i) => (
                  <View
                    key={i}
                    style={[
                      styles.detailTypeBadge,
                      { backgroundColor: TYPE_COLORS[type] || '#777' },
                    ]}
                  >
                    <Text style={styles.detailTypeText}>{type}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.distanceText}>
                📍 {selectedPokemon.distance ? `${Math.round(selectedPokemon.distance)}m away` : 'Calculating...'}
              </Text>
            </View>
          </View>

          <View style={styles.detailActions}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedPokemon(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.catchButton,
                selectedPokemon.distance && selectedPokemon.distance > CATCH_RADIUS && styles.catchButtonDisabled
              ]}
              onPress={() => handleCatchPokemon(selectedPokemon)}
              disabled={selectedPokemon.distance && selectedPokemon.distance > CATCH_RADIUS}
            >
              <Text style={styles.catchButtonText}>
                {selectedPokemon.distance && selectedPokemon.distance <= CATCH_RADIUS ? '📸 Catch!' : '🚶 Too Far'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>💡 Get within {CATCH_RADIUS}m to catch</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  icon: {
    fontSize: 60,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC0A2D',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#DC0A2D',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC0A2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 24,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#DC0A2D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: {
    width: 40,
    height: 40,
  },
  detailCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailImage: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  detailInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  detailId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailTypes: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  detailTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailTypeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  distanceText: {
    fontSize: 14,
    color: '#DC0A2D',
    fontWeight: '600',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  closeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  catchButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#DC0A2D',
    alignItems: 'center',
  },
  catchButtonDisabled: {
    backgroundColor: '#999',
  },
  catchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  legend: {
    position: 'absolute',
    top: 90,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendText: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '600',
  },
});

export default HuntScreen;