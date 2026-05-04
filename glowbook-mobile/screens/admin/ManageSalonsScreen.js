import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput, Modal,
  ScrollView, Switch, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import theme from '../../constants/theme';

const ManageSalonsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const loadSalons = useCallback(async (pageNum = 1) => {
    try {
      const res = await api.get(`/api/salons?page=${pageNum}&limit=20`);
      const data = res.data.data || [];
      const total = res.data.pagination?.total || 0;
      if (pageNum === 1) setSalons(data);
      else setSalons(prev => [...prev, ...data]);
      setPage(pageNum);
      setHasMore(pageNum * 20 < total);
    } catch (error) {
      Alert.alert('Something Went Wrong', 'Could not load salons. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadSalons(1); }, [loadSalons]);

  const handleRefresh = () => { setRefreshing(true); loadSalons(1); };

  const handleLoadMore = () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    loadSalons(page + 1).finally(() => setLoadingMore(false));
  };

  const openSalon = (salon) => {
    setSelectedSalon(salon);
    setEditForm({
      name: salon.name || '',
      description: salon.description || '',
      location: salon.location || '',
      phoneNumber: salon.phoneNumber || '',
      openingHours: salon.openingHours || '',
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name?.trim()) {
      Alert.alert('Missing Information', 'Salon name is required.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.put(`/api/salons/${selectedSalon._id}`, editForm);
      const updated = res.data.data;
      setSalons(prev => prev.map(s => s._id === updated._id ? updated : s));
      setSelectedSalon(updated);
      setIsEditing(false);
    } catch {
      Alert.alert('Something Went Wrong', 'Could not save changes. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVerify = async (salon) => {
    const newStatus = !salon.isVerified;
    Alert.alert(
      newStatus ? 'Verify Salon' : 'Remove Verification',
      `${newStatus ? 'Verify' : 'Unverify'} ${salon.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await api.patch(`/api/salons/${salon._id}/verify`, { isVerified: newStatus });
              const updated = res.data.data;
              setSalons(prev => prev.map(s => s._id === updated._id ? updated : s));
              setSelectedSalon(updated);
            } catch {
              Alert.alert('Something Went Wrong', 'Could not update verification status.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteSalon = (salon) => {
    Alert.alert(
      'Delete Salon',
      `Delete "${salon.name}"? This will also remove all associated services, bookings, and reviews. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.delete(`/api/salons/${salon._id}`);
              setSalons(prev => prev.filter(s => s._id !== salon._id));
              setSelectedSalon(null);
            } catch {
              Alert.alert('Something Went Wrong', 'Could not delete this salon. Please try again.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredSalons = salons.filter(s =>
    s.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderSalon = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openSalon(item)} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{item.name}</Text>
        <View style={[styles.verifyBadge, { backgroundColor: item.isVerified ? 'rgba(52,199,89,0.12)' : 'rgba(255,149,0,0.12)' }]}>
          <Ionicons name={item.isVerified ? 'checkmark-circle' : 'alert-circle'} size={13} color={item.isVerified ? theme.success : theme.warning} />
          <Text style={[styles.verifyText, { color: item.isVerified ? theme.success : theme.warning }]}>
            {item.isVerified ? 'Verified' : 'Unverified'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardSub}>{item.location || 'No location'}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>{item.category}</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.systemGray3} />
      </View>
    </TouchableOpacity>
  );

  if (loading && salons.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={28} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Salons</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Salons</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={theme.labelSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search salons..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={theme.labelSecondary}
        />
      </View>

      <FlatList
        data={filteredSalons}
        keyExtractor={item => item._id}
        renderItem={renderSalon}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={48} color={theme.systemGray3} />
            <Text style={styles.emptyText}>No salons found</Text>
          </View>
        }
      />

      {/* Salon Detail / Edit Modal */}
      <Modal visible={!!selectedSalon} animationType="slide" transparent onRequestClose={() => setSelectedSalon(null)}>
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedSalon(null)} style={styles.iconBtn}>
              <Ionicons name="close" size={26} color={theme.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Edit Salon' : 'Salon Details'}</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconBtn}>
                <Ionicons name="pencil" size={20} color={theme.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.iconBtn}>
                <Text style={{ color: theme.labelSecondary, fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedSalon && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">

                {isEditing ? (
                  <View style={styles.section}>
                    {[
                      { label: 'Salon Name', key: 'name', multiline: false },
                      { label: 'Description', key: 'description', multiline: true },
                      { label: 'Location', key: 'location', multiline: false },
                      { label: 'Phone Number', key: 'phoneNumber', multiline: false },
                      { label: 'Opening Hours', key: 'openingHours', multiline: false },
                    ].map(({ label, key, multiline }) => (
                      <View key={key} style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{label}</Text>
                        <TextInput
                          style={[styles.input, multiline && styles.textArea]}
                          value={editForm[key]}
                          onChangeText={v => setEditForm(f => ({ ...f, [key]: v }))}
                          placeholderTextColor={theme.labelTertiary}
                          multiline={multiline}
                        />
                      </View>
                    ))}
                    <TouchableOpacity onPress={handleSaveEdit} disabled={actionLoading} activeOpacity={0.8}>
                      <LinearGradient colors={[theme.primary, '#E40E5A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
                        {actionLoading
                          ? <ActivityIndicator color="#fff" />
                          : <Text style={styles.saveBtnText}>Save Changes</Text>
                        }
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.section}>
                      {[
                        ['Salon Name', selectedSalon.name],
                        ['Category', selectedSalon.category],
                        ['Location', selectedSalon.location || 'Not set'],
                        ['Phone', selectedSalon.phoneNumber || 'Not set'],
                        ['Opening Hours', selectedSalon.openingHours || 'Not set'],
                        ['Rating', selectedSalon.avgRating ? `${selectedSalon.avgRating} / 5` : 'No ratings yet'],
                      ].map(([label, value]) => (
                        <View key={label} style={styles.detailRow}>
                          <Text style={styles.detailLabel}>{label}</Text>
                          <Text style={styles.detailValue}>{value}</Text>
                        </View>
                      ))}
                      {selectedSalon.description ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Description</Text>
                          <Text style={styles.detailValue}>{selectedSalon.description}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={[styles.section, styles.verifyRow]}>
                      <View>
                        <Text style={styles.detailLabel}>Verified</Text>
                        <Text style={styles.detailValue}>{selectedSalon.isVerified ? 'Yes' : 'No'}</Text>
                      </View>
                      <Switch
                        value={selectedSalon.isVerified}
                        onValueChange={() => handleToggleVerify(selectedSalon)}
                        trackColor={{ false: theme.separator, true: theme.success }}
                        thumbColor={selectedSalon.isVerified ? theme.success : theme.systemGray3}
                        disabled={actionLoading}
                      />
                    </View>

                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteSalon(selectedSalon)} disabled={actionLoading}>
                      {actionLoading
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Ionicons name="trash-outline" size={18} color="#fff" />
                            <Text style={styles.deleteBtnText}>Delete Salon</Text>
                          </>
                      }
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, height: 52,
    backgroundColor: theme.background,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.separator,
  },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: theme.background, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: theme.separator,
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.labelPrimary },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: theme.background, borderRadius: 12, padding: 14, marginBottom: 10, ...theme.shadows.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardName: { fontSize: 15, fontWeight: '600', color: theme.labelPrimary, flex: 1, marginRight: 8 },
  verifyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verifyText: { fontSize: 11, fontWeight: '600' },
  cardSub: { fontSize: 13, color: theme.labelSecondary, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardMeta: { fontSize: 12, color: theme.labelSecondary },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, color: theme.labelSecondary, marginTop: 12 },
  modalContent: { padding: 16, paddingBottom: 40 },
  section: { backgroundColor: theme.background, borderRadius: 12, padding: 16, marginBottom: 12, ...theme.shadows.card },
  detailRow: { marginBottom: 14 },
  detailLabel: { fontSize: 11, fontWeight: '600', color: theme.labelSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  detailValue: { fontSize: 15, color: theme.labelPrimary },
  verifyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: theme.labelSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { backgroundColor: theme.backgroundSecondary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.labelPrimary },
  textArea: { height: 90, textAlignVertical: 'top' },
  saveBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.destructive, borderRadius: 12, paddingVertical: 14, marginTop: 4,
  },
  deleteBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default ManageSalonsScreen;
