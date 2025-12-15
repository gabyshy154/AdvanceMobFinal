// src/screens/SignUpScreen.tsx
import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import auth from "@react-native-firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Signup">;

export default function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async () => {
    // Input validation
    if (!email.trim()) {
      setErrorMsg("Please enter your email");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter a password");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await auth().createUserWithEmailAndPassword(email.trim(), password);
      // Navigation is handled automatically by onAuthStateChanged in App.tsx
    } catch (error: any) {
      console.log("Signup error:", error);
      
      // Handle specific Firebase errors
      let message = "Signup failed. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Try logging in instead.";
      } else if (error.code === 'auth/invalid-email') {
        message = "Invalid email address format.";
      } else if (error.code === 'auth/weak-password') {
        message = "Password is too weak. Use at least 6 characters.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "Network error. Please check your connection.";
      } else if (error.code === 'auth/operation-not-allowed') {
        message = "Email/password accounts are not enabled. Please contact support.";
      }
      
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>⚡</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the adventure!</Text>
        </View>

        {errorMsg.length > 0 && (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{errorMsg}</Text>
          </View>
        )}

        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrorMsg("");
          }}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          disabled={loading}
        />

        <TextInput
          label="Password"
          mode="outlined"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrorMsg("");
          }}
          style={styles.input}
          autoCapitalize="none"
          disabled={loading}
        />

        <TextInput
          label="Confirm Password"
          mode="outlined"
          secureTextEntry
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setErrorMsg("");
          }}
          style={styles.input}
          autoCapitalize="none"
          disabled={loading}
        />

        <Button 
          mode="contained" 
          onPress={handleSignup}
          loading={loading}
          disabled={loading}
          style={styles.signupButton}
          buttonColor="#DC0A2D"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>

        <Button 
          onPress={() => navigation.goBack()}
          disabled={loading}
          style={styles.backButton}
        >
          Back to Login
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' 
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center", 
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  input: { 
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#DC0A2D',
  },
  error: { 
    color: '#DC0A2D', 
    fontSize: 14,
  },
  signupButton: {
    marginTop: 10,
    paddingVertical: 6,
  },
  backButton: {
    marginTop: 10,
  },
});