import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import theme from '../../constants/theme';

const STATUS_CONFIG = {
  Pending:   { color: '#92400E', bg: '#FEF3C7' },
  Confirmed: { color: '#065F46', bg: '#D1FAE5' },
  Completed: { color: theme.systemGray, bg: theme.systemGray6 },
  Cancelled: { color: '#B91C1C', bg: '#FEE2E2' },
};

const VendorBookingDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;
  const [apt, setApt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadApt = async () => {
    setError(null);
    try {
      const res = await api.get(`/api/appointments/${id}`);
      setApt(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApt(); }, []);

  const handleStatusUpdate = (status) => {
    Alert.alert(
      `Mark as ${status}`,
      `Are you sure you want to mark this booking as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: 'default',
          onPress: async () => {
            try {
              await api.put(`/api/appointments/${id}/status`, { status });
              loadApt();
            } catch (error) {
              Alert.alert('Error', `Failed to update status.`);
            }
          }
        }
      ]
    );
  };

  if (loading || error || !apt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.center}>
          {loading
            ? <ActivityIndicator size="large" color={theme.primary} />
            : <Text style={styles.errorText}>{error || 'Booking not found.'}</Text>
          }
        </View>
      </SafeAreaView>
    );
  }

  const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.Pending;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.statusBanner, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{apt.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={theme.labelSecondary} />
            <Text style={styles.infoText}>{apt.userId?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={theme.labelSecondary} />
            <Text style={styles.infoText}>{apt.userId?.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={styles.infoRow}>
            <Ionicons name="cut-outline" size={20} color={theme.labelSecondary} />
            <Text style={styles.infoText}>{apt.serviceId?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={theme.labelSecondary} />
            <Text style={styles.infoText}>{apt.serviceId?.duration} minutes</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={20} color={theme.labelSecondary} />
            <Text style={styles.infoText}>${apt.serviceId?.price}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={theme.labelSecondary} />
            <Text style={styles.infoText}>{new Date(apt.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={theme.labelSecondary} />
            <Text style={styles.infoText}>{apt.timeSlot}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={20} color={theme.labelSecondary} />
            <Text style={styles.infoText}>Stylist: {apt.stylistId?.name}</Text>
          </View>
        </View>

        {apt.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Notes</Text>
            <Text style={styles.notesText}>{apt.notes}</Text>
          </View>
        )}
      </ScrollView>

      {(apt.status === 'Pending' || apt.status === 'Confirmed') && (
        <View style={styles.footerAction}>
          {apt.status === 'Pending' && (
            <TouchableOpacity style={styles.primaryButton} onPress={() => handleStatusUpdate('Confirmed')}>
              <Text style={styles.primaryButtonText}>Confirm Booking</Text>
            </TouchableOpacity>
          )}
          {apt.status === 'Confirmed' && (
            <TouchableOpacity style={styles.outlineButton} onPress={() => handleStatusUpdate('Completed')}>
              <Text style={styles.outlineButtonText}>Mark as Completed</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 15, color: theme.labelSecondary, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, height: 44, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.separator },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary },
  headerRight: { width: 44 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statusBanner: { padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 24 },
  statusText: { fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { backgroundColor: theme.background, padding: 16, borderRadius: 12, marginBottom: 16, ...theme.shadows.card },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.labelPrimary, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 16, color: theme.labelPrimary, marginLeft: 12 },
  notesText: { fontSize: 15, color: theme.labelSecondary, lineHeight: 22 },
  footerAction: { padding: 16, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.separator },
  primaryButton: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  outlineButton: { borderWidth: 1.5, borderColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  outlineButtonText: { color: theme.primary, fontSize: 16, fontWeight: '600' },
});

export default VendorBookingDetailScreen;
