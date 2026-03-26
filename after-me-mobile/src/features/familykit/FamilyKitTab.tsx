/**
 * Family Kit tab — shows kit history/freshness with a prominent "Create Kit" CTA.
 * Wraps KitHistoryScreen with the Kit Creation Wizard modal.
 * Premium gate is handled entirely inside KitCreationWizard.
 */
import React, { useState } from 'react';
import { KitHistoryScreen } from './KitHistoryScreen';
import { KitCreationWizard } from './KitCreationWizard';

export function FamilyKitTab() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <>
      <KitHistoryScreen onCreateKit={() => setShowWizard(true)} />
      <KitCreationWizard
        visible={showWizard}
        onDismiss={() => setShowWizard(false)}
      />
    </>
  );
}
