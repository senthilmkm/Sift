import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import pricingData from '../config/pricing.json';
import {
  purchaseSubscription,
  restorePurchases,
  getOfferings,
} from '../services/purchaseService';
import { PurchasesPackage } from 'react-native-purchases';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribePlan: (planId: string) => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose, onSubscribePlan }) => {
  const [loading, setLoading] = useState(false);
  const [rcPackages, setRcPackages] = useState<PurchasesPackage[]>([]);

  useEffect(() => {
    if (visible) {
      getOfferings()
        .then((offerings) => {
          if (offerings?.current?.availablePackages) {
            setRcPackages(offerings.current.availablePackages);
          }
        })
        .catch((err) => console.log('[PaywallModal] Offerings fetch notice:', err));
    }
  }, [visible]);

  const handlePlanSelect = async (planId: string) => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await purchaseSubscription(planId);
      if (result.success) {
        onSubscribePlan(planId);
        Alert.alert('Subscribed!', 'Welcome to Sift Pro! Unlimited document scans and Pro tools are now unlocked.');
        onClose();
      } else if (result.error) {
        Alert.alert('Purchase Incomplete', result.error);
      }
      // If user cancelled, do nothing (Apple guideline compliant)
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await restorePurchases();
      if (result.isSubscribed) {
        Alert.alert('Purchases Restored', 'Your Sift Pro subscription has been restored.');
        onSubscribePlan('restored');
        onClose();
      } else if (result.success) {
        Alert.alert(
          'No Active Subscription',
          'We could not find an active Sift Pro subscription associated with this Apple ID.'
        );
      } else {
        Alert.alert('Restore Failed', result.error || 'Unable to restore purchases. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message || 'Unable to restore purchases.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get live StoreKit price if available from RevenueCat
  const getDisplayPrice = (plan: (typeof pricingData.plans)[0]) => {
    const pkg = rcPackages.find((p) => {
      const prodId = (p.product?.identifier || '').toLowerCase();
      const pkgId = (p.identifier || '').toLowerCase();
      const target = plan.id.toLowerCase();
      return prodId === target || pkgId === target || prodId.includes(plan.billingPeriod);
    });
    return pkg?.product?.priceString || plan.price;
  };

  const popularPlan = pricingData.plans.find((p) => p.isPopular) || pricingData.plans[0];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={loading}>
          <Ionicons name="close-circle" size={28} color="#94a3b8" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {pricingData.promotionalBanner?.enabled && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{pricingData.promotionalBanner.bannerText}</Text>
            </View>
          )}

          <Text style={styles.title}>{pricingData.paywallTitle}</Text>
          <Text style={styles.subtitle}>{pricingData.paywallSubtitle}</Text>

          <View style={styles.featuresBox}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.featureText}>Unlimited Gemini 2.5 AI Document Scans</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.featureText}>Itemized Grocery & Receipt Line Items</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.featureText}>1-Tap Excel (.CSV) & PDF CPA Tax Exports</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.featureText}>Time-Sensitive Urgent Reminders & Alarms</Text>
            </View>
          </View>

          <Text style={styles.freeTierNote}>
            Free tier includes 5 scans/month across all 5 profiles. Upgrade to Pro for unlimited scans.
          </Text>

          {pricingData.plans
            .filter((plan) => plan.enabled !== false)
            .map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, plan.isPopular && styles.popularPlanCard]}
                onPress={() => handlePlanSelect(plan.id)}
                disabled={loading}
              >
                {plan.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>BEST VALUE - SAVE 33%</Text>
                  </View>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{getDisplayPrice(plan)}</Text>
                <Text style={styles.planPromo}>{plan.promoMessage}</Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity
            style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
            onPress={() => handlePlanSelect(popularPlan.id)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.ctaButtonText}>⚡ START 7-DAY FREE TRIAL</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestorePurchases}
            disabled={loading}
          >
            <Ionicons name="refresh-circle-outline" size={18} color="#818cf8" />
            <Text style={styles.restoreBtnText}>Restore Purchases</Text>
          </TouchableOpacity>

          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://senthilmkm.github.io/Sift/privacy.html')}>
              <Text style={styles.footerLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.dot}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://senthilmkm.github.io/Sift/terms.html')}>
              <Text style={styles.footerLinkText}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.dot}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:senthil930@gmail.com')}>
              <Text style={styles.footerLinkText}>Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 50,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  banner: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 99,
    marginBottom: 16,
  },
  bannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresBox: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  freeTierNote: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
    lineHeight: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  featureText: {
    color: '#cbd5e1',
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
  },
  planCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  popularPlanCard: {
    borderColor: '#6366f1',
    borderWidth: 2,
    backgroundColor: '#1e1b4b',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 99,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  planName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  planPrice: {
    color: '#818cf8',
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 4,
  },
  planPromo: {
    color: '#94a3b8',
    fontSize: 12,
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 99,
    alignItems: 'center',
    marginTop: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  restoreBtnText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  footerLinkText: {
    color: '#64748b',
    fontSize: 12,
  },
  dot: {
    color: '#64748b',
    marginHorizontal: 8,
  },
});