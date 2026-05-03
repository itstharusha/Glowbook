import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import theme from '../../constants/theme';

const STATUS_CONFIG = {
  Pending:   { color: '#007AFF', bg: '#EBF4FF', icon: 'time-outline' },
  Confirmed: { color: theme.success, bg: '#EDFAF1', icon: 'checkmark-circle-outline' },
  Completed: { color: theme.systemGray, bg: theme.systemGray6, icon: 'checkmark-done-outline' },
  Cancelled: { color: theme.destructive, bg: '#FFF0EF', icon: 'close-circle-outline' },
};

const FILTERS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const CustomerBookingsScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  const loadAppointments = async () => {
    try {
      const res = await api.get('/api/appointments/my');
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error('Load bookings error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAppointments();
    }, [])
  );

  const handleCancel = (appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Cancel your booking at ${appointment.salonId?.name} on ${formatDate(appointment.date)}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/api/appointments/${appointment._id}/cancel`);
              setAppointments(prev =>
                prev.map(a => a._id === appointment._id ? { ...a, status: 'Cancelled' } : a)
              );
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel booking.');
            }
          },
        },
      ]
    );
  };

  const filtered = activeFilter === 'All'
    ? appointments
    : appointments.filter(a => a.status === activeFilter);

  const renderItem = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
    const canCancel = item.status === 'Pending' || item.status === 'Confirmed';

    return (
      <View style={styles.card}>
        {/* Status bar */}
        <View style={[styles.statusBar, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={14} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{item.status}</Text>
        </View>

        <View style={styles.cardBody}>
          {/* Salon + Service */}
          <Text style={styles.salonName}>{item.salonId?.name || 'Unknown Salon'}</Text>
          <Text style={styles.serviceName}>{item.serviceId?.name || 'Service'}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={theme.labelSecondary} />
              <Text style={styles.metaText}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={theme.labelSecondary} />
              <Text style={styles.metaText}>{item.timeSlot}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={14} color={theme.labelSecondary} />
              <Text style={styles.metaText}>{item.stylistId?.name || 'Any stylist'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={14} color={theme.labelSecondary} />
              <Text style={styles.metaText}>${item.serviceId?.price}</Text>
            </View>
          </View>

          {item.notes ? (
            <Text style={styles.notes}>"{item.notes}"</Text>
          ) : null}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancel(item)}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
            {item.status === 'Completed' && (
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => navigation.navigate('LeaveReview', {
                  salonId: item.salonId?._id,
                  salonName: item.salonId?.name || 'Salon',
                })}
                activeOpacity={0.75}
              >
                <Ionicons name="star-outline" size={14} color={theme.primary} />
                <Text style={styles.reviewBtnText}>Leave a Review</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={FILTERS}
          keyExtractor={item => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

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
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={56} color={theme.systemGray3} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'All'
                  ? 'Book your first appointment from the Explore tab'
                  : `No ${activeFilter.toLowerCase()} bookings`}
              </Text>
              {activeFilter === 'All' && (
                <TouchableOpacity
                  style={styles.exploreBtn}
                  onPress={() => navigation.navigate('Explore')}
                >
                  <Text style={styles.exploreBtnText}>Explore Salons</Text>
                </TouchableOpacity>
              )}
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
  filtersContainer: { backgroundColor: theme.background },
  filtersContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: theme.systemGray6,
  },
  filterChipActive: { backgroundColor: theme.primary },
  filterText: { fontSize: 13, fontWeight: '500', color: theme.labelSecondary },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 12 },
  card: {
    backgroundColor: theme.background,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardBody: { padding: 14 },
  salonName: { fontSize: 17, fontWeight: '700', color: theme.labelPrimary, marginBottom: 2 },
  serviceName: { fontSize: 14, color: theme.primary, fontWeight: '500', marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: theme.labelSecondary },
  notes: { fontSize: 13, color: theme.labelSecondary, fontStyle: 'italic', marginTop: 6 },
  actionRow: {
    flexDirection: 'row', gap: 10, marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: theme.destructive,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelBtnText: { color: theme.destructive, fontSize: 14, fontWeight: '600' },
  reviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 8,
  },
  reviewBtnText: { color: theme.primary, fontSize: 14, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.labelPrimary, marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: theme.labelSecondary, textAlign: 'center' },
  exploreBtn: {
    marginTop: 16,
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  exploreBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default CustomerBookingsScreen;
