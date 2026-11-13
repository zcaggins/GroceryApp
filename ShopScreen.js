import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchInventory } from '../api';
import { useCart } from '../context/CartContext';
import { colors, formatPrice } from '../theme';

export default function ShopScreen() {
  const cart = useCart();
  const [products, setProducts] = useState([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchInventory();
    setProducts(result.products);
    setOffline(result.offline);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category))], [products]);

  const visible = products.filter((p) =>
    (category === 'All' || p.category === category) &&
    (!inStockOnly || p.stock > 0) &&
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.green} size="large" /></View>;

  return (
    <View style={styles.container}>
      {offline && (
        <View style={styles.banner}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.ink} />
          <Text style={styles.bannerText}>Showing sample inventory — couldn't reach the store server.</Text>
        </View>
      )}

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.search}
          placeholder="Search groceries"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {categories.map((c) => (
          <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setInStockOnly((v) => !v)} style={[styles.chip, inStockOnly && styles.chipActive]}>
          <Text style={[styles.chipText, inStockOnly && styles.chipTextActive]}>In stock</Text>
        </Pressable>
      </ScrollView>

      <FlatList
        data={visible}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
        ListEmptyComponent={<Text style={styles.empty}>No items match your search.</Text>}
        renderItem={({ item }) => <ProductRow product={item} cart={cart} />}
      />
    </View>
  );
}

function ProductRow({ product, cart }) {
  const qty = cart.quantityOf(product.id);
  const out = product.stock === 0;
  const low = !out && product.stock <= 10;

  return (
    <View style={[styles.card, out && { opacity: 0.55 }]}>
      <Text style={styles.emoji}>{product.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.meta}>{formatPrice(product.priceCents)} / {product.unit}</Text>
        <View style={styles.tags}>
          {product.isLocal && <Text style={[styles.tag, styles.tagLocal]}>Local</Text>}
          <Text style={[styles.tag, out ? styles.tagOut : low ? styles.tagLow : styles.tagIn]}>
            {out ? 'Out of stock' : low ? `Only ${product.stock} left` : `${product.stock} in stock`}
          </Text>
        </View>
      </View>

      {qty === 0 ? (
        <Pressable
          disabled={out}
          onPress={() => cart.add(product)}
          style={[styles.addBtn, out && { backgroundColor: colors.border }]}
          accessibilityLabel={`Add ${product.name} to cart`}
        >
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      ) : (
        <View style={styles.stepper}>
          <Pressable onPress={() => cart.decrement(product.id)} hitSlop={8} accessibilityLabel="Remove one">
            <Ionicons name="remove" size={20} color={colors.green} />
          </Pressable>
          <Text style={styles.qty}>{qty}</Text>
          <Pressable onPress={() => cart.add(product)} disabled={qty >= product.stock} hitSlop={8} accessibilityLabel="Add one">
            <Ionicons name="add" size={20} color={qty >= product.stock ? colors.border : colors.green} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FCEBD9', padding: 10, paddingHorizontal: 16 },
  bannerText: { fontSize: 13, color: colors.ink, flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, marginBottom: 8, paddingHorizontal: 12, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  search: { flex: 1, paddingVertical: 12, fontSize: 16 },
  chips: { flexGrow: 0, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, marginRight: 8 },
  chipActive: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { color: colors.ink, fontWeight: '500' },
  chipTextActive: { color: colors.white },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, gap: 12 },
  emoji: { fontSize: 34 },
  name: { fontSize: 16, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted, marginTop: 2 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tag: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  tagLocal: { backgroundColor: '#FCEBD9', color: colors.orange },
  tagIn: { backgroundColor: colors.greenLight, color: colors.green },
  tagLow: { backgroundColor: '#FFF4CC', color: '#7A5B00' },
  tagOut: { backgroundColor: '#F6DEDC', color: colors.red },
  addBtn: { backgroundColor: colors.green, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.green, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  qty: { fontSize: 16, fontWeight: '700', minWidth: 18, textAlign: 'center' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
