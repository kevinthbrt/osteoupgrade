import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const VIOLET_MID = '#7c3aed'
const INDIGO = '#3730a3'
const INDIGO_MID = '#4f46e5'
const GOLD = '#d97706'
const BG = '#f8f7ff'
const VIOLET_BG = '#ede9fe'
const SLATE_900 = '#0f172a'
const SLATE_700 = '#334155'
const SLATE_500 = '#64748b'
const SLATE_200 = '#e2e8f0'
const WHITE = '#ffffff'

const styles = StyleSheet.create({
  page: {
    backgroundColor: BG,
    flexDirection: 'column',
    position: 'relative',
  },
  bandTop: {
    height: 10,
    backgroundColor: VIOLET_MID,
    width: '100%',
  },
  lisereMid: {
    height: 2.5,
    backgroundColor: GOLD,
    width: '100%',
  },
  bandBottom: {
    height: 10,
    backgroundColor: VIOLET_MID,
    width: '100%',
  },
  lisereBottom: {
    height: 2.5,
    backgroundColor: GOLD,
    width: '100%',
  },
  outerBorder: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 1.5,
    borderColor: INDIGO_MID,
    borderStyle: 'solid',
  },
  innerBorder: {
    position: 'absolute',
    top: 26,
    left: 26,
    right: 26,
    bottom: 26,
    borderWidth: 0.5,
    borderColor: VIOLET_MID,
    borderStyle: 'solid',
  },
  // Corner ornaments
  cornerTL: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: GOLD,
    borderStyle: 'solid',
  },
  cornerTR: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: GOLD,
    borderStyle: 'solid',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: GOLD,
    borderStyle: 'solid',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: GOLD,
    borderStyle: 'solid',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
    paddingVertical: 20,
  },
  brandLine: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: VIOLET_MID,
    letterSpacing: 2.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  brandGold: {
    color: GOLD,
  },
  ruleIndigo: {
    width: 260,
    height: 0.75,
    backgroundColor: INDIGO_MID,
    marginBottom: 14,
  },
  pill: {
    backgroundColor: VIOLET_MID,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  pillText: {
    color: WHITE,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 3,
  },
  titleMain: {
    fontSize: 30,
    fontFamily: 'Times-Roman',
    color: SLATE_900,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleFormation: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: SLATE_500,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 14,
  },
  ruleGold: {
    width: 80,
    height: 1,
    backgroundColor: GOLD,
    marginBottom: 16,
  },
  decerneLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: SLATE_500,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  recipientName: {
    fontSize: 34,
    fontFamily: 'Times-Bold',
    color: INDIGO,
    textAlign: 'center',
    marginBottom: 14,
  },
  praticienPour: {
    fontSize: 10.5,
    fontFamily: 'Helvetica',
    color: SLATE_700,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 40,
  },
  deckTitle: {
    fontSize: 22,
    fontFamily: 'Times-BoldItalic',
    color: GOLD,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardsLine: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: SLATE_500,
    textAlign: 'center',
    marginBottom: 16,
  },
  ruleIndigoBottom: {
    width: 260,
    height: 0.75,
    backgroundColor: INDIGO_MID,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 60,
    marginTop: 4,
  },
  certBox: {
    backgroundColor: VIOLET_BG,
    borderWidth: 0.75,
    borderColor: VIOLET_MID,
    borderStyle: 'solid',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  certLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica',
    color: SLATE_500,
    letterSpacing: 1,
    marginBottom: 2,
  },
  certNumber: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: VIOLET_MID,
  },
  dateText: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: SLATE_500,
  },
})

interface Props {
  recipientName: string
  deckTitle: string
  totalCards: number
  certificateNumber: string
  issuedAt: string
}

export default function FlashcardCertificate({ recipientName, deckTitle, totalCards, certificateNumber, issuedAt }: Props) {
  const issuedDate = new Date(issuedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Top band */}
        <View style={styles.bandTop} />
        <View style={styles.lisereMid} />

        {/* Borders */}
        <View style={styles.outerBorder} />
        <View style={styles.innerBorder} />

        {/* Corner ornaments */}
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />

        {/* Content */}
        <View style={styles.content}>
          {/* Brand line */}
          <Text style={styles.brandLine}>
            OSTEOUPGRADE{' '}
            <Text style={{ color: GOLD }}>×</Text>
            {' '}MYOSTEOFLOW
          </Text>

          {/* Rule */}
          <View style={styles.ruleIndigo} />

          {/* Pill badge */}
          <View style={styles.pill}>
            <Text style={styles.pillText}>OSTEOFLASH</Text>
          </View>

          {/* Main title */}
          <Text style={styles.titleMain}>Certificat d&apos;Excellence</Text>

          {/* Subtitle */}
          <Text style={styles.subtitleFormation}>FORMATION CLINIQUE PAR CARTES RECTO-VERSO</Text>

          {/* Gold rule */}
          <View style={styles.ruleGold} />

          {/* Decerné à */}
          <Text style={styles.decerneLabel}>DÉCERNÉ À</Text>

          {/* Recipient name */}
          <Text style={styles.recipientName}>{recipientName}</Text>

          {/* Pour avoir maîtrisé */}
          <Text style={styles.praticienPour}>
            Pour avoir maîtrisé avec excellence l&apos;intégralité des cartes cliniques du thème
          </Text>

          {/* Deck title */}
          <Text style={styles.deckTitle}>« {deckTitle} »</Text>

          {/* Cards line */}
          <Text style={styles.cardsLine}>{totalCards} cartes · Progression adaptée validée</Text>

          {/* Bottom rule */}
          <View style={styles.ruleIndigoBottom} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.certBox}>
            <Text style={styles.certLabel}>NUMÉRO DE CERTIFICAT</Text>
            <Text style={styles.certNumber}>{certificateNumber}</Text>
          </View>
          <Text style={styles.dateText}>{issuedDate}</Text>
        </View>

        {/* Bottom liseré + band */}
        <View style={{ height: 14 }} />
        <View style={styles.lisereBottom} />
        <View style={styles.bandBottom} />
      </Page>
    </Document>
  )
}
