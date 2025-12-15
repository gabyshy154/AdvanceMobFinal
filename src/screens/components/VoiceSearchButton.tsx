// src/screens/components/VoiceSearchButton.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import Voice from '@react-native-voice/voice';

type VoiceSearchButtonProps = {
  onResult: (text: string) => void;
  style?: object;
};

const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({ onResult, style }) => {
  const [isListening, setIsListening] = useState(false);

  React.useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (e) => {
      if (e.value?.[0]) {
        onResult(e.value[0]);
      }
    };
    Voice.onSpeechError = (e) => {
      console.log('Voice error:', e);
      setIsListening(false);
      Alert.alert('Voice Error', 'Failed to recognize speech');
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startVoiceRecognition = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        return;
      }
      await Voice.start('en-US');
    } catch (error) {
      console.log('Voice start error:', error);
      Alert.alert('Voice Error', 'Failed to start voice recognition');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isListening && styles.buttonActive, style]}
      onPress={startVoiceRecognition}
    >
      <Text style={styles.icon}>{isListening ? '🎙️' : '🎤'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC0A2D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: '#FF1744',
  },
  icon: {
    fontSize: 28,
  },
});

export default VoiceSearchButton;