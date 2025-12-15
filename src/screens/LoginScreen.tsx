// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import auth from "@react-native-firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    // Input validation
    if (!email.trim()) {
      setErrorMsg("Please enter your email");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await auth().signInWithEmailAndPassword(email.trim(), password);
      // Navigation is handled automatically by onAuthStateChanged in App.tsx
    } catch (error: any) {
      console.log("Login error:", error);
      
      // Handle specific Firebase errors
      let message = "Login failed. Please try again.";
      
      if (error.code === 'auth/invalid-email') {
        message = "Invalid email address format.";
      } else if (error.code === 'auth/user-not-found') {
        message = "No account found with this email.";
      } else if (error.code === 'auth/wrong-password') {
        message = "Incorrect password.";
      } else if (error.code === 'auth/invalid-credential') {
        message = "Invalid email or password.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Too many failed attempts. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "Network error. Please check your connection.";
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
          <Text style={styles.title}>PokéExplorer</Text>
          <Text style={styles.subtitle}>Catch 'em all!</Text>
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

        <Button 
          mode="contained" 
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.loginButton}
          buttonColor="#DC0A2D"
        >
          {loading ? "Logging in..." : "Login"}
        </Button>

        <Button 
          onPress={() => navigation.navigate("Signup")}
          disabled={loading}
          style={styles.signupButton}
        >
          Create Account
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
  loginButton: {
    marginTop: 10,
    paddingVertical: 6,
  },
  signupButton: {
    marginTop: 10,
  },
});