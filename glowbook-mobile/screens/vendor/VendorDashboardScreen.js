import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import theme from '../../constants/theme';

const VendorDashboardScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [salon, setSalon] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [salonRes, aptRes] = await Promise.all([
        api.get('/api/salons/my'),
        api.get('/api/appointments/vendor-salon')
      ]);
      setSalon(salonRes.data.data);
      setAppointments(aptRes.data.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleConfirm = async (id) => {
    try {
      await api.put(`/api/appointments/${id}/status`, { status: 'Confirmed' });
      loadDashboardData(); // Refresh list
    } catch (error) {
      alert('Failed to confirm booking');
    }
  };

  const today = new Date().setHours(0,0,0,0);
  const todayAppointments = appointments.filter(a => {
    const aptDate = new Date(a.date).setHours(0,0,0,0);
    return aptDate === today;
  });

  const pendingCount = appointments.filter(a => a.status === 'Pending').length;

  if (loading) {
    return <View style={styles.center}><Text>Loading Dashboard...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning, {user?.name}</Text>
          <Text style={styles.salonName}>{salon?.name || 'Your Salon'}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{appointments.length}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.warning }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.success }]}>{salon?.avgRating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {/* We'll just alert for now, full screens can be added later */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => alert('Navigate to Edit Salon')}>
            <Ionicons name="create-outline" size={20} color={theme.primary} />
            <Text style={styles.actionText}>Edit Salon</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => alert('Navigate to Add Service')}>
            <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
            <Text style={styles.actionText}>Add Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => alert('Navigate to Add Stylist')}>
            <Ionicons name="person-add-outline" size={20} color={theme.primary} />
            <Text style={styles.actionText}>Add Stylist</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Appointments</Text>
          </View>

          {todayAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No appointments today.</Text>
            </View>
          ) : (
            todayAppointments.map(apt => (
              <View key={apt._id} style={styles.aptCard}>
                <View style={styles.aptInfo}>
                  <Text style={styles.aptCustomer}>{apt.userId?.name}</Text>
                  <Text style={styles.aptDetails}>{apt.serviceId?.name} • {apt.timeSlot}</Text>
                  <View style={[styles.statusChip, { backgroundColor: apt.status === 'Pending' ? '#FFF3CD' : '#D4EDDA' }]}>
                    <Text style={[styles.statusText, { color: apt.status === 'Pending' ? '#856404' : '#155724' }]}>
                      {apt.status}
                    </Text>
                  </View>
                </View>
                {apt.status === 'Pending' && (
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(apt._id)}>
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: theme.labelPrimary },
  salonName: { fontSize: 16, color: theme.labelSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: theme.background, padding: 16, borderRadius: 12, alignItems: 'center', ...theme.shadows.card },
  statValue: { fontSize: 24, fontWeight: 'bold', color: theme.labelPrimary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: theme.labelSecondary, textAlign: 'center' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, backgroundColor: theme.background, padding: 12, borderRadius: 12, alignItems: 'center', ...theme.shadows.card },
  actionText: { fontSize: 12, color: theme.primary, marginTop: 4, fontWeight: '500' },
  section: { flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.labelPrimary },
  emptyState: { padding: 24, alignItems: 'center', backgroundColor: theme.background, borderRadius: 12 },
  emptyText: { color: theme.labelSecondary },
  aptCard: { flexDirection: 'row', backgroundColor: theme.background, padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center', ...theme.shadows.card },
  aptInfo: { flex: 1 },
  aptCustomer: { fontSize: 16, fontWeight: '600', color: theme.labelPrimary, marginBottom: 4 },
  aptDetails: { fontSize: 14, color: theme.labelSecondary, marginBottom: 8 },
  statusChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  confirmBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});

export default VendorDashboardScreen;
