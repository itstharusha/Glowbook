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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';
import theme from '../../constants/theme';

const AdminUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');

  const loadUsers = useCallback(async (pageNum = 1, role = '') => {
    try {
      let url = `/api/users/all?page=${pageNum}&limit=20`;
      if (role) {
        url += `&role=${role}`;
      }
      const res = await api.get(url);
      const data = res.data.data || [];
      if (pageNum === 1) {
        setUsers(data);
      } else {
        setUsers(prev => [...prev, ...data]);
      }
      setPage(pageNum);
    } catch (error) {
      console.error('Load users error:', error.message);
      if (pageNum === 1) {
        Alert.alert('Error', 'Failed to load users. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(1, roleFilter);
  }, [roleFilter, loadUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers(1, roleFilter);
  };

  const handleLoadMore = () => {
    loadUsers(page + 1, roleFilter);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'vendor':
        return { bg: 'rgba(255, 149, 0, 0.1)', text: theme.warning };
      case 'admin':
        return { bg: 'rgba(255, 45, 107, 0.1)', text: theme.primary };
      case 'stylist':
        return { bg: 'rgba(0, 122, 255, 0.1)', text: '#007AFF' };
      default:
        return { bg: 'rgba(52, 199, 89, 0.1)', text: theme.success };
    }
  };

  const UserItem = ({ item }) => {
    const roleColors = getRoleColor(item.role);
    const createdDate = new Date(item.createdAt).toLocaleDateString();

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
            <Text style={[styles.roleText, { color: roleColors.text }]}>
              {item.role}
            </Text>
          </View>
        </View>
        <View style={styles.userFooter}>
          <Ionicons name="calendar" size={12} color={theme.labelSecondary} />
          <Text style={styles.joinDate}>Joined {createdDate}</Text>
        </View>
      </View>
    );
  };

  if (loading && users.length === 0) {
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
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.filterContainer}>
        <Picker
          selectedValue={roleFilter}
          onValueChange={setRoleFilter}
          style={styles.picker}
        >
          <Picker.Item label="All Users" value="" />
          <Picker.Item label="Customers" value="customer" />
          <Picker.Item label="Vendors" value="vendor" />
          <Picker.Item label="Stylists" value="stylist" />
          <Picker.Item label="Admins" value="admin" />
        </Picker>
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <UserItem item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={theme.labelSecondary} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
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
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.separator,
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: { height: 40, color: theme.labelPrimary },
  listContent: { padding: 16, paddingBottom: 40 },
  userCard: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.card,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: theme.labelPrimary, marginBottom: 4 },
  userEmail: { fontSize: 14, color: theme.labelSecondary },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  roleText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  joinDate: { fontSize: 12, color: theme.labelSecondary, marginLeft: 6 },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: { fontSize: 16, color: theme.labelSecondary, marginTop: 12 },
});

export default AdminUsersScreen;
