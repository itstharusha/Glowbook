import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import theme from '../../constants/theme';

const InputRow = ({ label, value, onChangeText, multiline = false, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor={theme.labelTertiary}
      multiline={multiline}
      {...props}
    />
  </View>
);

const VendorAddEditStylistScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  const editId = route.params?.id || null;
  const editStylist = route.params?.stylist || null;

  const [loading, setLoading] = useState(false);
  const [stylistData, setStylistData] = useState({
    name: editStylist?.name || '',
    bio: editStylist?.bio || '',
    specializations: editStylist?.specializations?.join(', ') || '',
  });

  const handleSubmit = async () => {
    if (!stylistData.name.trim()) {
      Alert.alert('Missing Information', 'Please enter the stylist\'s name.');
      return;
    }
    setLoading(true);

    const payload = {
      ...stylistData,
      specializations: stylistData.specializations ? stylistData.specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
    };

    try {
      if (editId) {
        await api.put(`/api/stylists/${editId}`, payload);
      } else {
        await api.post('/api/stylists', { ...payload, salonId: user.ownedSalon });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Something Went Wrong', 'We could not save this stylist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editId ? 'Edit Stylist' : 'Add Stylist'}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <InputRow label="Stylist Name" value={stylistData.name} onChangeText={(t) => setStylistData({ ...stylistData, name: t })} placeholder="Full Name" />
          <InputRow label="Bio" value={stylistData.bio} onChangeText={(t) => setStylistData({ ...stylistData, bio: t })} multiline placeholder="Tell us about the stylist" />
          <InputRow label="Specializations" value={stylistData.specializations} onChangeText={(t) => setStylistData({ ...stylistData, specializations: t })} placeholder="Balayage, Color, Extensions (comma separated)" />
        </View>
      </ScrollView>

      <View style={styles.footerAction}>
        <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          <LinearGradient colors={[theme.primary, '#E40E5A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>{loading ? 'Saving...' : 'Save Stylist'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, height: 44, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.separator },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary },
  headerRight: { width: 44 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  formContainer: { backgroundColor: theme.background, borderRadius: 12, padding: 16, ...theme.shadows.card },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: theme.labelSecondary, marginBottom: 8 },
  input: { backgroundColor: theme.backgroundSecondary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: theme.labelPrimary, borderWidth: 1, borderColor: 'transparent' },
  textArea: { height: 100, textAlignVertical: 'top' },
  footerAction: { padding: 16, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.separator },
  submitButton: { height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  submitButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});

export default VendorAddEditStylistScreen;
