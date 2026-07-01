import React from 'react'
import { Document, Page, View, Text, StyleSheet, Font, Image } from '@react-pdf/renderer'

Font.register({
  family: 'GreatVibes',
  src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/greatvibes/GreatVibes-Regular.ttf',
})

const VIOLET_MID = '#7c3aed'
const INDIGO = '#3730a3'
const INDIGO_MID = '#4f46e5'
const GOLD = '#d97706'
const BG = '#f8f7ff'
const VIOLET_BG = '#ede9fe'
const SLATE_900 = '#0f172a'
const SLATE_700 = '#334155'
const SLATE_500 = '#64748b'
const WHITE = '#ffffff'

const styles = StyleSheet.create({
  page: { backgroundColor: BG, flexDirection: 'column', position: 'relative' },
  watermark: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.06,
  },
  watermarkImage: { width: 640, height: 640, objectFit: 'contain' },
  bandTop: { height: 12, backgroundColor: VIOLET_MID, width: '100%' },
  lisereMid: { height: 3, backgroundColor: GOLD, width: '100%' },
  bandBottom: { height: 12, backgroundColor: VIOLET_MID, width: '100%' },
  lisereBottom: { height: 3, backgroundColor: GOLD, width: '100%' },
  outerBorder: { position: 'absolute', top: 24, left: 24, right: 24, bottom: 24, borderWidth: 1.5, borderColor: INDIGO_MID, borderStyle: 'solid' },
  innerBorder: { position: 'absolute', top: 30, left: 30, right: 30, bottom: 30, borderWidth: 0.5, borderColor: VIOLET_MID, borderStyle: 'solid' },
  cornerTL: { position: 'absolute', top: 34, left: 34, width: 22, height: 22, borderTopWidth: 3, borderLeftWidth: 3, borderColor: GOLD, borderStyle: 'solid' },
  cornerTR: { position: 'absolute', top: 34, right: 34, width: 22, height: 22, borderTopWidth: 3, borderRightWidth: 3, borderColor: GOLD, borderStyle: 'solid' },
  cornerBL: { position: 'absolute', bottom: 34, left: 34, width: 22, height: 22, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: GOLD, borderStyle: 'solid' },
  cornerBR: { position: 'absolute', bottom: 34, right: 34, width: 22, height: 22, borderBottomWidth: 3, borderRightWidth: 3, borderColor: GOLD, borderStyle: 'solid' },
  content: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 70, paddingVertical: 10 },
  brandLine: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: VIOLET_MID, letterSpacing: 3, marginBottom: 12, textAlign: 'center' },
  ruleIndigo: { width: 300, height: 0.75, backgroundColor: INDIGO_MID, marginBottom: 14 },
  pill: { backgroundColor: VIOLET_MID, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5, marginBottom: 14 },
  pillText: { color: WHITE, fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 4 },
  titleMain: { fontSize: 36, fontFamily: 'Times-Roman', color: SLATE_900, textAlign: 'center', marginBottom: 6 },
  subtitleFormation: { fontSize: 11, fontFamily: 'Helvetica', color: SLATE_500, letterSpacing: 2, textAlign: 'center', marginBottom: 14 },
  ruleGold: { width: 100, height: 1.5, backgroundColor: GOLD, marginBottom: 16 },
  decerneLabel: { fontSize: 10, fontFamily: 'Helvetica', color: SLATE_500, letterSpacing: 3, textAlign: 'center', marginBottom: 8 },
  recipientName: { fontSize: 52, fontFamily: 'GreatVibes', color: INDIGO, textAlign: 'center', marginBottom: 16 },
  praticienPour: { fontSize: 12, fontFamily: 'Helvetica', color: SLATE_700, textAlign: 'center', marginBottom: 8, paddingHorizontal: 30 },
  deckTitle: { fontSize: 26, fontFamily: 'Times-BoldItalic', color: GOLD, textAlign: 'center', marginBottom: 10 },
  cardsLine: { fontSize: 11, fontFamily: 'Helvetica', color: SLATE_500, textAlign: 'center', marginBottom: 16 },
  ruleIndigoBottom: { width: 300, height: 0.75, backgroundColor: INDIGO_MID, marginBottom: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 50, marginBottom: 4 },
  footerSide: { flex: 1 },
  footerCenter: { flex: 2, flexDirection: 'column', alignItems: 'center' },
  certLabel: { fontSize: 7, fontFamily: 'Helvetica', color: SLATE_500, letterSpacing: 1.5, textAlign: 'center', marginBottom: 3 },
  certBox: { backgroundColor: VIOLET_BG, borderWidth: 0.75, borderColor: VIOLET_MID, borderStyle: 'solid', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center' },
  certNumber: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: VIOLET_MID, textAlign: 'center' },
  dateText: { fontSize: 9, fontFamily: 'Helvetica', color: SLATE_500, textAlign: 'right' },
})

interface Props {
  recipientName: string
  deckTitle: string
  totalCards: number
  totalModules: number
  certificateNumber: string
  issuedAt: string
  logoSrc: string
}

export default function FlashcardCertificate({
  recipientName, deckTitle, totalCards, totalModules, certificateNumber, issuedAt, logoSrc,
}: Props) {
  const issuedDate = new Date(issuedAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const moduleLabel = totalModules > 1 ? `${totalModules} thèmes` : `${totalModules} thème`

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>

        <View style={styles.watermark}>
          <Image src={logoSrc} style={styles.watermarkImage} />
        </View>

        <View style={styles.bandTop} />
        <View style={styles.lisereMid} />
        <View style={styles.outerBorder} />
        <View style={styles.innerBorder} />
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />

        <View style={styles.content}>
          <Text style={styles.brandLine}>
            OSTEOUPGRADE{' '}<Text style={{ color: GOLD }}>{'×'}</Text>{' '}MYOSTEOFLOW
          </Text>
          <View style={styles.ruleIndigo} />
          <View style={styles.pill}>
            <Text style={styles.pillText}>OSTEOFLASH</Text>
          </View>
          <Text style={styles.titleMain}>Attestation de compl{'é'}tion</Text>
          <Text style={styles.subtitleFormation}>PARCOURS D&apos;ENTRA{'Î'}NEMENT CLINIQUE</Text>
          <View style={styles.ruleGold} />
          <Text style={styles.decerneLabel}>D{'É'}CERN{'É'} {'À'}</Text>
          <Text style={styles.recipientName}>{recipientName}</Text>
          <Text style={styles.praticienPour}>
            Pour avoir ma{'î'}tris{'é'} avec excellence l&apos;int{'é'}gralit{'é'} du th{'è'}me
          </Text>
          <Text style={styles.deckTitle}>{'«'} {deckTitle} {'»'}</Text>
          <Text style={styles.cardsLine}>
            {totalCards} {'é'}l{'é'}ments valid{'é'}s en {moduleLabel}
          </Text>
          <View style={styles.ruleIndigoBottom} />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerSide} />
          <View style={styles.footerCenter}>
            <Text style={styles.certLabel}>NUM{'É'}RO D&apos;ATTESTATION</Text>
            <View style={styles.certBox}>
              <Text style={styles.certNumber}>{certificateNumber}</Text>
            </View>
          </View>
          <View style={[styles.footerSide, { alignItems: 'flex-end' }]}>
            <Text style={styles.dateText}>{issuedDate}</Text>
          </View>
        </View>

        <View style={{ height: 12 }} />
        <View style={styles.lisereBottom} />
        <View style={styles.bandBottom} />
      </Page>
    </Document>
  )
}
