import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Linking, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitInvolvement } from '../api';
import { colors } from '../theme';

// Official LCG links. The donate button stays hidden until a donation URL is set.
const LINKS = {
  website: 'https://louisvillecommunitygrocery.com/',
  ownership: 'https://louisvillecommunitygrocery.com/ownership/',
  email: 'mailto:louisvillecommunitygrocery@gmail.com?subject=Becoming%20an%20LCG%20owner',
  donate: '',
};

const WAYS = [
  {
    key: 'member-owner',
    icon: 'people',
    title: 'Become a member-owner',
    body: 'LCG is a cooperative owned by its shoppers and workers. Consumer ownership is a one-time $150 fee. Online applications are paused, so email LCG to start the process.',
    link: { label: 'Ownership details', url: LINKS.ownership },
  },
  {
    key: 'volunteer',
    icon: 'hand-left',
    title: 'Volunteer',
    body: 'Help with outreach events, pack and deliver produce bags, or staff tables at markets and community gatherings.',
  },
  {
    key: 'committee',
    icon: 'git-network',
    title: 'Join a committee',
    body: 'Work with LACE, the nonprofit developing the grocery, on Community Outreach, Market Research & Real Estate, Governance & Membership, or Finance & Fundraising.',
  },
  {
    key: 'donate',
    icon: 'heart',
    title: 'Donate',
    body: 'Gifts help bring a community-owned, full-service grocery to Louisville neighborhoods that have lost theirs.',
  },
  {
    key: 'newsletter',
    icon: 'mail',
    title: 'Stay in the loop',
    body: 'Get updates on owner meetings, the store opening, and ways to help.',
  },
];

export default function InvolvedScreen() {
  const [interest, setInterest] = useState('member-owner');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return Alert.alert('Almost there', 'Please add your name and a valid email.');
    }
    setSending(true);
    try {
      await submitInvolvement({ name: name.trim(), email: email.trim(), interest, message: message.trim() });
      setName(''); setEmail(''); setMessage('');
      Alert.alert('Thank you!', 'Someone from the LCG team will reach out soon.');
    } catch (e) {
      Alert.alert('Not sent', e.message || 'Please try again later.');
    } finally {
      setSending(false);
    }
  }

  const selected = WAYS.find((w) => w.key === interest);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>COMMUNITY-OWNED</Text>
          <Text style={styles.heroTitle}>Fresh, healthy food — owned by the neighborhood.</Text>
          <Text style={styles.heroBody}>
            The Louisville Community Grocery is a cooperative grocery for neighborhoods left behind by big chains.
            When the community owns the store, the money stays here and the store answers to its neighbors.
          </Text>
        </View>

        <Text style={styles.section}>Ways to get involved</Text>
        {WAYS.map((w) => (
          <Pressable
            key={w.key}
            onPress={() => setInterest(w.key)}
            style={[styles.way, interest === w.key && styles.wayActive]}
            accessibilityState={{ selected: interest === w.key }}
          >
            <View style={[styles.iconWrap, interest === w.key && { backgroundColor: colors.green }]}>
              <Ionicons name={w.icon} size={20} color={interest === w.key ? colors.white : colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.wayTitle}>{w.title}</Text>
              <Text style={styles.wayBody}>{w.body}</Text>
              {w.link && (
                <Pressable onPress={() => Linking.openURL(w.link.url)} hitSlop={6}>
                  <Text style={styles.wayLink}>{w.link.label} →</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        ))}

        <Text style={styles.section}>Sign up: {selected.title.toLowerCase()}</Text>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          placeholder="Anything you'd like us to know? (optional)"
          multiline
          value={message}
          onChangeText={setMessage}
        />
        <Pressable style={[styles.primary, sending && { opacity: 0.6 }]} onPress={submit} disabled={sending}>
          <Text style={styles.primaryText}>{sending ? 'Sending…' : 'Count me in'}</Text>
        </Pressable>

        <View style={styles.linkRow}>
          {!!LINKS.website && (
            <Pressable style={styles.secondary} onPress={() => Linking.openURL(LINKS.website)}>
              <Ionicons name="globe-outline" size={16} color={colors.green} />
              <Text style={styles.secondaryText}>Visit website</Text>
            </Pressable>
          )}
          <Pressable style={styles.secondary} onPress={() => Linking.openURL(LINKS.email)}>
            <Ionicons name="mail-outline" size={16} color={colors.green} />
            <Text style={styles.secondaryText}>Email LCG</Text>
          </Pressable>
          {!!LINKS.donate && (
            <Pressable style={styles.secondary} onPress={() => Linking.openURL(LINKS.donate)}>
              <Ionicons name="heart-outline" size={16} color={colors.green} />
              <Text style={styles.secondaryText}>Donate</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  hero: { backgroundColor: colors.green, borderRadius: 18, padding: 20 },
  heroKicker: { color: '#F7C8A0', fontWeight: '700', letterSpacing: 1.2, fontSize: 12 },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 6, lineHeight: 28 },
  heroBody: { color: '#DCEBE1', fontSize: 15, marginTop: 10, lineHeight: 21 },
  section: { fontSize: 17, fontWeight: '700', marginTop: 24, marginBottom: 10, color: colors.ink },
  way: { flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: colors.border },
  wayActive: { borderColor: colors.green },
  iconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  wayTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  wayBody: { fontSize: 14, color: colors.muted, marginTop: 3, lineHeight: 19 },
  wayLink: { fontSize: 14, color: colors.green, fontWeight: '700', marginTop: 6 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, fontSize: 16, marginBottom: 10 },
  primary: { backgroundColor: colors.orange, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  linkRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondary: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.green, borderRadius: 12, paddingVertical: 12 },
  secondaryText: { color: colors.green, fontWeight: '600' },
});
