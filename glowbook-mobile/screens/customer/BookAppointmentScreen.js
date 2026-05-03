import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import theme from '../../constants/theme';

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  '5:00 PM', '5:30 PM',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getNext14Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
};

const BookAppointmentScreen = ({ navigation, route }) => {
  const { salonId, service, salon } = route.params;
  const [stylists, setStylists] = useState([]);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getNext14Days()[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [stylistsLoading, setStylistsLoading] = useState(true);
  const dates = getNext14Days();

  useEffect(() => {
    api.get(`/api/stylists/salon/${salonId}`)
      .then(res => {
        const list = res.data.data || [];
        setStylists(list);
        if (list.length === 1) setSelectedStylist(list[0]);
      })
      .catch(err => console.error('Load stylists error:', err.message))
      .finally(() => setStylistsLoading(false));
  }, [salonId]);

  const handleConfirm = async () => {
    if (!selectedStylist) {
      Alert.alert('Required', 'Please select a stylist.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Required', 'Please choose a time slot.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/appointments', {
        salonId,
        serviceId: service._id,
        stylistId: selectedStylist._id,
        date: selectedDate.toISOString(),
        timeSlot: selectedSlot,
        notes: notes.trim(),
      });

      Alert.alert(
        'Booking Confirmed!',
        `Your appointment at ${salon.name} is pending confirmation.`,
        [{ text: 'View Bookings', onPress: () => navigation.navigate('Bookings') }]
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to book appointment.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.labelPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Service Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Service</Text>
          <View style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceMeta}>{service.duration} min · {salon.name}</Text>
            </View>
            <Text style={styles.servicePrice}>${service.price}</Text>
          </View>
        </View>

        {/* Stylist Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Stylist</Text>
          {stylistsLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
          ) : stylists.length === 0 ? (
            <Text style={styles.noStylistText}>No stylists available for this salon.</Text>
          ) : (
            stylists.map(stylist => (
              <TouchableOpacity
                key={stylist._id}
                style={[styles.stylistRow, selectedStylist?._id === stylist._id && styles.stylistRowActive]}
                onPress={() => setSelectedStylist(stylist)}
                activeOpacity={0.75}
              >
                <View style={[styles.stylistAvatar, selectedStylist?._id === stylist._id && styles.stylistAvatarActive]}>
                  <Ionicons name="person" size={18} color={selectedStylist?._id === stylist._id ? '#fff' : theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stylistName, selectedStylist?._id === stylist._id && styles.stylistNameActive]}>
                    {stylist.name}
                  </Text>
                  {stylist.specializations?.length > 0 && (
                    <Text style={styles.stylistSpec}>{stylist.specializations.join(', ')}</Text>
                  )}
                </View>
                {selectedStylist?._id === stylist._id && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesRow}>
            {dates.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateBtn, isSelected && styles.dateBtnActive]}
                  onPress={() => setSelectedDate(date)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dateDayName, isSelected && styles.dateTextActive]}>
                    {DAY_NAMES[date.getDay()]}
                  </Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateTextActive]}>
                    {date.getDate()}
                  </Text>
                  <Text style={[styles.dateMonth, isSelected && styles.dateTextActive]}>
                    {MONTH_NAMES[date.getMonth()]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Slot Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Time</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map(slot => (
              <TouchableOpacity
                key={slot}
                style={[styles.slotBtn, selectedSlot === slot && styles.slotBtnActive]}
                onPress={() => setSelectedSlot(slot)}
                activeOpacity={0.75}
              >
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any special requests or notes…"
            placeholderTextColor={theme.systemGray3}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            maxLength={300}
          />
        </View>

        {/* Confirm Button */}
        <TouchableOpacity onPress={handleConfirm} disabled={loading} style={styles.confirmWrapper} activeOpacity={0.85}>
          <LinearGradient
            colors={['#FF2D6B', '#FF6B9D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmBtn}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Ionicons name="calendar-outline" size={20} color="#fff" />
                  <Text style={styles.confirmText}>Confirm Booking</Text>
                </>
              )
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundGrouped },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separator,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary },
  scrollContent: { padding: 16 },
  section: {
    backgroundColor: theme.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.labelSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary },
  serviceMeta: { fontSize: 13, color: theme.labelSecondary, marginTop: 4 },
  servicePrice: { fontSize: 22, fontWeight: '700', color: theme.primary },
  noStylistText: { fontSize: 14, color: theme.labelSecondary, textAlign: 'center', paddingVertical: 8 },
  stylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.systemGray6,
    marginBottom: 8,
  },
  stylistRowActive: { backgroundColor: '#FFF0F4', borderWidth: 1.5, borderColor: theme.primary },
  stylistAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFF0F4',
    justifyContent: 'center', alignItems: 'center',
  },
  stylistAvatarActive: { backgroundColor: theme.primary },
  stylistName: { fontSize: 15, fontWeight: '600', color: theme.labelPrimary },
  stylistNameActive: { color: theme.primary },
  stylistSpec: { fontSize: 12, color: theme.labelSecondary, marginTop: 2 },
  datesRow: { gap: 8, paddingRight: 4 },
  dateBtn: {
    width: 60,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.systemGray6,
    alignItems: 'center',
    gap: 2,
  },
  dateBtnActive: { backgroundColor: theme.primary },
  dateDayName: { fontSize: 11, fontWeight: '500', color: theme.labelSecondary },
  dateNumber: { fontSize: 18, fontWeight: '700', color: theme.labelPrimary },
  dateMonth: { fontSize: 11, color: theme.labelSecondary },
  dateTextActive: { color: '#fff' },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.systemGray6,
    alignItems: 'center',
  },
  slotBtnActive: { backgroundColor: theme.primary },
  slotText: { fontSize: 13, fontWeight: '500', color: theme.labelPrimary },
  slotTextActive: { color: '#fff', fontWeight: '600' },
  notesInput: {
    backgroundColor: theme.systemGray6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: theme.labelPrimary,
    height: 80,
    textAlignVertical: 'top',
  },
  confirmWrapper: { marginTop: 8 },
  confirmBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});

export default BookAppointmentScreen;
