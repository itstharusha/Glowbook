import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, Alert, ActivityIndicator, Platform,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import theme from '../../constants/theme';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const LeaveReviewScreen = ({ navigation, route }) => {
  const { salonId, salonName, appointmentId } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Select a Rating', 'Please tap a star to rate your experience before submitting.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/reviews', { salonId, appointmentId, rating, comment: comment.trim() });
      Alert.alert('Thank you!', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const raw = err.response?.data?.message?.toLowerCase() || '';
      const msg = raw.includes('already')
        ? 'You have already submitted a review for this visit.'
        : 'We could not submit your review. Please try again.';
      Alert.alert('Submission Failed', msg);
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
        <Text style={styles.headerTitle}>Leave a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Salon name */}
        <View style={styles.salonCard}>
          <View style={styles.salonIconWrap}>
            <Ionicons name="storefront-outline" size={24} color={theme.primary} />
          </View>
          <Text style={styles.salonName}>{salonName}</Text>
        </View>

        {/* Star picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starBtn}
              >
                <Ionicons
                  name={rating >= star ? 'star' : 'star-outline'}
                  size={44}
                  color={rating >= star ? theme.warning : theme.systemGray4}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{STAR_LABELS[rating]}</Text>
          )}
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Experience (optional)</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Share details about your visit, the service, the staff…"
            placeholderTextColor={theme.systemGray3}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={5}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || rating === 0}
          activeOpacity={0.85}
          style={[styles.submitWrapper, (loading || rating === 0) && { opacity: 0.6 }]}
        >
          <LinearGradient
            colors={['#FF2D6B', '#FF6B9D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Ionicons name="star" size={18} color="#fff" />
                  <Text style={styles.submitText}>Submit Review</Text>
                </>
              )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundGrouped },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separator,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary },
  content: { padding: 16 },
  salonCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.background, borderRadius: 14,
    padding: 16, marginBottom: 16, ...theme.shadows.card,
  },
  salonIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFF0F4', justifyContent: 'center', alignItems: 'center',
  },
  salonName: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary, flex: 1 },
  section: {
    backgroundColor: theme.background, borderRadius: 14,
    padding: 16, marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: theme.labelSecondary,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  starBtn: { padding: 4 },
  ratingLabel: {
    textAlign: 'center', marginTop: 10,
    fontSize: 16, fontWeight: '600', color: theme.warning,
  },
  textarea: {
    backgroundColor: theme.systemGray6, borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15, color: theme.labelPrimary,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12, color: theme.labelTertiary,
    textAlign: 'right', marginTop: 6,
  },
  submitWrapper: { marginTop: 4 },
  submitBtn: {
    height: 52, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});

export default LeaveReviewScreen;
