import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import auth from "@react-native-firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    try {
      await auth().signInWithEmailAndPassword(email.trim(), password);
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PokeExplorer</Text>

      {errorMsg.length > 0 && (
        <Text style={styles.error}>{errorMsg}</Text>
      )}

      <TextInput
        label="Email"
        mode="outlined"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        label="Password"
        mode="outlined"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <Button mode="contained" onPress={handleLogin}>
        Login
      </Button>

      <Button onPress={() => navigation.navigate("Signup")}>
        Create Account
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 32, marginBottom: 20, textAlign: "center" },
  input: { marginBottom: 15 },
  error: { color: "red", marginBottom: 10, textAlign: "center" }
});
