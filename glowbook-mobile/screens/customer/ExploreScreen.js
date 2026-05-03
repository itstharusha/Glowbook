import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import theme from '../../constants/theme';
import SalonCard from '../../components/SalonCard';

const CATEGORIES = ['All', 'Hair', 'Nails', 'Skin', 'Makeup', 'Spa', 'Waxing'];

const ExploreScreen = ({ navigation, route }) => {
  const initialCategory = route.params?.category || '';
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    api.get('/api/salons')
      .then(res => setSalons(res.data.data || []))
      .catch(err => console.error('Explore load error:', err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = salons;
    if (activeCategory) {
      list = list.filter(s => s.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [salons, query, activeCategory]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Salons</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={theme.systemGray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or location…"
          placeholderTextColor={theme.systemGray}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.systemGray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <View style={styles.filtersRow}>
        <FlatList
          data={CATEGORIES}
          keyExtractor={item => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => {
            const isActive = item === 'All' ? !activeCategory : item === activeCategory;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveCategory(item === 'All' ? '' : item)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Salon List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SalonCard
              salon={item}
              onPress={() => navigation.navigate('SalonDetail', { salonId: item._id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={theme.systemGray3} />
              <Text style={styles.emptyTitle}>No salons found</Text>
              <Text style={styles.emptySubtitle}>Try a different search or category</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundGrouped },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separator,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: theme.labelPrimary },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    ...theme.shadows.card,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.labelPrimary },
  filtersRow: { marginBottom: 4 },
  filtersContent: { paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.separator,
  },
  filterChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterChipText: { fontSize: 14, fontWeight: '500', color: theme.labelSecondary },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 12, paddingTop: 8 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.labelPrimary },
  emptySubtitle: { fontSize: 14, color: theme.labelSecondary },
});

export default ExploreScreen;
