import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import pricingData from '../config/pricing.json';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribePlan: (planId: string) => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose, onSubscribePlan }) => {
  const handleRestorePurchases = async () => {
    Alert.alert('Purchases Restored', 'Your subscription and purchase history have been successfully restored.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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
              <Text style={styles.featureText}>1-Tap Urgent Alarms & Same-Day Alerts</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.featureText}>Export Tasks to Excel CSV & Share Details</Text>
            </View>
          </View>

          {pricingData.plans.filter((plan) => plan.enabled !== false).map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, plan.isPopular && styles.popularPlanCard]}
              onPress={() => onSubscribePlan(plan.id)}
            >
              {plan.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>BEST VALUE - 50% OFF</Text>
                </View>
              )}
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planPromo}>{plan.promoMessage}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.ctaButton} onPress={() => onSubscribePlan('sift_annual_2999')}>
            <Text style={styles.ctaButtonText}>⚡ START 7-DAY FREE TRIAL</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestorePurchases}>
            <Ionicons name="refresh-circle-outline" size={18} color="#818cf8" />
            <Text style={styles.restoreBtnText}>Restore Purchases</Text>
          </TouchableOpacity>

          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://siftapp.com/privacy.html')}>
              <Text style={styles.footerLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.dot}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://siftapp.com/terms.html')}>
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
    marginBottom: 20,
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