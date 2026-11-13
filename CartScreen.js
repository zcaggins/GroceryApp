import React, { useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { placeOrder } from '../api';
import { colors, formatPrice } from '../theme';

export default function CartScreen({ navigation }) {
  const cart = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fee = cart.delivery?.feeCents ?? null;
  const total = cart.subtotalCents + (fee || 0);

  async function checkout() {
    if (!cart.delivery) {
      return Alert.alert('Check your address', 'Confirm you are inside our 10-mile delivery area first.', [
        { text: 'Check now', onPress: () => navigation.navigate('Delivery') },
      ]);
    }
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) {
      return Alert.alert('Missing info', 'Please enter your name and a 10-digit phone number.');
    }
    setSubmitting(true);
    try {
      const order = await placeOrder({
        customerName: name.trim(),
        phone,
        address: cart.delivery.address,
        lat: cart.delivery.lat,
        lng: cart.delivery.lng,
        items: cart.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });
      cart.clear();
      Alert.alert('Order placed!', `Order #${order.orderId} · ${formatPrice(order.totalCents)}. We'll text you when it's on the way.`);
    } catch (e) {
      Alert.alert('Order not placed', e.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.count === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="basket-outline" size={64} color={colors.border} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Pressable style={styles.primary} onPress={() => navigation.navigate('Shop')}>
          <Text style={styles.primaryText}>Start shopping</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        data={cart.lines}
        keyExtractor={(l) => String(l.product.id)}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: { product, quantity } }) => (
          <View style={styles.line}>
            <Text style={styles.emoji}>{product.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.meta}>{formatPrice(product.priceCents)} / {product.unit}</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable onPress={() => cart.decrement(product.id)} hitSlop={8}>
                <Ionicons name="remove" size={18} color={colors.green} />
              </Pressable>
              <Text style={styles.qty}>{quantity}</Text>
              <Pressable onPress={() => cart.add(product)} hitSlop={8} disabled={quantity >= product.stock}>
                <Ionicons name="add" size={18} color={quantity >= product.stock ? colors.border : colors.green} />
              </Pressable>
            </View>
            <Text style={styles.lineTotal}>{formatPrice(product.priceCents * quantity)}</Text>
          </View>
        )}
        ListFooterComponent={
          <View>
            <Pressable style={styles.deliveryCard} onPress={() => navigation.navigate('Delivery')}>
              <Ionicons name="bicycle-outline" size={22} color={cart.delivery ? colors.green : colors.orange} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{cart.delivery ? 'Delivering to' : 'Delivery address needed'}</Text>
                <Text style={styles.meta}>
                  {cart.delivery
                    ? `${cart.delivery.address} · ${cart.delivery.distanceMiles.toFixed(1)} mi`
                    : 'Tap to confirm you are within 10 miles'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>

            <View style={styles.summary}>
              <Row label="Subtotal" value={formatPrice(cart.subtotalCents)} />
              <Row label="Delivery" value={fee === null ? '—' : fee === 0 ? 'Free' : formatPrice(fee)} />
              <View style={styles.divider} />
              <Row label="Total" value={formatPrice(total)} bold />
            </View>

            <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

            <Pressable style={[styles.primary, submitting && { opacity: 0.6 }]} onPress={checkout} disabled={submitting}>
              <Text style={styles.primaryText}>{submitting ? 'Placing order…' : `Place order · ${formatPrice(total)}`}</Text>
            </Pressable>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const Row = ({ label, value, bold }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
    <Text style={[styles.rowValue, bold && styles.bold]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginVertical: 16 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, padding: 12, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  emoji: { fontSize: 28 },
  name: { fontSize: 15, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qty: { fontWeight: '700', minWidth: 16, textAlign: 'center' },
  lineTotal: { fontWeight: '700', minWidth: 58, textAlign: 'right' },
  deliveryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginTop: 8 },
  summary: { backgroundColor: colors.white, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: colors.muted, fontSize: 15 },
  rowValue: { fontSize: 15 },
  bold: { fontWeight: '700', color: colors.ink, fontSize: 17 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, fontSize: 16, marginTop: 12 },
  primary: { backgroundColor: colors.green, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 24, alignItems: 'center', marginTop: 16 },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
