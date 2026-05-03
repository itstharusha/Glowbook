import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Image, FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import theme from '../../constants/theme';
import PortfolioCard from '../../components/PortfolioCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StarRow = ({ rating, size = 14 }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <Ionicons
        key={s}
        name={s <= Math.round(rating) ? 'star' : 'star-outline'}
        size={size}
        color={theme.warning}
      />
    ))}
  </View>
);

const formatDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const SalonDetailScreen = ({ navigation, route }) => {
  const { salonId } = route.params;
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [salonRes, servicesRes, stylistsRes, portfolioRes, reviewsRes] = await Promise.all([
          api.get(`/api/salons/${salonId}`),
          api.get(`/api/services/salon/${salonId}`),
          api.get(`/api/stylists/salon/${salonId}`),
          api.get(`/api/portfolio/salon/${salonId}`),
          api.get(`/api/reviews/salon/${salonId}`),
        ]);
        setSalon(salonRes.data.data);
        setServices(servicesRes.data.data || []);
        setStylists(stylistsRes.data.data || []);
        setPortfolio(portfolioRes.data.data || []);
        setReviews(reviewsRes.data.data || []);
      } catch (err) {
        console.error('SalonDetail load error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [salonId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.labelPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!salon) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.labelPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={{ color: theme.labelSecondary }}>Salon not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const images = salon.images || [];
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const TABS = ['services', 'stylists', 'portfolio', 'reviews'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.labelPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{salon.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        {images.length > 0 ? (
          <View>
            <FlatList
              data={images}
              keyExtractor={(_, i) => String(i)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={e => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
              scrollEventThrottle={16}
              renderItem={({ item: uri }) => (
                <Image source={{ uri }} style={{ width: SCREEN_WIDTH, height: 240 }} resizeMode="cover" />
              )}
            />
            {images.length > 1 && (
              <View style={styles.dots}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="storefront-outline" size={64} color={theme.systemGray3} />
          </View>
        )}

        {/* Salon info */}
        <View style={styles.infoCard}>
          <View style={styles.nameRow}>
            <Text style={styles.salonName}>{salon.name}</Text>
            {salon.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color={theme.success} />
            )}
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={theme.labelSecondary} />
            <Text style={styles.metaText}>{salon.location}</Text>
          </View>
          {salon.phoneNumber ? (
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={14} color={theme.labelSecondary} />
              <Text style={styles.metaText}>{salon.phoneNumber}</Text>
            </View>
          ) : null}
          {reviews.length > 0 && (
            <View style={styles.metaRow}>
              <StarRow rating={avgRating} />
              <Text style={styles.metaText}>
                {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {salon.description ? (
            <Text style={styles.description}>{salon.description}</Text>
          ) : null}
          {salon.category ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{salon.category}</Text>
            </View>
          ) : null}
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'reviews'
                  ? `Reviews${reviews.length > 0 ? ` (${reviews.length})` : ''}`
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>

          {/* Services */}
          {activeTab === 'services' && (
            <View>
              {services.filter(s => s.isActive !== false).length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="cut-outline" size={40} color={theme.systemGray3} />
                  <Text style={styles.emptyTabText}>No services listed yet</Text>
                </View>
              ) : (
                services.filter(s => s.isActive !== false).map(service => (
                  <View key={service._id} style={styles.serviceCard}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceMeta}>{service.duration} min</Text>
                      {service.description ? (
                        <Text style={styles.serviceDesc} numberOfLines={2}>{service.description}</Text>
                      ) : null}
                    </View>
                    <View style={styles.serviceRight}>
                      <Text style={styles.servicePrice}>${service.price}</Text>
                      <TouchableOpacity
                        style={styles.bookBtn}
                        onPress={() => navigation.navigate('BookAppointment', { salonId, service, salon })}
                      >
                        <Text style={styles.bookBtnText}>Book</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Stylists */}
          {activeTab === 'stylists' && (
            <View>
              {stylists.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="people-outline" size={40} color={theme.systemGray3} />
                  <Text style={styles.emptyTabText}>No stylists listed yet</Text>
                </View>
              ) : (
                stylists.map(stylist => (
                  <View key={stylist._id} style={styles.stylistCard}>
                    <View style={styles.stylistAvatar}>
                      <Ionicons name="person" size={22} color={theme.primary} />
                    </View>
                    <View style={styles.stylistInfo}>
                      <Text style={styles.stylistName}>{stylist.name}</Text>
                      {stylist.specializations?.length > 0 && (
                        <Text style={styles.stylistSpec}>{stylist.specializations.join(' · ')}</Text>
                      )}
                      {stylist.bio ? (
                        <Text style={styles.stylistBio} numberOfLines={2}>{stylist.bio}</Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Portfolio */}
          {activeTab === 'portfolio' && (
            <View>
              {portfolio.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="images-outline" size={40} color={theme.systemGray3} />
                  <Text style={styles.emptyTabText}>No portfolio items yet</Text>
                </View>
              ) : (
                portfolio.map(item => (
                  <PortfolioCard
                    key={item._id}
                    item={item}
                    showActions={false}
                    onPress={() => navigation.navigate('CustomerPortfolioView', { item })}
                  />
                ))
              )}
            </View>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <View>
              {reviews.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="star-outline" size={40} color={theme.systemGray3} />
                  <Text style={styles.emptyTabText}>No reviews yet</Text>
                  <Text style={styles.emptyTabSub}>Complete an appointment to leave one</Text>
                </View>
              ) : (
                <>
                  {/* Rating summary */}
                  <View style={styles.ratingCard}>
                    <Text style={styles.bigRating}>{avgRating.toFixed(1)}</Text>
                    <StarRow rating={avgRating} size={22} />
                    <Text style={styles.reviewCount}>
                      {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {reviews.map(review => (
                    <View key={review._id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewerLeft}>
                          <View style={styles.reviewerAvatar}>
                            <Ionicons name="person" size={16} color={theme.primary} />
                          </View>
                          <View>
                            <Text style={styles.reviewerName}>
                              {review.userId?.name || 'Anonymous'}
                            </Text>
                            <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                          </View>
                        </View>
                        <StarRow rating={review.rating} size={13} />
                      </View>
                      {review.comment ? (
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                      ) : null}
                    </View>
                  ))}
                </>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundGrouped },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderHeader: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separator,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separator,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary, flex: 1, textAlign: 'center' },
  imagePlaceholder: {
    width: SCREEN_WIDTH, height: 240,
    backgroundColor: theme.systemGray6,
    justifyContent: 'center', alignItems: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.systemGray3 },
  dotActive: { backgroundColor: theme.primary, width: 18 },
  infoCard: { backgroundColor: theme.background, padding: 16, marginBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  salonName: { fontSize: 22, fontWeight: '700', color: theme.labelPrimary, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  metaText: { fontSize: 14, color: theme.labelSecondary },
  description: { fontSize: 15, color: theme.labelPrimary, lineHeight: 22, marginTop: 10, marginBottom: 10 },
  chip: {
    alignSelf: 'flex-start', backgroundColor: '#FFF0F4',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.primary },
  tabBar: {
    flexDirection: 'row', backgroundColor: theme.background,
    borderBottomWidth: 1, borderBottomColor: theme.separator,
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: theme.primary },
  tabText: { fontSize: 12, fontWeight: '500', color: theme.labelSecondary },
  activeTabText: { color: theme.primary, fontWeight: '600' },
  tabContent: { padding: 16 },
  emptyTab: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTabText: { fontSize: 15, color: theme.labelSecondary },
  emptyTabSub: { fontSize: 13, color: theme.labelTertiary },
  serviceCard: {
    flexDirection: 'row', backgroundColor: theme.background,
    borderRadius: 14, padding: 14, marginBottom: 10, alignItems: 'flex-start',
    ...theme.shadows.card,
  },
  serviceInfo: { flex: 1, marginRight: 12 },
  serviceName: { fontSize: 16, fontWeight: '600', color: theme.labelPrimary, marginBottom: 4 },
  serviceMeta: { fontSize: 13, color: theme.labelSecondary, marginBottom: 4 },
  serviceDesc: { fontSize: 13, color: theme.labelSecondary, lineHeight: 18 },
  serviceRight: { alignItems: 'flex-end', gap: 8 },
  servicePrice: { fontSize: 18, fontWeight: '700', color: theme.primary },
  bookBtn: { backgroundColor: theme.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 7 },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  stylistCard: {
    flexDirection: 'row', backgroundColor: theme.background,
    borderRadius: 14, padding: 14, marginBottom: 10, alignItems: 'flex-start',
    gap: 12, ...theme.shadows.card,
  },
  stylistAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFF0F4', justifyContent: 'center', alignItems: 'center',
  },
  stylistInfo: { flex: 1 },
  stylistName: { fontSize: 16, fontWeight: '600', color: theme.labelPrimary, marginBottom: 4 },
  stylistSpec: { fontSize: 13, color: theme.primary, fontWeight: '500', marginBottom: 4 },
  stylistBio: { fontSize: 13, color: theme.labelSecondary, lineHeight: 18 },
  ratingCard: {
    backgroundColor: theme.background, borderRadius: 14,
    padding: 20, marginBottom: 12, alignItems: 'center', gap: 6,
    ...theme.shadows.card,
  },
  bigRating: { fontSize: 48, fontWeight: '700', color: theme.labelPrimary, lineHeight: 52 },
  reviewCount: { fontSize: 14, color: theme.labelSecondary, marginTop: 4 },
  reviewCard: {
    backgroundColor: theme.background, borderRadius: 14,
    padding: 14, marginBottom: 10, ...theme.shadows.card,
  },
  reviewHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  reviewerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FFF0F4', justifyContent: 'center', alignItems: 'center',
  },
  reviewerName: { fontSize: 14, fontWeight: '600', color: theme.labelPrimary },
  reviewDate: { fontSize: 12, color: theme.labelSecondary, marginTop: 2 },
  reviewComment: { fontSize: 14, color: theme.labelPrimary, lineHeight: 20 },
});

export default SalonDetailScreen;
