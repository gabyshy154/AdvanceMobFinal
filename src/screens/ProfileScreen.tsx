// src/screens/ProfileScreen.tsx - UPDATED WITH REAL STATS
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BadgeData = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  requirement: number;
  unlocked: boolean;
};

const BADGES: BadgeData[] = [
  { id: 'rookie', emoji: '🥉', name: 'Rookie', description: 'Catch 1 Pokémon', requirement: 1, unlocked: false },
  { id: 'trainer', emoji: '🥈', name: 'Trainer', description: 'Catch 10 Pokémon', requirement: 10, unlocked: false },
  { id: 'ace', emoji: '🥇', name: 'Ace Trainer', description: 'Catch 25 Pokémon', requirement: 25, unlocked: false },
  { id: 'expert', emoji: '🏆', name: 'Expert', description: 'Catch 50 Pokémon', requirement: 50, unlocked: false },
  { id: 'master', emoji: '⭐', name: 'Master', description: 'Catch 100 Pokémon', requirement: 100, unlocked: false },
  { id: 'legend', emoji: '💎', name: 'Legend', description: 'Catch all 151 Pokémon', requirement: 151, unlocked: false },
];

const ProfileScreen = () => {
  const user = auth().currentUser;
  const [loading, setLoading] = useState(true);
  const [caughtCount, setCaughtCount] = useState(0);
  const [capturesCount, setCapturesCount] = useState(0);
  const [badges, setBadges] = useState<BadgeData[]>(BADGES);
  const [trainerLevel, setTrainerLevel] = useState(1);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Load from cache first for instant display
      const cached = await AsyncStorage.getItem(`userStats_${user.uid}`);
      if (cached) {
        const stats = JSON.parse(cached);
        updateStats(stats.caughtCount, stats.capturesCount);
      }

      // Load caught Pokémon count
      const caughtSnapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('caught')
        .get();

      const caught = caughtSnapshot.size;

      // Load captures count
      const capturesSnapshot = await firestore()
        .collection('captures')
        .where('userId', '==', user.uid)
        .get();

      const captures = capturesSnapshot.size;

      // Update stats
      updateStats(caught, captures);

      // Cache the stats
      await AsyncStorage.setItem(`userStats_${user.uid}`, JSON.stringify({
        caughtCount: caught,
        capturesCount: captures,
      }));

    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (caught: number, captures: number) => {
    setCaughtCount(caught);
    setCapturesCount(captures);

    // Calculate trainer level (1 level per 10 caught)
    const level = Math.floor(caught / 10) + 1;
    setTrainerLevel(level);

    // Update badges based on caught count
    const updatedBadges = BADGES.map(badge => ({
      ...badge,
      unlocked: caught >= badge.requirement,
    }));
    setBadges(updatedBadges);
  };

  const handleLogout = () => auth().signOut();

  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC0A2D" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.email || 'T').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.displayName || 'Trainer'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {trainerLevel}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Trainer Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{caughtCount}</Text>
              <Text style={styles.statLabel}>Pokémon Caught</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{unlockedBadgesCount}</Text>
              <Text style={styles.statLabel}>Badges Earned</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{trainerLevel}</Text>
              <Text style={styles.statLabel}>Trainer Level</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{capturesCount}</Text>
              <Text style={styles.statLabel}>Photos Taken</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Pokédex Progress</Text>
              <Text style={styles.progressText}>{caughtCount}/151</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(caughtCount / 151) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.badgesCard}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <Text style={styles.badgesSubtitle}>
            {unlockedBadgesCount} of {badges.length} unlocked
          </Text>
          <View style={styles.badgesContainer}>
            {badges.map((badge) => (
              <TouchableOpacity
                key={badge.id}
                style={[
                  styles.badgeItem,
                  !badge.unlocked && styles.badgeItemLocked
                ]}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.badgeIconContainer,
                  !badge.unlocked && styles.badgeIconLocked
                ]}>
                  <Text style={[
                    styles.badgeIcon,
                    !badge.unlocked && styles.badgeIconTextLocked
                  ]}>
                    {badge.emoji}
                  </Text>
                </View>
                <Text style={[
                  styles.badgeName,
                  !badge.unlocked && styles.badgeNameLocked
                ]}>
                  {badge.name}
                </Text>
                <Text style={[
                  styles.badgeDescription,
                  !badge.unlocked && styles.badgeDescriptionLocked
                ]}>
                  {badge.description}
                </Text>
                {badge.unlocked && (
                  <View style={styles.unlockedIndicator}>
                    <Text style={styles.unlockedText}>✓</Text>
                  </View>
                )}
                {!badge.unlocked && (
                  <View style={styles.lockedOverlay}>
                    <Text style={styles.lockedIcon}>🔒</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Settings</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionText}>Notifications</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>❓</Text>
            <Text style={styles.actionText}>Help & Support</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DC0A2D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#DC0A2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: '#FFCB05',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DC0A2D',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC0A2D',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC0A2D',
    borderRadius: 6,
  },
  badgesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgesSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    width: '30%',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    position: 'relative',
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIconLocked: {
    backgroundColor: '#e0e0e0',
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeIconTextLocked: {
    opacity: 0.3,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: '#999',
  },
  badgeDescription: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
  badgeDescriptionLocked: {
    color: '#aaa',
  },
  unlockedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  lockedIcon: {
    fontSize: 16,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  actionArrow: {
    fontSize: 24,
    color: '#999',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  logoutButton: {
    backgroundColor: '#DC0A2D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
});

export default ProfileScreen;