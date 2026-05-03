import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import theme from '../../constants/theme';

const ManageSalonsScreen = ({ navigation }) => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadSalons = useCallback(async (pageNum = 1) => {
    try {
      const res = await api.get(`/api/salons?page=${pageNum}&limit=20`);
      const data = res.data.data || [];
      if (pageNum === 1) {
        setSalons(data);
      } else {
        setSalons(prev => [...prev, ...data]);
      }
      setPage(pageNum);
    } catch (error) {
      console.error('Load salons error:', error.message);
      Alert.alert('Error', 'Failed to load salons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSalons(1);
  }, [loadSalons]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSalons(1);
  };

  const handleLoadMore = () => {
    loadSalons(page + 1);
  };

  const handleToggleVerify = async (salon) => {
    const newStatus = !salon.isVerified;
    Alert.alert(
      newStatus ? 'Verify Salon' : 'Unverify Salon',
      `Are you sure you want to ${newStatus ? 'verify' : 'unverify'} this salon?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const res = await api.patch(`/api/salons/${salon._id}/verify`, {
                isVerified: newStatus,
              });
              
              setSalons(prev =>
                prev.map(s =>
                  s._id === salon._id ? res.data.data : s
                )
              );
              
              Alert.alert('Success', `Salon ${newStatus ? 'verified' : 'unverified'} successfully`);
              setShowDetailModal(false);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to update salon');
            }
          },
        },
      ]
    );
  };

  const handleDeleteSalon = async (salon) => {
    Alert.alert(
      'Delete Salon',
      'Are you sure you want to delete this salon? This cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await api.delete(`/api/salons/${salon._id}`);
              setSalons(prev => prev.filter(s => s._id !== salon._id));
              Alert.alert('Success', 'Salon deleted successfully');
              setShowDetailModal(false);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete salon');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const filteredSalons = salons.filter(salon =>
    salon.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const SalonItem = ({ item }) => (
    <TouchableOpacity
      style={styles.salonCard}
      onPress={() => {
        setSelectedSalon(item);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.salonHeader}>
        <Text style={styles.salonName}>{item.name}</Text>
        <View style={[
          styles.verificationBadge,
          {
            backgroundColor: item.isVerified
              ? 'rgba(52, 199, 89, 0.1)'
              : 'rgba(255, 149, 0, 0.1)',
          },
        ]}>
          <Ionicons
            name={item.isVerified ? 'checkmark-circle' : 'alert-circle'}
            size={14}
            color={item.isVerified ? theme.success : theme.warning}
          />
          <Text style={[
            styles.verificationText,
            {
              color: item.isVerified ? theme.success : theme.warning,
            },
          ]}>
            {item.isVerified ? 'Verified' : 'Unverified'}
          </Text>
        </View>
      </View>
      <Text style={styles.salonLocation}>{item.location || 'No location'}</Text>
      <View style={styles.salonFooter}>
        <Text style={styles.salonServices}>
          {item.services?.length || 0} services
        </Text>
        <Ionicons name="chevron-forward" size={20} color={theme.labelSecondary} />
      </View>
    </TouchableOpacity>
  );

  if (loading && salons.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Salons</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.labelSecondary} />
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
        renderItem={({ item }) => <SalonItem item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={48} color={theme.labelSecondary} />
            <Text style={styles.emptyText}>No salons found</Text>
          </View>
        }
      />

      <Modal visible={showDetailModal} animationType="slide" transparent={true} onDismiss={() => setSelectedSalon(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowDetailModal(false);
              setSelectedSalon(null);
            }}>
              <Ionicons name="close" size={28} color={theme.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Salon Details</Text>
            <View style={{ width: 28 }} />
          </View>

          {selectedSalon && (
            <FlatList
              data={[selectedSalon]}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <View style={styles.modalContent}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{item.name}</Text>

                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{item.location || 'N/A'}</Text>

                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{item.phone || 'N/A'}</Text>

                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>
                    {item.description || 'No description'}
                  </Text>

                  <View style={styles.verificationSection}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={styles.verificationToggle}>
                      <Text style={styles.verificationLabel}>
                        {item.isVerified ? 'Verified' : 'Unverified'}
                      </Text>
                      <Switch
                        value={item.isVerified}
                        onValueChange={() => handleToggleVerify(item)}
                        trackColor={{ false: theme.separator, true: theme.success }}
                        thumbColor={item.isVerified ? theme.success : theme.warning}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteSalon(item)}
                  >
                    <Ionicons name="trash" size={20} color="white" />
                    <Text style={styles.deleteBtnText}>Delete Salon</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.labelPrimary },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.separator,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: theme.labelPrimary,
  },
  listContent: { padding: 16, paddingBottom: 40 },
  salonCard: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.card,
  },
  salonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  salonName: { fontSize: 16, fontWeight: '600', color: theme.labelPrimary, flex: 1 },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  verificationText: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
  salonLocation: { fontSize: 14, color: theme.labelSecondary, marginBottom: 8 },
  salonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salonServices: { fontSize: 12, color: theme.labelSecondary },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: { fontSize: 16, color: theme.labelSecondary, marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: theme.backgroundSecondary },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.separator,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: theme.labelPrimary },
  modalContent: { padding: 16 },
  detailLabel: { fontSize: 12, color: theme.labelSecondary, fontWeight: '500', marginTop: 16 },
  detailValue: { fontSize: 16, color: theme.labelPrimary, marginTop: 4 },
  verificationSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.separator },
  verificationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  verificationLabel: { fontSize: 14, color: theme.labelPrimary, fontWeight: '500' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.destructive,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 24,
    marginBottom: 24,
  },
  deleteBtnText: { color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 8 },
});

export default ManageSalonsScreen;
