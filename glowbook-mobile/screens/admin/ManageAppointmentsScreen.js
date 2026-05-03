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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';
import theme from '../../constants/theme';

const ManageAppointmentsScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadAppointments = useCallback(async (pageNum = 1, status = '') => {
    try {
      let url = `/api/appointments/admin/all?page=${pageNum}&limit=20`;
      if (status) {
        url += `&status=${status}`;
      }
      const res = await api.get(url);
      const data = res.data.data || [];
      if (pageNum === 1) {
        setAppointments(data);
      } else {
        setAppointments(prev => [...prev, ...data]);
      }
      setPage(pageNum);
    } catch (error) {
      console.error('Load appointments error:', error.message);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments(1, statusFilter);
  }, [statusFilter, loadAppointments]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAppointments(1, statusFilter);
  };

  const handleLoadMore = () => {
    loadAppointments(page + 1, statusFilter);
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    Alert.alert(
      'Confirm Status Change',
      `Are you sure you want to mark this appointment as ${newStatus}?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const res = await api.put(`/api/appointments/${appointmentId}/status`, {
                status: newStatus,
              });
              setAppointments(prev =>
                prev.map(apt =>
                  apt._id === appointmentId ? res.data.data : apt
                )
              );
              Alert.alert('Success', `Appointment marked as ${newStatus}`);
              setShowDetailModal(false);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to update appointment');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return theme.warning;
      case 'Confirmed':
        return theme.success;
      case 'Completed':
        return theme.primary;
      case 'Cancelled':
        return theme.destructive;
      default:
        return theme.labelSecondary;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const AppointmentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => {
        setSelectedAppointment(item);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.appointmentHeader}>
        <Text style={styles.appointmentCustomer}>{item.userId?.name || 'Unknown'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.appointmentService}>
        {item.serviceId?.name || 'Unknown Service'} • {item.stylistId?.name || 'Unknown Stylist'}
      </Text>
      <Text style={styles.appointmentSalon}>{item.salonId?.name || 'Unknown Salon'}</Text>
      <View style={styles.appointmentFooter}>
        <Ionicons name="time" size={14} color={theme.labelSecondary} />
        <Text style={styles.appointmentTime}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && appointments.length === 0) {
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
        <Text style={styles.headerTitle}>All Appointments</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.filterContainer}>
        <Picker
          selectedValue={statusFilter}
          onValueChange={setStatusFilter}
          style={styles.picker}
        >
          <Picker.Item label="All Statuses" value="" />
          <Picker.Item label="Pending" value="Pending" />
          <Picker.Item label="Confirmed" value="Confirmed" />
          <Picker.Item label="Completed" value="Completed" />
          <Picker.Item label="Cancelled" value="Cancelled" />
        </Picker>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <AppointmentItem item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={theme.labelSecondary} />
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        }
      />

      <Modal visible={showDetailModal} animationType="slide" transparent={true} onDismiss={() => setSelectedAppointment(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowDetailModal(false);
              setSelectedAppointment(null);
            }}>
              <Ionicons name="close" size={28} color={theme.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Appointment Details</Text>
            <View style={{ width: 28 }} />
          </View>

          {selectedAppointment && (
            <FlatList
              data={[selectedAppointment]}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <View style={styles.modalContent}>
                  <Text style={styles.detailLabel}>Customer</Text>
                  <Text style={styles.detailValue}>{item.userId?.name || 'N/A'}</Text>

                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{item.userId?.email || 'N/A'}</Text>

                  <Text style={styles.detailLabel}>Salon</Text>
                  <Text style={styles.detailValue}>{item.salonId?.name || 'N/A'}</Text>

                  <Text style={styles.detailLabel}>Service</Text>
                  <Text style={styles.detailValue}>{item.serviceId?.name || 'N/A'}</Text>

                  <Text style={styles.detailLabel}>Stylist</Text>
                  <Text style={styles.detailValue}>{item.stylistId?.name || 'N/A'}</Text>

                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailValue}>
                    ${item.serviceId?.price || '0'} • {item.serviceId?.duration || 'N/A'} mins
                  </Text>

                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20', marginTop: 8 }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {item.status}
                    </Text>
                  </View>

                  <Text style={styles.detailLabel}>Scheduled Date</Text>
                  <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>

                  {item.status !== 'Completed' && item.status !== 'Cancelled' && (
                    <View style={styles.actionSection}>
                      <TouchableOpacity
                        style={[styles.statusBtn, { backgroundColor: theme.success }]}
                        onPress={() => handleUpdateStatus(item._id, 'Completed')}
                      >
                        <Text style={styles.statusBtnText}>Mark as Completed</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.statusBtn, { backgroundColor: theme.destructive }]}
                        onPress={() => handleUpdateStatus(item._id, 'Cancelled')}
                      >
                        <Text style={styles.statusBtnText}>Cancel Appointment</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
  appointmentCard: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.card,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentCustomer: { fontSize: 16, fontWeight: '600', color: theme.labelPrimary, flex: 1 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  appointmentService: { fontSize: 14, color: theme.labelSecondary, marginBottom: 4 },
  appointmentSalon: { fontSize: 14, color: theme.labelPrimary, fontWeight: '500', marginBottom: 8 },
  appointmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  appointmentTime: { fontSize: 12, color: theme.labelSecondary, marginLeft: 6 },
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
  actionSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.separator },
  statusBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  statusBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
});

export default ManageAppointmentsScreen;
