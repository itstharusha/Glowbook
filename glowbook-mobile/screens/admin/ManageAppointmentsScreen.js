import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, StatusBar, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import theme from '../../constants/theme';

const STATUS_COLORS = {
  Pending:   { bg: 'rgba(255, 149, 0, 0.12)',   text: theme.warning },
  Confirmed: { bg: 'rgba(52, 199, 89, 0.12)',   text: theme.success },
  Completed: { bg: 'rgba(255, 45, 107, 0.12)',  text: theme.primary },
  Cancelled: { bg: 'rgba(255, 59, 48, 0.12)',   text: theme.destructive },
};

const ManageAppointmentsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAppointments = useCallback(async (pageNum = 1, status = '') => {
    try {
      const url = `/api/appointments/admin/all?page=${pageNum}&limit=20${status ? `&status=${status}` : ''}`;
      const res = await api.get(url);
      const data = res.data.data || [];
      const total = res.data.pagination?.total || 0;
      if (pageNum === 1) {
        setAppointments(data);
      } else {
        setAppointments(prev => [...prev, ...data]);
      }
      setPage(pageNum);
      setHasMore(pageNum * 20 < total);
    } catch (error) {
      if (pageNum === 1) Alert.alert('Something Went Wrong', 'Could not load appointments. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setAppointments([]);
    loadAppointments(1, statusFilter);
  }, [statusFilter, loadAppointments]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAppointments(1, statusFilter);
  };

  const handleLoadMore = () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    loadAppointments(page + 1, statusFilter).finally(() => setLoadingMore(false));
  };

  const handleUpdateStatus = (appointment, newStatus) => {
    const label = newStatus === 'Completed' ? 'mark as Completed' : 'cancel';
    Alert.alert(
      'Confirm Change',
      `Are you sure you want to ${label} this appointment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await api.put(`/api/appointments/${appointment._id}/status`, { status: newStatus });
              const updated = res.data.data;
              setAppointments(prev => prev.map(a => a._id === appointment._id ? { ...a, status: updated.status } : a));
              setSelectedAppointment(prev => prev ? { ...prev, status: updated.status } : null);
            } catch (err) {
              const msg = err.response?.data?.message;
              Alert.alert('Something Went Wrong', msg || 'Could not update this appointment. Please try again.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAppointment = (appointment) => {
    Alert.alert(
      'Delete Appointment',
      'Permanently delete this appointment record? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.delete(`/api/appointments/${appointment._id}`);
              setAppointments(prev => prev.filter(a => a._id !== appointment._id));
              setSelectedAppointment(null);
            } catch (err) {
              Alert.alert('Something Went Wrong', 'Could not delete this appointment. Please try again.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderAppointment = ({ item }) => {
    const colors = STATUS_COLORS[item.status] || STATUS_COLORS.Pending;
    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelectedAppointment(item)} activeOpacity={0.75}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardCustomer} numberOfLines={1}>{item.userId?.name || 'Unknown'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardService}>{item.serviceId?.name || 'Unknown Service'} · {item.stylistId?.name || 'Unknown Stylist'}</Text>
        <Text style={styles.cardSalon}>{item.salonId?.name || 'Unknown Salon'}</Text>
        <View style={styles.cardFooter}>
          <Ionicons name="calendar-outline" size={13} color={theme.labelSecondary} />
          <Text style={styles.cardDate}>
            {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
            {item.timeSlot ? `  ·  ${item.timeSlot}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && appointments.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Appointments</Text>
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
        <Text style={styles.headerTitle}>All Appointments</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.filterRow}>
        {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(opt => {
          const value = opt === 'All' ? '' : opt;
          const active = statusFilter === value;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(value)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={appointments}
        keyExtractor={item => item._id}
        renderItem={renderAppointment}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={theme.systemGray3} />
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        }
      />

      {/* Appointment Detail Modal */}
      <Modal visible={!!selectedAppointment} animationType="slide" transparent onRequestClose={() => setSelectedAppointment(null)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedAppointment(null)} style={styles.backBtn}>
              <Ionicons name="close" size={26} color={theme.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Appointment Details</Text>
            <View style={{ width: 44 }} />
          </View>

          {selectedAppointment && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Status banner */}
              <View style={[styles.statusBanner, { backgroundColor: (STATUS_COLORS[selectedAppointment.status] || STATUS_COLORS.Pending).bg }]}>
                <Text style={[styles.statusBannerText, { color: (STATUS_COLORS[selectedAppointment.status] || STATUS_COLORS.Pending).text }]}>
                  {selectedAppointment.status}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValue}>{selectedAppointment.userId?.name || 'N/A'}</Text>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedAppointment.userId?.email || 'N/A'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Salon</Text>
                <Text style={styles.detailValue}>{selectedAppointment.salonId?.name || 'N/A'}</Text>
                <Text style={styles.detailLabel}>Service</Text>
                <Text style={styles.detailValue}>{selectedAppointment.serviceId?.name || 'N/A'}</Text>
                <Text style={styles.detailLabel}>Stylist</Text>
                <Text style={styles.detailValue}>{selectedAppointment.stylistId?.name || 'N/A'}</Text>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailValue}>
                  ${selectedAppointment.serviceId?.price ?? '—'} · {selectedAppointment.serviceId?.duration ?? '—'} mins
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Scheduled Date</Text>
                <Text style={styles.detailValue}>
                  {selectedAppointment.date
                    ? new Date(selectedAppointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : 'N/A'}
                </Text>
                {selectedAppointment.timeSlot && (
                  <>
                    <Text style={styles.detailLabel}>Time Slot</Text>
                    <Text style={styles.detailValue}>{selectedAppointment.timeSlot}</Text>
                  </>
                )}
                {selectedAppointment.notes ? (
                  <>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{selectedAppointment.notes}</Text>
                  </>
                ) : null}
              </View>

              {/* Status actions */}
              {selectedAppointment.status !== 'Completed' && selectedAppointment.status !== 'Cancelled' && (
                <View style={styles.actionsSection}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: theme.success }]}
                    onPress={() => handleUpdateStatus(selectedAppointment, 'Completed')}
                    disabled={actionLoading}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={theme.success} />
                    <Text style={[styles.actionBtnText, { color: theme.success }]}>Mark as Completed</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: theme.warning }]}
                    onPress={() => handleUpdateStatus(selectedAppointment, 'Cancelled')}
                    disabled={actionLoading}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={theme.warning} />
                    <Text style={[styles.actionBtnText, { color: theme.warning }]}>Cancel Appointment</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Delete */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteAppointment(selectedAppointment)}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                      <Text style={styles.deleteBtnText}>Delete Record</Text>
                    </>
                }
              </TouchableOpacity>
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
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: theme.separator,
    backgroundColor: theme.background,
  },
  filterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  filterChipText: { fontSize: 13, fontWeight: '500', color: theme.labelSecondary },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: theme.background, borderRadius: 12,
    padding: 14, marginBottom: 10, ...theme.shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardCustomer: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.labelPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardService: { fontSize: 13, color: theme.labelSecondary, marginBottom: 3 },
  cardSalon: { fontSize: 14, color: theme.labelPrimary, fontWeight: '500', marginBottom: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  cardDate: { fontSize: 12, color: theme.labelSecondary, marginLeft: 5 },
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
  statusBanner: {
    alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, marginBottom: 16,
  },
  statusBannerText: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailSection: {
    backgroundColor: theme.background, borderRadius: 14,
    padding: 16, marginBottom: 12, ...theme.shadows.card,
  },
  detailLabel: {
    fontSize: 12, color: theme.labelSecondary, fontWeight: '500',
    marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.3,
  },
  detailValue: { fontSize: 15, color: theme.labelPrimary, marginTop: 4 },
  actionsSection: { gap: 10, marginBottom: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.background, borderRadius: 12, paddingVertical: 14,
    borderWidth: 1.5, ...theme.shadows.card,
  },
  actionBtnText: { fontSize: 15, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.destructive, borderRadius: 12, paddingVertical: 14,
    marginTop: 4,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default ManageAppointmentsScreen;
