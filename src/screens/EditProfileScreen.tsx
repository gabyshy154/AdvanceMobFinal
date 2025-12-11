import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import auth from "@react-native-firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import UserAvatar from "../components/UserAvatar";

type Props = NativeStackScreenProps<RootStackParamList, "EditProfile">;

export default function EditProfileScreen({ navigation }: Props) {
  const user = auth().currentUser;

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Update display name
      if (displayName !== user?.displayName) {
        await user?.updateProfile({ displayName });
      }

      // Update email
      if (email !== user?.email) {
        await user?.updateEmail(email.trim());
      }

      // Update password (optional)
      if (password.length > 0) {
        if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match.");
          return;
        }
        await user?.updatePassword(password);
      }

      setSuccessMsg("Profile updated successfully!");
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Trainer Card */}
      <View style={styles.headerCard}>

        {/* NEW: Animated Pokéball Avatar */}
        <UserAvatar
          label={(displayName || "T").charAt(0).toUpperCase()}
          onPress={() => {
            console.log("Avatar tapped!");
            // Later: open avatar customization or photo picker
          }}
        />

        <Text style={styles.headerName}>{displayName || "Trainer"}</Text>
        <Text style={styles.headerSubtitle}>Trainer Profile</Text>
      </View>

      {/* Messages */}
      {errorMsg !== "" && <Text style={styles.error}>{errorMsg}</Text>}
      {successMsg !== "" && <Text style={styles.success}>{successMsg}</Text>}

      {/* Fields */}
      <TextInput
        label="Display Name"
        mode="outlined"
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
      />

      <TextInput
        label="Email"
        mode="outlined"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />

      <Text style={styles.sectionLabel}>Change Password (optional)</Text>

      <TextInput
        label="New Password"
        mode="outlined"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TextInput
        label="Confirm New Password"
        mode="outlined"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
      />

      {/* Save Button */}
      <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
        Save Changes
      </Button>

      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#F5F5F5",
  },

  // HEADER CARD (Pokémon GO theme)
  headerCard: {
    backgroundColor: "#DC0A2D",
    borderRadius: 20,
    paddingVertical: 35,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 25,
    elevation: 4,
  },

  headerName: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 12,
  },
  headerSubtitle: {
    color: "#FFE1E6",
    marginTop: 4,
    fontSize: 14,
  },

  input: {
    marginBottom: 16,
  },

  sectionLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },

  saveButton: {
    marginTop: 10,
    paddingVertical: 6,
  },

  backText: {
    marginTop: 16,
    textAlign: "center",
    color: "#DC0A2D",
    fontSize: 16,
    fontWeight: "600",
  },

  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  success: {
    color: "green",
    marginBottom: 10,
    textAlign: "center",
  },
});
