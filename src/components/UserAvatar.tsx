// Reusable animated Pokéball-style user avatar with red accent.

import React, { useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type UserAvatarProps = {
  label: string;        // First letter of user's name
  onPress: () => void;  // Opens menu / triggers actions
};

const UserAvatar: React.FC<UserAvatarProps> = ({ label, onPress }) => {
  // This part is for the press animation (scale + tilt).
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    // Small bounce + tilt
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.88,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onPress(); // This part triggers the dropdown toggle / logout logic
  };

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '16deg'], // a bit more tilt so it's noticeable
  });

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Animated.View
        style={[
          styles.avatarWrapper,
          {
            transform: [{ scale }, { rotate: spin }],
          },
        ]}
      >
        {/* Outer glow ring */}
        <View style={styles.outerRing}>
          {/* Main Pokéball circle */}
          <View style={styles.pokeball}>
            {/* Top red half */}
            <View style={styles.pokeballTop} />
            {/* Bottom white half */}
            <View style={styles.pokeballBottom} />
            {/* Black horizontal band */}
            <View style={styles.pokeballBand} />
            {/* Center button */}
            <View style={styles.centerOuter}>
              <View style={styles.centerInner} />
            </View>

            {/* Initial in the center (on top of ball) */}
            <View style={styles.initialContainer}>
              <Text style={styles.initialText}>{label}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const AVATAR_SIZE = 52;
const BALL_SIZE = 46;

const styles = StyleSheet.create({
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  outerRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#FEEAED',           // soft red glow background
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC0A2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  pokeball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },

  pokeballTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BALL_SIZE / 2,
    backgroundColor: '#DC0A2D', // red accent
  },

  pokeballBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BALL_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },

  pokeballBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: BALL_SIZE / 2 - 2,
    height: 4,
    backgroundColor: '#1F1F1F',
  },

  centerOuter: {
    position: 'absolute',
    top: BALL_SIZE / 2 - 9,
    left: BALL_SIZE / 2 - 9,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#1F1F1F',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3F3F3',
  },

  initialContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default UserAvatar;
