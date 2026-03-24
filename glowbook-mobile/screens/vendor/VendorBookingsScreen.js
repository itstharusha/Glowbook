import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import theme from '../../constants/theme';

const VendorBookingsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Pending');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = async () => {
    try {
      const res = await api.get('/api/appointments/vendor-salon');
      setAppointments(res.data.data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAppointments();
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/api/appointments/${id}/status`, { status });
      loadAppointments();
    } catch (error) {
      alert(`Failed to mark as ${status}`);
    }
  };

  const filteredAppointments = appointments.filter(a => a.status === activeTab);

  const BookingCard = ({ apt }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{apt.userId?.name?.charAt(0)}</Text>
          </View>
          <Text style={styles.customerName}>{apt.userId?.name}</Text>
        </View>
        <Text style={styles.timeText}>{new Date(apt.date).toLocaleDateString()} • {apt.timeSlot}</Text>
      </View>

      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{apt.serviceId?.name}</Text>
        <Text style={styles.stylistName}>Stylist: {apt.stylistId?.name}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.viewBtn} 
          onPress={() => navigation.navigate('VendorBookingDetail', { id: apt._id })}
        >
          <Text style={styles.viewBtnText}>View Details</Text>
        </TouchableOpacity>

        {apt.status === 'Pending' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => handleStatusUpdate(apt._id, 'Confirmed')}>
            <Text style={styles.primaryBtnText}>Confirm</Text>
          </TouchableOpacity>
        )}
        {apt.status === 'Confirmed' && (
          <TouchableOpacity style={styles.outlineBtn} onPress={() => handleStatusUpdate(apt._id, 'Completed')}>
            <Text style={styles.outlineBtnText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
      </View>

      <View style={styles.segmentedControl}>
        {['Pending', 'Confirmed', 'Completed'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.segmentTab, activeTab === tab && styles.segmentTabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {loading ? (
          <View style={styles.center}><Text>Loading...</Text></View>
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={theme.systemGray3} />
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} bookings</Text>
          </View>
        ) : (
          filteredAppointments.map(apt => <BookingCard key={apt._id} apt={apt} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
  header: { padding: 16, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.separator },
  headerTitle: { fontSize: 28, fontWeight: '700', color: theme.labelPrimary },
  segmentedControl: { flexDirection: 'row', backgroundColor: theme.systemGray6, margin: 16, borderRadius: 8, padding: 2 },
  segmentTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentTabActive: { backgroundColor: theme.background, ...theme.shadows.card },
  segmentText: { fontSize: 13, fontWeight: '500', color: theme.labelSecondary },
  segmentTextActive: { color: theme.labelPrimary, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  center: { marginTop: 40, alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
  emptyText: { marginTop: 12, fontSize: 16, color: theme.labelSecondary },
  
  card: { backgroundColor: theme.background, borderRadius: 12, padding: 16, marginBottom: 16, ...theme.shadows.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  customerInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  customerName: { fontSize: 16, fontWeight: '600', color: theme.labelPrimary },
  timeText: { fontSize: 13, fontFamily: 'monospace', color: theme.labelSecondary },
  serviceInfo: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.separator, borderBottomWidth: 1, borderBottomColor: theme.separator, marginBottom: 12 },
  serviceName: { fontSize: 16, fontWeight: '500', color: theme.labelPrimary, marginBottom: 4 },
  stylistName: { fontSize: 14, color: theme.labelSecondary },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewBtn: { paddingVertical: 8 },
  viewBtnText: { color: theme.primary, fontSize: 14, fontWeight: '500' },
  primaryBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  outlineBtn: { borderWidth: 1, borderColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  outlineBtnText: { color: theme.primary, fontSize: 14, fontWeight: '600' },
});

export default VendorBookingsScreen;
