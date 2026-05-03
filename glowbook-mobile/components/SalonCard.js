import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../constants/theme';

const SalonCard = ({ salon, onPress, style, horizontal = false }) => {
  const image = salon.images?.[0];

  if (horizontal) {
    return (
      <TouchableOpacity style={[styles.hCard, style]} onPress={onPress} activeOpacity={0.85}>
        {image ? (
          <Image source={{ uri: image }} style={styles.hImage} resizeMode="cover" />
        ) : (
          <View style={[styles.hImage, styles.placeholder]}>
            <Ionicons name="storefront-outline" size={28} color={theme.systemGray3} />
          </View>
        )}
        <View style={styles.hContent}>
          <Text style={styles.name} numberOfLines={1}>{salon.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={theme.labelSecondary} />
            <Text style={styles.location} numberOfLines={1}>{salon.location}</Text>
          </View>
          <View style={styles.footer}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{salon.category || 'Salon'}</Text>
            </View>
            {salon.avgRating > 0 && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={11} color={theme.warning} />
                <Text style={styles.ratingText}>{salon.avgRating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.vCard, style]} onPress={onPress} activeOpacity={0.85}>
      {image ? (
        <Image source={{ uri: image }} style={styles.vImage} resizeMode="cover" />
      ) : (
        <View style={[styles.vImage, styles.placeholder]}>
          <Ionicons name="storefront-outline" size={36} color={theme.systemGray3} />
        </View>
      )}
      <View style={styles.vContent}>
        <Text style={styles.name} numberOfLines={1}>{salon.name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={theme.labelSecondary} />
          <Text style={styles.location} numberOfLines={1}>{salon.location}</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{salon.category || 'Salon'}</Text>
          </View>
          {salon.avgRating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={theme.warning} />
              <Text style={styles.ratingText}>{salon.avgRating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  hCard: {
    width: 200,
    backgroundColor: theme.background,
    borderRadius: 14,
    marginRight: 12,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  hImage: {
    width: '100%',
    height: 120,
  },
  hContent: {
    padding: 10,
  },
  vCard: {
    backgroundColor: theme.background,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  vImage: {
    width: '100%',
    height: 160,
  },
  vContent: {
    padding: 12,
  },
  placeholder: {
    backgroundColor: theme.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.labelPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
    color: theme.labelSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    backgroundColor: '#FFF0F4',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.labelSecondary,
  },
});

export default SalonCard;
