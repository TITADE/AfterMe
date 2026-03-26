import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { settingsStyles as styles } from '../settingsStyles';

interface HelpSectionProps {
  onShowHelp: () => void;
}

export function HelpSection({ onShowHelp }: HelpSectionProps) {
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={3.0}>Help</Text>
        <TouchableOpacity
          style={styles.devRow}
          onPress={onShowHelp}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Help and FAQ"
        >
          <Text style={styles.devRowText} maxFontSizeMultiplier={3.0}>Help & FAQ</Text>
          <Text style={styles.devRowHint} maxFontSizeMultiplier={3.0}>Answers to common questions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={3.0}>Support</Text>
        <TouchableOpacity
          style={styles.devRow}
          onPress={() => Linking.openURL('mailto:support@myafterme.co.uk?subject=After%20Me%20Support')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Contact support"
        >
          <Text style={styles.devRowText} maxFontSizeMultiplier={3.0}>Contact Support</Text>
          <Text style={styles.devRowHint} maxFontSizeMultiplier={3.0}>support@myafterme.co.uk</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.devRow}
          onPress={() => Linking.openURL('https://myafterme.co.uk/support')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Visit support centre"
        >
          <Text style={styles.devRowText} maxFontSizeMultiplier={3.0}>Support Centre</Text>
          <Text style={styles.devRowHint} maxFontSizeMultiplier={3.0}>FAQs, guides and help articles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.devRow}
          onPress={() => Linking.openURL('https://myafterme.co.uk/privacy')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="View privacy policy"
        >
          <Text style={styles.devRowText} maxFontSizeMultiplier={3.0}>Privacy Policy</Text>
          <Text style={styles.devRowHint} maxFontSizeMultiplier={3.0}>How we handle your data</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.devRow}
          onPress={() => Linking.openURL('https://myafterme.co.uk/terms')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="View terms of service"
        >
          <Text style={styles.devRowText} maxFontSizeMultiplier={3.0}>Terms of Service</Text>
          <Text style={styles.devRowHint} maxFontSizeMultiplier={3.0}>Your rights and our obligations</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={3.0}>Beta Feedback</Text>
        <TouchableOpacity
          style={styles.devRow}
          onPress={() => Linking.openURL('mailto:support@myafterme.co.uk?subject=After%20Me%20Beta%20Feedback')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Send beta feedback"
        >
          <Text style={styles.devRowText} maxFontSizeMultiplier={3.0}>Send Feedback</Text>
          <Text style={styles.devRowHint} maxFontSizeMultiplier={3.0}>Report bugs or suggest improvements</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
