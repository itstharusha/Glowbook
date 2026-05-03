import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, TextInput, StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import theme from '../../constants/theme';
import SalonCard from '../../components/SalonCard';

const CATEGORIES = ['All', 'Hair', 'Nails', 'Skin', 'Makeup', 'Spa', 'Waxing'];

const CustomerHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const firstName = user?.name?.split(' ')[0] || 'there';

  const loadSalons = async () => {
    try {
      const res = await api.get('/api/salons');
      setSalons(res.data.data || []);
    } catch (err) {
      console.error('Home load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadSalons(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSalons();
  };

  const featuredSalons = salons.slice(0, 8);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {firstName}</Text>
          <Text style={styles.subtitle}>Find your perfect look</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
      >
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Explore')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={18} color={theme.systemGray} />
          <Text style={styles.searchPlaceholder}>Search salons, services…</Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={styles.categoryChip}
                onPress={() => navigation.navigate('Explore', {
                  screen: 'Explore',
                  params: { category: cat === 'All' ? '' : cat },
                })}
                activeOpacity={0.75}
              >
                <Text style={styles.categoryChipText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Salons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Salons</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Explore', { screen: 'Explore' })}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.skeletonRow}>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.skeleton} />
              ))}
            </View>
          ) : featuredSalons.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={40} color={theme.systemGray3} />
              <Text style={styles.emptyText}>No salons available yet</Text>
            </View>
          ) : (
            <FlatList
              data={featuredSalons}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
              renderItem={({ item }) => (
                <SalonCard
                  salon={item}
                  horizontal
                  onPress={() => navigation.navigate('SalonDetail', { salonId: item._id })}
                />
              )}
            />
          )}
        </View>

        {/* All Salons */}
        {!loading && salons.length > 0 && (
          <View style={[styles.section, { paddingBottom: 24 }]}>
            <Text style={styles.sectionTitle}>All Salons</Text>
            {salons.map(salon => (
              <SalonCard
                key={salon._id}
                salon={salon}
                style={{ marginHorizontal: 0 }}
                onPress={() => navigation.navigate('SalonDetail', { salonId: salon._id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundGrouped },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separator,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: theme.labelPrimary },
  subtitle: { fontSize: 14, color: theme.labelSecondary, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
    ...theme.shadows.card,
  },
  searchPlaceholder: { fontSize: 15, color: theme.systemGray },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: theme.labelPrimary, marginBottom: 12,
  },
  seeAll: { fontSize: 14, color: theme.primary, fontWeight: '600' },
  categoriesRow: { paddingRight: 4, gap: 8 },
  categoryChip: {
    backgroundColor: theme.background,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.separator,
  },
  categoryChipText: { fontSize: 14, fontWeight: '500', color: theme.labelPrimary },
  skeletonRow: { flexDirection: 'row', gap: 12 },
  skeleton: {
    width: 200, height: 180, borderRadius: 14, backgroundColor: theme.systemGray5,
  },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 15, color: theme.labelSecondary, marginTop: 8 },
});

export default CustomerHomeScreen;
