import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import auth from "@react-native-firebase/auth";

const TYPE_COLORS: Record<string, string> = {
  fire: "#F08030",
  water: "#6890F0",
  grass: "#78C850",
  electric: "#F8D030",
  bug: "#A8B820",
  normal: "#A8A878",
  ground: "#E0C068",
};

export default function HomeScreen() {
  const [pokemon, setPokemon] = useState<any[]>([]);

  useEffect(() => {
    const fetchPokemon = async () => {
      const response = await fetch(
        "https://pokeapi.co/api/v2/pokemon?limit=151"
      );
      const data = await response.json();

      const detailed = await Promise.all(
        data.results.map(async (item: any) => {
          const res = await fetch(item.url);
          const details = await res.json();

          return {
            id: details.id,
            name: details.name,
            sprite: details.sprites.front_default,
            types: details.types.map((t: any) => t.type.name),
          };
        })
      );

      setPokemon(detailed);
    };

    fetchPokemon();
  }, []);

  const logout = () => auth().signOut();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pokédex</Text>

      <TouchableOpacity onPress={logout}>
        <Text style={styles.logout}>Logout</Text>
      </TouchableOpacity>

      <FlatList
        data={pokemon}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor:
                  TYPE_COLORS[item.types[0]] || "#ccc",
              },
            ]}
          >
            <Image
              source={{ uri: item.sprite }}
              style={styles.image}
            />
            <Text style={styles.cardTitle}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: { fontSize: 32, fontWeight: "bold" },
  logout: { color: "red", marginBottom: 10 },
  card: {
    flex: 1,
    margin: 5,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  image: { width: 80, height: 80 },
  cardTitle: { fontSize: 16, marginTop: 10, color: "white" },
});
