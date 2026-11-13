import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { fetchDeliveryZone } from '../api';
import { useCart } from '../context/CartContext';
import { distanceMiles, deliveryFeeCents } from '../utils/distance';
import { STORE, DELIVERY_RADIUS_MILES } from '../config';
import { colors, formatPrice } from '../theme';

const METERS_PER_MILE = 1609.34;

export default function DeliveryScreen({ navigation }) {
  const cart = useCart();
  const mapRef = useRef(null);
  const [zone, setZone] = useState({ store: STORE, radiusMiles: DELIVERY_RADIUS_MILES });
  const [address, setAddress] = useState(cart.delivery?.address || '');
  const [result, setResult] = useState(cart.delivery);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchDeliveryZone().then(setZone); }, []);

  const { store, radiusMiles } = zone;
  // Region sized to show the full radius circle
  const latDelta = (radiusMiles * 2.4) / 69;
  const initialRegion = { latitude: store.lat, longitude: store.lng, latitudeDelta: latDelta, longitudeDelta: latDelta };

  function evaluate(lat, lng, label) {
    const miles = distanceMiles(store.lat, store.lng, lat, lng);
    const eligible = miles <= radiusMiles;
    const r = { lat, lng, address: label, distanceMiles: miles, eligible, feeCents: eligible ? deliveryFeeCents(miles) : null };
    setResult(r);
    cart.setDelivery(eligible ? r : null);
    mapRef.current?.fitToCoordinates(
      [{ latitude: store.lat, longitude: store.lng }, { latitude: lat, longitude: lng }],
      { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true }
    );
  }

  async function checkAddress() {
    if (!address.trim()) return setError('Enter a street address.');
    setBusy(true); setError('');
    try {
      const query = /louisville|ky\b|kentucky/i.test(address) ? address : `${address}, Louisville, KY`;
      const [hit] = await Location.geocodeAsync(query);
      if (!hit) throw new Error('We couldn\'t find that address. Try adding the ZIP code.');
      evaluate(hit.latitude, hit.longitude, address.trim());
    } catch (e) {
      setError(e.message || 'Address lookup failed.');
    } finally {
      setBusy(false);
    }
  }

  async function useMyLocation() {
    setBusy(true); setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location permission was denied. You can type your address instead.');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync(pos.coords).catch(() => []);
      const label = place ? [place.streetNumber, place.street, place.city].filter(Boolean).join(' ') : 'Current location';
      setAddress(label);
      evaluate(pos.coords.latitude, pos.coords.longitude, label);
    } catch (e) {
      setError(e.message || 'Could not get your location.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
          <Circle
            center={{ latitude: store.lat, longitude: store.lng }}
            radius={radiusMiles * METERS_PER_MILE}
            strokeColor={colors.green}
            fillColor="rgba(31,94,59,0.12)"
            strokeWidth={2}
          />
          <Marker coordinate={{ latitude: store.lat, longitude: store.lng }} title={store.name} pinColor={colors.green} />
          {result && (
            <Marker
              coordinate={{ latitude: result.lat, longitude: result.lng }}
              title="Your address"
              pinColor={result.eligible ? colors.orange : colors.red}
            />
          )}
        </MapView>

        <View style={styles.body}>
          <Text style={styles.h1}>We deliver within {radiusMiles} miles</Text>
          <Text style={styles.sub}>
            Every order goes out from {store.name}. Check your address to see if you're in the zone and what delivery costs.
          </Text>

          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={18} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Street address or ZIP"
              value={address}
              onChangeText={setAddress}
              onSubmitEditing={checkAddress}
              returnKeyType="search"
            />
          </View>

          <View style={styles.btnRow}>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={checkAddress} disabled={busy}>
              <Text style={styles.btnPrimaryText}>Check address</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnOutline]} onPress={useMyLocation} disabled={busy}>
              <Ionicons name="navigate" size={16} color={colors.green} />
              <Text style={styles.btnOutlineText}>Use my location</Text>
            </Pressable>
          </View>

          {busy && <ActivityIndicator color={colors.green} style={{ marginTop: 16 }} />}
          {!!error && <Text style={styles.error}>{error}</Text>}

          {result && !busy && (
            <View style={[styles.result, result.eligible ? styles.resultYes : styles.resultNo]}>
              <Ionicons
                name={result.eligible ? 'checkmark-circle' : 'close-circle'}
                size={28}
                color={result.eligible ? colors.green : colors.red}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>
                  {result.eligible ? 'Good news — we deliver to you!' : 'Outside our delivery area'}
                </Text>
                <Text style={styles.resultText}>
                  {result.distanceMiles.toFixed(1)} miles from the store
                  {result.eligible
                    ? ` · Delivery ${result.feeCents === 0 ? 'is free' : formatPrice(result.feeCents)}`
                    : ` · our limit is ${radiusMiles} miles`}
                </Text>
                {result.eligible && cart.count > 0 && (
                  <Pressable onPress={() => navigation.navigate('Cart')}>
                    <Text style={styles.link}>Go to checkout →</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          <View style={styles.tiers}>
            <Text style={styles.tiersTitle}>Delivery fees</Text>
            <Tier label="0–3 miles" value="Free" />
            <Tier label="3–6 miles" value="$2.99" />
            <Tier label={`6–${radiusMiles} miles`} value="$4.99" />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Tier = ({ label, value }) => (
  <View style={styles.tier}>
    <Text style={styles.tierLabel}>{label}</Text>
    <Text style={styles.tierValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  map: { height: 300, width: '100%' },
  body: { padding: 16 },
  h1: { fontSize: 22, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 15, color: colors.muted, marginTop: 6, lineHeight: 21 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 12, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, paddingVertical: 12, fontSize: 16 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12 },
  btnPrimary: { backgroundColor: colors.green },
  btnPrimaryText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  btnOutline: { borderWidth: 1.5, borderColor: colors.green },
  btnOutlineText: { color: colors.green, fontWeight: '600', fontSize: 15 },
  error: { color: colors.red, marginTop: 12 },
  result: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, marginTop: 16, borderWidth: 1 },
  resultYes: { backgroundColor: colors.greenLight, borderColor: '#B9D6C3' },
  resultNo: { backgroundColor: '#F6DEDC', borderColor: '#E8B9B5' },
  resultTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  resultText: { fontSize: 14, color: colors.ink, marginTop: 2 },
  link: { color: colors.green, fontWeight: '700', marginTop: 8 },
  tiers: { marginTop: 20, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  tiersTitle: { fontWeight: '700', fontSize: 15, marginBottom: 6 },
  tier: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  tierLabel: { color: colors.muted },
  tierValue: { fontWeight: '600' },
});
