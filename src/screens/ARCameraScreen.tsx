// src/screens/ARCameraScreen.tsx - ENHANCED WITH HUNT INTEGRATION
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type PokemonOverlay = {
  id: number;
  name: string;
  image: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

type CapturedPhoto = {
  id: string;
  uri: string;
  timestamp: number;
  pokemon?: string;
  pokemonId?: number;
  userId: string;
};

const ARCameraScreen = ({ route, navigation }: any) => {
  const [pokemonOverlay, setPokemonOverlay] = useState<PokemonOverlay | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const [fromHunt, setFromHunt] = useState(false);

  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice(cameraPosition);
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
  const user = auth().currentUser;

  useEffect(() => {
    checkAndRequestPermissions();
    loadCapturedPhotos();
    checkHuntPokemon();
  }, []);

  const checkHuntPokemon = async () => {
    try {
      // Check if we came from Hunt Screen
      const huntData = await AsyncStorage.getItem('huntPokemon');
      if (huntData) {
        const pokemon = JSON.parse(huntData);
        setFromHunt(true);
        await spawnPokemonById(pokemon.id);
        // Clear the data
        await AsyncStorage.removeItem('huntPokemon');
      }
    } catch (error) {
      console.error('Error loading hunt pokemon:', error);
    }
  };

  const checkAndRequestPermissions = async () => {
    if (!hasCameraPermission) {
      const cameraGranted = await requestCameraPermission();
      if (!cameraGranted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to use AR features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    }

    if (!hasMicPermission) {
      await requestMicPermission();
    }
  };

  const loadCapturedPhotos = async () => {
    if (!user) return;

    try {
      const cached = await AsyncStorage.getItem(`photos_${user.uid}`);
      if (cached) {
        setCapturedPhotos(JSON.parse(cached));
      }

      const snapshot = await firestore()
        .collection('captures')
        .where('userId', '==', user.uid)
        .limit(50)
        .get();

      if (!snapshot.empty) {
        let photos = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as CapturedPhoto),
        );
        photos = photos.sort((a, b) => b.timestamp - a.timestamp);
        setCapturedPhotos(photos);
        await AsyncStorage.setItem(`photos_${user.uid}`, JSON.stringify(photos));
      }
    } catch (error: any) {
      console.log('Error loading photos:', error.message);
    }
  };

  const spawnRandomPokemon = async () => {
    if (isLoading || fromHunt) return;
    setIsLoading(true);
    const randomId = Math.floor(Math.random() * 151) + 1;
    await spawnPokemonById(randomId);
    setIsLoading(false);
  };

  const spawnPokemonById = async (id: number) => {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();

      setPokemonOverlay({
        id: data.id,
        name: data.name,
        image:
          data.sprites.other['official-artwork'].front_default ||
          data.sprites.front_default,
        x: width / 2 - 75,
        y: height / 2 - 150,
        scale: 1,
        rotation: 0,
      });
    } catch (error: any) {
      console.log('Error spawning pokemon:', error.message);
      Alert.alert('Error', 'Failed to load Pokémon. Please try again.');
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || !user) {
      Alert.alert('Error', 'Camera not ready or user not logged in');
      return;
    }

    if (!hasCameraPermission) {
      Alert.alert('Permission Required', 'Camera permission is needed to capture photos');
      await checkAndRequestPermissions();
      return;
    }

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: flashMode,
        qualityPrioritization: 'balanced',
      });

      const uri = `file://${photo.path}`;

      const photoDoc = {
        uri,
        timestamp: Date.now(),
        pokemon: pokemonOverlay?.name || null,
        pokemonId: pokemonOverlay?.id || null,
        userId: user.uid,
      };

      const docRef = await firestore().collection('captures').add(photoDoc);

      const newPhoto: CapturedPhoto = { id: docRef.id, ...photoDoc };
      const updated = [newPhoto, ...capturedPhotos];

      setCapturedPhotos(updated);
      await AsyncStorage.setItem(`photos_${user.uid}`, JSON.stringify(updated));

      if (pokemonOverlay) {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('caught')
          .doc(pokemonOverlay.id.toString())
          .set(
            {
              pokemonId: pokemonOverlay.id,
              pokemonName: pokemonOverlay.name,
              caughtAt: firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      }

      // Show success dialog
      showSuccessDialog();
    } catch (error: any) {
      console.log('Error capturing photo:', error.message);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const showSuccessDialog = () => {
    Alert.alert(
      '🎉 Pokémon Caught!',
      `You successfully caught ${pokemonOverlay?.name.charAt(0).toUpperCase() + pokemonOverlay?.name.slice(1)}!`,
      [
        {
          text: 'View Pokédex',
          onPress: () => {
            setPokemonOverlay(null);
            setFromHunt(false);
            navigation.navigate('Pokedex');
          }
        },
        {
          text: fromHunt ? 'Back to Hunt' : 'Continue',
          onPress: () => {
            setPokemonOverlay(null);
            if (fromHunt) {
              setFromHunt(false);
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  const toggleGallery = () => {
    setShowGallery(!showGallery);
  };

  const renderGalleryItem = ({ item }: { item: CapturedPhoto }) => (
    <View style={styles.galleryItem}>
      <Image source={{ uri: item.uri }} style={styles.galleryImage} />
      {item.pokemon && (
        <View style={styles.galleryOverlay}>
          <Text style={styles.galleryPokemonName}>
            {item.pokemon.toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );

  if (hasCameraPermission === undefined) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#DC0A2D" />
        <Text style={styles.permissionTitle}>Checking permissions...</Text>
      </View>
    );
  }

  if (!hasCameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          Enable camera access to use AR features and catch Pokémon!
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={checkAndRequestPermissions}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#DC0A2D" />
        <Text style={styles.permissionTitle}>Initializing camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!showGallery}
        photo={true}
      />

      {pokemonOverlay && (
        <View
          style={[
            styles.pokemonOverlay,
            {
              left: pokemonOverlay.x,
              top: pokemonOverlay.y,
              transform: [
                { rotate: `${pokemonOverlay.rotation}deg` },
                { scale: pokemonOverlay.scale },
              ],
            },
          ]}
        >
          <Image source={{ uri: pokemonOverlay.image }} style={styles.pokemonImage} />
        </View>
      )}

      {/* Back Button (if from Hunt) */}
      {fromHunt && (
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            setFromHunt(false);
            setPokemonOverlay(null);
            navigation.goBack();
          }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      )}

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity 
          style={styles.topButton}
          onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')}
        >
          <Text style={styles.controlText}>{flashMode === 'off' ? '🔦' : '💡'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topButton}
          onPress={toggleGallery}
        >
          <Text style={styles.controlText}>🖼️</Text>
          {capturedPhotos.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{capturedPhotos.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          onPress={spawnRandomPokemon} 
          disabled={isLoading || fromHunt}
          style={[styles.sideButton, (isLoading || fromHunt) && styles.disabledButton]}
        >
          <Text style={styles.controlText}>
            {fromHunt ? '🔒' : (isLoading ? '⏳' : '⚡')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.captureButton} 
          onPress={capturePhoto}
          disabled={!hasCameraPermission || !pokemonOverlay}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setCameraPosition(cameraPosition === 'back' ? 'front' : 'back')}
          style={styles.sideButton}
        >
          <Text style={styles.controlText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      {pokemonOverlay && (
        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>
            ⚡ {pokemonOverlay.name.toUpperCase()} appeared!
          </Text>
          <Text style={styles.instructionSubtext}>
            {fromHunt ? 'Tap capture to catch it!' : 'Position and capture!'}
          </Text>
        </View>
      )}

      {/* Gallery Modal */}
      <Modal
        visible={showGallery}
        animationType="slide"
        onRequestClose={toggleGallery}
      >
        <View style={styles.galleryContainer}>
          <View style={styles.galleryHeader}>
            <Text style={styles.galleryTitle}>My Captures</Text>
            <TouchableOpacity onPress={toggleGallery}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {capturedPhotos.length === 0 ? (
            <View style={styles.emptyGallery}>
              <Text style={styles.emptyIcon}>📸</Text>
              <Text style={styles.emptyText}>No captures yet</Text>
              <Text style={styles.emptyHint}>Spawn a Pokémon and capture it!</Text>
            </View>
          ) : (
            <FlatList
              data={capturedPhotos}
              renderItem={renderGalleryItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.galleryList}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 32,
  },
  permissionIcon: { fontSize: 80, marginBottom: 16 },
  permissionTitle: { 
    fontSize: 22, 
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#DC0A2D',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  settingsButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  settingsButtonText: {
    color: '#DC0A2D',
    fontWeight: '600',
    fontSize: 16,
  },
  pokemonOverlay: {
    position: 'absolute',
    width: 150,
    height: 150,
  },
  pokemonImage: {
    width: '100%',
    height: '100%',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sideButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
  },
  controlText: { 
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  instructionCard: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 120 : 140,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(220, 10, 45, 0.95)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instructionSubtext: {
    color: '#fff',
    fontSize: 14,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC0A2D',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  galleryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: 'bold',
  },
  galleryList: {
    padding: 8,
  },
  galleryItem: {
    flex: 1,
    margin: 8,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(220, 10, 45, 0.9)',
    padding: 8,
  },
  galleryPokemonName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyGallery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ARCameraScreen;