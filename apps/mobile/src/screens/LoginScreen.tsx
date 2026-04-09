import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import ActionButton from '../components/ui/ActionButton';
import InlineAlert from '../components/ui/InlineAlert';
import ScreenContainer from '../components/ui/ScreenContainer';
import SurfaceCard from '../components/ui/SurfaceCard';
import TextField from '../components/ui/TextField';
import { theme } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email ve şifre gereklidir');
      return;
    }
    if (!email.includes('@')) {
      setError('Geçerli bir email adresi girin');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Giriş başarısız');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenContainer contentStyle={styles.inner}>
        <View style={styles.header}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>FC</Text>
          </View>
          <Text style={styles.title}>Field CRM</Text>
          <Text style={styles.subtitle}>
            Saha operasyonunu hızlı, okunaklı ve güvenilir şekilde yönetin.
          </Text>
        </View>

        <View style={styles.highlights}>
          <View style={styles.highlightItem}>
            <Text style={styles.highlightValue}>Hızlı giriş</Text>
            <Text style={styles.highlightLabel}>Tek ekranda oturum açın</Text>
          </View>
          <View style={styles.highlightItem}>
            <Text style={styles.highlightValue}>Saha odaklı</Text>
            <Text style={styles.highlightLabel}>Yüksek kontrast, net aksiyon</Text>
          </View>
        </View>

        <SurfaceCard elevated style={styles.formCard}>
          <View style={styles.form}>
            <TextField
              label="Email"
              placeholder="ornek@fieldcrm.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextField
              label="Şifre"
              placeholder="Şifrenizi girin"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              trailingLabel={showPassword ? 'Gizle' : 'Göster'}
              onTrailingPress={() => setShowPassword((current) => !current)}
            />

            {error ? <InlineAlert message={error} tone="danger" /> : null}

            <ActionButton label="Giriş Yap" onPress={handleLogin} loading={loading} />
          </View>
        </SurfaceCard>

        {__DEV__ ? (
          <TouchableOpacity style={styles.devHint}>
            <Text style={styles.devHintTitle}>Geliştirme hesabı</Text>
            <Text style={styles.devHintText}>ahmet@fieldcrm.com / saha1234</Text>
          </TouchableOpacity>
        ) : null}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: theme.spacing['3xl'],
    gap: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  logoMark: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  logoMarkText: {
    color: theme.colors.surface,
    fontSize: theme.typography.titleSm,
    fontWeight: theme.fontWeight.bold,
  },
  title: {
    fontSize: theme.typography.titleLg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.body,
    lineHeight: 22,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  formCard: {
    paddingVertical: theme.spacing.xl,
  },
  form: {
    gap: theme.spacing.lg,
  },
  highlights: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  highlightItem: {
    flex: 1,
    backgroundColor: theme.colors.backgroundAccent,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  highlightValue: {
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  highlightLabel: {
    fontSize: theme.typography.bodySm,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  devHint: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  devHintTitle: {
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  devHintText: {
    fontSize: theme.typography.bodySm,
    color: theme.colors.textMuted,
  },
});
