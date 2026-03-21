/**
 * Family Kit tab — shows kit history/freshness with a prominent "Create Kit" CTA.
 * Wraps KitHistoryScreen with the Kit Creation Wizard modal.
 * Premium gate: kit creation requires a premium subscription.
 */
import React, { useState } from 'react';
import { KitHistoryScreen } from './KitHistoryScreen';
import { KitCreationWizard } from './KitCreationWizard';
import { PaywallScreen } from '../paywall/PaywallScreen';
import { usePurchase } from '../../context/PurchaseContext';

export function FamilyKitTab() {
  const { isPremium } = usePurchase();
  const [showWizard, setShowWizard] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleCreateKit = () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    setShowWizard(true);
  };

  return (
    <>
      <KitHistoryScreen onCreateKit={handleCreateKit} />
      <KitCreationWizard
        visible={showWizard}
        onDismiss={() => setShowWizard(false)}
      />
      <PaywallScreen
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
        trigger="family_kit"
      />
    </>
  );
}
