import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import theme from '../../constants/theme';

const VendorBookingDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;
  const [apt, setApt] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadApt = async () => {
    try {
      // Reusing vendor-salon since we don't have a single-get vendor booking endpoint
      const res = await api.get('/api/appointments/vendor-salon');
      const found = res.data.data.find(a => a._id === id);
      setApt(found);
    } catch (err) {
      console.error(err);
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
              alert(`Failed to set status to ${status}`);
            }
          }
        }
      ]
    );
  };

  if (loading || !apt) return <View style={styles.center}><Text>Loading...</Text></View>;

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
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>{apt.status}</Text>
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
        {(apt.status === 'Completed' || apt.status === 'Cancelled') && (
          <View style={styles.disabledButton}>
            <Text style={styles.disabledText}>No actions available</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, height: 44, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.separator },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary },
  headerRight: { width: 44 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statusBanner: { backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 24, opacity: 0.9 },
  statusText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
  section: { backgroundColor: theme.background, padding: 16, borderRadius: 12, marginBottom: 16, ...theme.shadows.card },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.labelPrimary, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 16, color: theme.labelPrimary, marginLeft: 12 },
  notesText: { fontSize: 15, color: theme.labelSecondary, lineHeight: 22 },
  footerAction: { padding: 16, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.separator },
  primaryButton: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  outlineButton: { borderWidth: 1, borderColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  outlineButtonText: { color: theme.primary, fontSize: 16, fontWeight: 'bold' },
  disabledButton: { backgroundColor: theme.systemGray4, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  disabledText: { color: theme.labelSecondary, fontSize: 16, fontWeight: 'bold' },
});

export default VendorBookingDetailScreen;
