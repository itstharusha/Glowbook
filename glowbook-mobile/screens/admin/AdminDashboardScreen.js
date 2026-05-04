import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import theme from '../../constants/theme';

const AdminDashboardScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    vendorsWithoutSalon: 0,
    totalSalons: 0,
    activeBookings: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);

  const loadAdminData = async () => {
    try {
      // Fetch admin stats
      const statsRes = await api.get('/api/salons/admin/stats');
      const adminStats = statsRes.data.data || {};

      // Fetch users for derived stats
      const usersRes = await api.get('/api/users/all?limit=100');
      const allUsers = usersRes.data.data || [];
      
      const vendors = allUsers.filter(u => u.role === 'vendor');
      const withoutSalon = vendors.filter(v => !v.ownedSalon).length;

      setStats({
        totalUsers: allUsers.length,
        totalVendors: vendors.length,
        vendorsWithoutSalon: withoutSalon,
        totalSalons: adminStats.totalSalons || 0,
        activeBookings: adminStats.activeBookings || 0,
        totalReviews: adminStats.totalReviews || 0,
      });
      setUsers(allUsers);
    } catch (error) {
      console.error('Admin load error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAdminData();
  };

  const StatBox = ({ title, value, color }) => (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Text style={styles.sectionTitle}>Platform Overview</Text>
        <View style={styles.statsContainer}>
          <StatBox title="Total Salons" value={stats.totalSalons} color={theme.warning} />
          <StatBox title="Active Bookings" value={stats.activeBookings} color={theme.success} />
          <StatBox title="Total Reviews" value={stats.totalReviews} color={theme.primary} />
        </View>

        <View style={styles.statsContainer}>
          <StatBox title="Total Users" value={stats.totalUsers} color={theme.primary} />
          <StatBox title="Total Vendors" value={stats.totalVendors} color={theme.warning} />
          <StatBox title="Vendors No Salon" value={stats.vendorsWithoutSalon} color={theme.destructive} />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <Ionicons name="people" size={24} color={theme.primary} />
            <Text style={styles.actionText}>Manage Users</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ManageSalons')}
          >
            <Ionicons name="storefront" size={24} color={theme.primary} />
            <Text style={styles.actionText}>Manage Salons</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ManageAppointments')}
          >
            <Ionicons name="calendar" size={24} color={theme.primary} />
            <Text style={styles.actionText}>All Bookings</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Users</Text>
        <View style={styles.usersList}>
          {users.slice(0, 5).map(u => (
            <View key={u._id} style={styles.userRow}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
              </View>
              <View style={[styles.roleBadge, 
                { backgroundColor: u.role === 'vendor' ? 'rgba(255, 149, 0, 0.1)' : 
                                   u.role === 'admin' ? 'rgba(255, 45, 107, 0.1)' : 'rgba(52, 199, 89, 0.1)' }]}
              >
                <Text style={[styles.roleText, 
                  { color: u.role === 'vendor' ? theme.warning : 
                           u.role === 'admin' ? theme.primary : theme.success }]}
                >{u.role}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Admin Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: theme.background, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.separator },
  headerTitle: { fontSize: 22, fontWeight: '700', color: theme.labelPrimary },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.labelPrimary, marginBottom: 12, marginTop: 16 },
  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statBox: { flex: 1, backgroundColor: theme.background, padding: 16, borderRadius: 12, alignItems: 'center', ...theme.shadows.card },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, color: theme.labelSecondary, textAlign: 'center' },
  actionsContainer: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, backgroundColor: theme.background, padding: 16, borderRadius: 12, alignItems: 'center', ...theme.shadows.card },
  actionText: { marginTop: 8, fontSize: 12, fontWeight: '500', color: theme.labelPrimary, textAlign: 'center' },
  usersList: { backgroundColor: theme.background, borderRadius: 12, overflow: 'hidden', ...theme.shadows.card },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.separator },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '500', color: theme.labelPrimary, marginBottom: 4 },
  userEmail: { fontSize: 14, color: theme.labelSecondary },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  logoutBtn: { marginTop: 32, backgroundColor: theme.background, padding: 16, borderRadius: 12, alignItems: 'center', ...theme.shadows.card },
  logoutText: { color: theme.destructive, fontSize: 16, fontWeight: 'bold' },
});

export default AdminDashboardScreen;
