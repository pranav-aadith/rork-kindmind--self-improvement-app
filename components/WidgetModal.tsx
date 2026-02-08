import { Sparkles, X, Check, Copy, Download } from 'lucide-react-native';
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import Colors from '@/constants/colors';

const WIDGET_STYLES = [
  { id: 0, name: 'Warm Sunrise', bg: ['#FFF9F5', '#FFE8DC'], accent: '#E8A87C', textColor: '#1A1A1A' },
  { id: 1, name: 'Ocean Calm', bg: ['#E8F4F8', '#D0E8F2'], accent: '#4A9E8E', textColor: '#1A1A1A' },
  { id: 2, name: 'Lavender', bg: ['#F5F0FA', '#E8DFF5'], accent: '#8B7CB8', textColor: '#1A1A1A' },
  { id: 3, name: 'Forest', bg: ['#E8F5E9', '#C8E6C9'], accent: '#4A9E8E', textColor: '#1A1A1A' },
  { id: 4, name: 'Midnight', bg: ['#D4C8E8', '#C5B8DA'], accent: '#B5A8D6', textColor: '#4A4545' },
  { id: 5, name: 'Golden', bg: ['#FFF3E0', '#FFE0B2'], accent: '#D4A373', textColor: '#1A1A1A' },
];

interface WidgetModalProps {
  visible: boolean;
  onClose: () => void;
  quote: string;
}

export default function WidgetModal({ visible, onClose, quote }: WidgetModalProps) {
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const widgetPreviewRef = useRef<View>(null);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const copyQuote = async () => {
    await Clipboard.setStringAsync(quote);
    triggerHaptic();
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const generateWidgetSvg = (quoteText: string, style: typeof WIDGET_STYLES[0]) => {
    const width = 800;
    const height = 500;
    const padding = 48;
    const maxCharsPerLine = 45;
    const words = quoteText.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    words.forEach(word => {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    const escapeXml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const quoteLines = lines.map((line, i) => {
      const y = 200 + i * 36;
      return `<text x="${padding + 24}" y="${y}" fill="${style.textColor}" font-family="Georgia, 'Times New Roman', serif" font-size="24" font-style="italic">"${escapeXml(line)}${i === lines.length - 1 ? '"' : ''}</text>`;
    }).join('');
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${style.bg[0]}" /><stop offset="100%" stop-color="${style.bg[1]}" /></linearGradient></defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bg)" rx="32" />
  <rect x="${padding}" y="${padding}" width="${width - padding * 2}" height="${height - padding * 2}" fill="${style.bg[1]}" rx="24" />
  <rect x="${padding}" y="${padding}" width="6" height="${height - padding * 2}" fill="${style.accent}" rx="3" />
  ${quoteLines}
  <text x="${padding + 24}" y="${height - padding - 24}" fill="${style.textColor}" font-family="Arial, sans-serif" font-size="14" opacity="0.5">KindMind</text>
</svg>`;
  };

  const shareQuoteAsImage = async () => {
    triggerHaptic();
    setIsExporting(true);
    try {
      if (Platform.OS === 'web') {
        const style = WIDGET_STYLES[selectedStyle];
        const svg = generateWidgetSvg(quote, style);
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                const pngUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `kindmind-quote-${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(pngUrl);
              }
              URL.revokeObjectURL(svgUrl);
              setIsExporting(false);
              setCopiedToast(true);
              setTimeout(() => setCopiedToast(false), 2000);
            }, 'image/png');
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          setIsExporting(false);
          Alert.alert('Error', 'Failed to generate image.');
        };
        img.src = svgUrl;
      } else {
        if (widgetPreviewRef.current) {
          const uri = await captureRef(widgetPreviewRef, { format: 'png', quality: 1, result: 'tmpfile' });
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Quote', UTI: 'public.png' });
          } else {
            Alert.alert('Saved', 'Your quote image is ready!');
          }
        }
        setIsExporting(false);
      }
    } catch (error) {
      console.error('[Widget] Export error:', error);
      setIsExporting(false);
      Alert.alert('Error', 'Failed to export quote image.');
    }
  };

  const currentStyle = WIDGET_STYLES[selectedStyle];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Quote Widget</Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <View ref={widgetPreviewRef} collapsable={false} style={[styles.widgetPreview, { backgroundColor: currentStyle.bg[0] }]}>
              <View style={[styles.widgetPreviewInner, { backgroundColor: currentStyle.bg[1] }]}>
                <View style={[styles.widgetAccentBar, { backgroundColor: currentStyle.accent }]} />
                <View style={styles.widgetPreviewContent}>
                  <Sparkles size={20} color={currentStyle.accent} />
                  <Text style={[styles.widgetQuoteText, { color: currentStyle.textColor }]}>{`"${quote}"`}</Text>
                  <Text style={[styles.widgetDateText, { color: currentStyle.textColor, opacity: 0.5 }]}>KindMind</Text>
                </View>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Style</Text>
            <View style={styles.stylesGrid}>
              {WIDGET_STYLES.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[styles.styleOption, { backgroundColor: style.bg[0] }, selectedStyle === style.id && styles.styleOptionSelected]}
                  onPress={() => { triggerHaptic(); setSelectedStyle(style.id); }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.styleInner, { backgroundColor: style.bg[1] }]}>
                    <View style={[styles.styleAccent, { backgroundColor: style.accent }]} />
                  </View>
                  <Text style={[styles.styleName, selectedStyle === style.id && styles.styleNameSelected]}>{style.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={copyQuote} activeOpacity={0.7}>
                <Copy size={18} color={Colors.light.text} />
                <Text style={styles.actionText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={shareQuoteAsImage} activeOpacity={0.7} disabled={isExporting}>
                {isExporting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Download size={18} color="#FFF" />
                    <Text style={styles.shareText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {copiedToast && (
            <View style={styles.toast}>
              <Check size={16} color="#FFF" />
              <Text style={styles.toastText}>Copied!</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.light.border },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600' as const, color: Colors.light.text, letterSpacing: -0.2 },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.textSecondary, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  widgetPreview: { borderRadius: 20, padding: 4, marginBottom: 28 },
  widgetPreviewInner: { borderRadius: 16, padding: 20, minHeight: 180, position: 'relative', overflow: 'hidden' },
  widgetAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  widgetPreviewContent: { paddingLeft: 12, gap: 14 },
  widgetQuoteText: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24, fontStyle: 'italic' as const },
  widgetDateText: { fontSize: 12, fontWeight: '500' as const },
  stylesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  styleOption: { width: '30%', aspectRatio: 1, borderRadius: 14, padding: 3, borderWidth: 2, borderColor: 'transparent' },
  styleOptionSelected: { borderColor: Colors.light.primary },
  styleInner: { flex: 1, borderRadius: 11, position: 'relative', overflow: 'hidden' },
  styleAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 11, borderBottomLeftRadius: 11 },
  styleName: { fontSize: 10, fontWeight: '500' as const, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 6 },
  styleNameSelected: { color: Colors.light.text, fontWeight: '600' as const },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.light.subtle },
  actionText: { fontSize: 14, fontWeight: '600' as const, color: Colors.light.text },
  shareBtn: { backgroundColor: Colors.light.primary },
  shareText: { fontSize: 14, fontWeight: '600' as const, color: '#FFF' },
  toast: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: Colors.light.primary, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  toastText: { fontSize: 14, fontWeight: '600' as const, color: '#FFF' },
});
