import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, StatusBar, ScrollView, Modal, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import theme from '../../constants/theme';

const ROLE_COLORS = {
  vendor:   { bg: 'rgba(255, 149, 0, 0.12)', text: theme.warning },
  admin:    { bg: 'rgba(255, 45, 107, 0.12)', text: theme.primary },
  customer: { bg: 'rgba(52, 199, 89, 0.12)', text: theme.success },
};

const AdminUsersScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async (pageNum = 1) => {
    try {
      const res = await api.get(`/api/users/all?page=${pageNum}&limit=20`);
      const data = res.data.data || [];
      const total = res.data.pagination?.total || 0;
      if (pageNum === 1) {
        setUsers(data);
      } else {
        setUsers(prev => [...prev, ...data]);
      }
      setPage(pageNum);
      setHasMore(pageNum * 20 < total);
    } catch (error) {
      if (pageNum === 1) Alert.alert('Something Went Wrong', 'Could not load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadUsers(1); }, [loadUsers]);

  const filteredUsers = searchQuery.trim()
    ? users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers(1);
  };

  const handleLoadMore = () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    loadUsers(page + 1).finally(() => setLoadingMore(false));
  };

  const handleDeleteUser = (user) => {
    if (user.role === 'admin') {
      Alert.alert('Not Allowed', 'Admin accounts cannot be deleted.');
      return;
    }
    Alert.alert(
      'Delete User',
      `Delete ${user.name}'s account? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.delete(`/api/users/${user._id}`);
              setUsers(prev => prev.filter(u => u._id !== user._id));
              setSelectedUser(null);
            } catch (err) {
              Alert.alert('Something Went Wrong', 'Could not delete this user. Please try again.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = (user) => {
    if (user.role === 'admin') {
      Alert.alert('Not Allowed', 'Admin roles cannot be changed.');
      return;
    }
    const newRole = user.role === 'customer' ? 'vendor' : 'customer';
    Alert.alert(
      'Change Role',
      `Change ${user.name}'s role from ${user.role} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await api.patch(`/api/users/${user._id}/role`, { role: newRole });
              const updated = res.data.data;
              setUsers(prev => prev.map(u => u._id === user._id ? updated : u));
              setSelectedUser(updated);
            } catch (err) {
              Alert.alert('Something Went Wrong', 'Could not change this user\'s role. Please try again.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }) => {
    const colors = ROLE_COLORS[item.role] || ROLE_COLORS.customer;
    return (
      <TouchableOpacity style={styles.userCard} onPress={() => setSelectedUser(item)} activeOpacity={0.75}>
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.roleText, { color: colors.text }]}>{item.role}</Text>
          </View>
        </View>
        <Text style={styles.joinDate}>Joined {new Date(item.createdAt).toLocaleDateString()}</Text>
      </TouchableOpacity>
    );
  };

  if (loading && users.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Users</Text>
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={theme.labelSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={theme.labelSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.labelSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item._id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={theme.systemGray3} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      {/* User Detail Modal */}
      <Modal visible={!!selectedUser} animationType="slide" transparent onRequestClose={() => setSelectedUser(null)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backBtn}>
              <Ionicons name="close" size={26} color={theme.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>User Details</Text>
            <View style={{ width: 44 }} />
          </View>

          {selectedUser && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.userProfileRow}>
                <View style={[styles.userAvatar, styles.userAvatarLarge]}>
                  <Text style={[styles.userAvatarText, { fontSize: 28 }]}>
                    {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={styles.detailName}>{selectedUser.name}</Text>
                <Text style={styles.detailEmail}>{selectedUser.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: (ROLE_COLORS[selectedUser.role] || ROLE_COLORS.customer).bg, marginTop: 8 }]}>
                  <Text style={[styles.roleText, { color: (ROLE_COLORS[selectedUser.role] || ROLE_COLORS.customer).text, fontSize: 13 }]}>
                    {selectedUser.role}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Joined</Text>
                <Text style={styles.detailValue}>{new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                {selectedUser.ownedSalon && (
                  <>
                    <Text style={styles.detailLabel}>Owned Salon</Text>
                    <Text style={styles.detailValue}>{selectedUser.ownedSalon}</Text>
                  </>
                )}
              </View>

              {selectedUser.role !== 'admin' && (
                <View style={styles.actionsSection}>
                  <TouchableOpacity
                    style={styles.roleBtn}
                    onPress={() => handleChangeRole(selectedUser)}
                    disabled={actionLoading}
                  >
                    <Ionicons name="swap-horizontal-outline" size={18} color={theme.primary} />
                    <Text style={styles.roleBtnText}>
                      Change to {selectedUser.role === 'customer' ? 'Vendor' : 'Customer'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteUser(selectedUser)}
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? <ActivityIndicator color="#fff" />
                      : <>
                          <Ionicons name="trash-outline" size={18} color="#fff" />
                          <Text style={styles.deleteBtnText}>Delete Account</Text>
                        </>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
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
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: theme.background,
    borderRadius: 10, borderWidth: 1, borderColor: theme.separator,
    paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.labelPrimary },
  list: { padding: 16, paddingBottom: 40 },
  userCard: {
    backgroundColor: theme.background, borderRadius: 12,
    padding: 14, marginBottom: 10, ...theme.shadows.card,
  },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFF0F4', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  userAvatarLarge: { width: 72, height: 72, borderRadius: 36 },
  userAvatarText: { fontSize: 16, fontWeight: '700', color: theme.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: theme.labelPrimary },
  userEmail: { fontSize: 13, color: theme.labelSecondary, marginTop: 1 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  joinDate: { fontSize: 12, color: theme.labelSecondary },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, color: theme.labelSecondary, marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: theme.backgroundSecondary },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, height: 52,
    backgroundColor: theme.background,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.separator,
  },
  modalContent: { padding: 20 },
  userProfileRow: { alignItems: 'center', backgroundColor: theme.background, borderRadius: 14, padding: 24, marginBottom: 16, ...theme.shadows.card },
  detailName: { fontSize: 20, fontWeight: '700', color: theme.labelPrimary, marginTop: 12 },
  detailEmail: { fontSize: 14, color: theme.labelSecondary, marginTop: 4 },
  detailSection: { backgroundColor: theme.background, borderRadius: 14, padding: 16, marginBottom: 16, ...theme.shadows.card },
  detailLabel: { fontSize: 12, color: theme.labelSecondary, fontWeight: '500', marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  detailValue: { fontSize: 15, color: theme.labelPrimary, marginTop: 4 },
  actionsSection: { gap: 12 },
  roleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.background, borderRadius: 12, paddingVertical: 14,
    borderWidth: 1.5, borderColor: theme.primary, ...theme.shadows.card,
  },
  roleBtnText: { fontSize: 15, fontWeight: '600', color: theme.primary },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.destructive, borderRadius: 12, paddingVertical: 14,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default AdminUsersScreen;
