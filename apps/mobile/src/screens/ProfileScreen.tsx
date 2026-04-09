import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ActiveVisitBanner from '../components/ui/ActiveVisitBanner';
import ActionButton from '../components/ui/ActionButton';
import AppHeader from '../components/ui/AppHeader';
import InfoRow from '../components/ui/InfoRow';
import ScreenContainer from '../components/ui/ScreenContainer';
import SectionHeader from '../components/ui/SectionHeader';
import SurfaceCard from '../components/ui/SurfaceCard';
import { theme } from '../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScreenContainer contentStyle={styles.content}>
      <AppHeader
        eyebrow="Profil"
        title="Hesap ve ayarlar"
        subtitle="Saha kimliğiniz, oturum ve temel uygulama tercihleri."
      />

      <ActiveVisitBanner />

      <SurfaceCard elevated style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.fullName?.slice(0, 1).toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName || 'Kullanıcı'}</Text>
        <Text style={styles.email}>{user?.email || '-'}</Text>
      </SurfaceCard>

      <SurfaceCard style={styles.sectionCard}>
        <SectionHeader title="Hesap bilgisi" />
        <InfoRow label="Rol" value={user?.role || '-'} />
        <InfoRow label="Oturum" value="Cihazda aktif" muted />
      </SurfaceCard>

      <SurfaceCard style={styles.sectionCard}>
        <SectionHeader title="Uygulama notları" subtitle="MVP aşamasında temel ayarlar sabit tutuluyor." />
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceTitle}>Tema</Text>
          <Text style={styles.preferenceValue}>Açık tema, yüksek kontrast</Text>
        </View>
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceTitle}>Konum</Text>
          <Text style={styles.preferenceValue}>Ziyaret doğrulama için gerekli</Text>
        </View>
      </SurfaceCard>

      <ActionButton label="Güvenli Çıkış" onPress={logout} variant="secondary" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: theme.spacing.lg,
    paddingBottom: 120,
  },
  profileCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  avatarText: {
    fontSize: theme.typography.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryStrong,
  },
  name: {
    fontSize: theme.typography.titleSm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  email: {
    fontSize: theme.typography.body,
    color: theme.colors.textMuted,
  },
  sectionCard: {
    gap: theme.spacing.lg,
  },
  preferenceRow: {
    gap: theme.spacing.xs,
  },
  preferenceTitle: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  preferenceValue: {
    fontSize: theme.typography.bodySm,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
});
