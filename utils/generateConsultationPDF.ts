import jsPDF from 'jspdf'

interface ConsultationEpisodePDF {
  region: string
  triageAnswers: any
  selectedPathology?: any
  testResults: any[]
}

interface ConsultationPDFData {
  patientName: string
  patientAge: string
  consultationDate: string
  notes?: string
  episodes: ConsultationEpisodePDF[]
}

const REGION_LABELS: Record<string, string> = {
  cervical: 'Cervical',
  thoracique: 'Thoracique',
  lombaire: 'Lombaire',
  epaule: 'Épaule',
  coude: 'Coude',
  poignet: 'Poignet',
  main: 'Main',
  hanche: 'Hanche',
  genou: 'Genou',
  cheville: 'Cheville',
  pied: 'Pied'
}

const TRIAGE_LABELS: Record<string, Record<string, string>> = {
  painType: {
    mecanique: 'Mécanique',
    inflammatoire: 'Inflammatoire',
    mixte: 'Mixte'
  },
  painOnset: {
    brutale: 'Brutale / Précise',
    progressive: 'Progressive',
    charge_repetee: 'Charge répétée'
  },
  aggravatingFactors: {
    mouvement: 'Mouvement / Charge',
    repos: 'Repos / Position fixe',
    les_deux: 'Les deux'
  },
  radiationPattern: {
    radiculaire: 'Trajet précis (radiculaire)',
    referree: 'Flou / diffus (référée)',
    locale: 'Locale'
  },
  relievingMovement: {
    extension: 'Extension',
    flexion: 'Flexion',
    aucun: 'Aucun'
  }
}

export const generateConsultationPDF = async (data: ConsultationPDFData) => {
  const pdf = new jsPDF()
  let yPosition = 20

  const primaryColor: [number, number, number] = [76, 29, 149] // purple-700
  const secondaryColor: [number, number, number] = [100, 100, 100]

  // =========================
  // EN-TÊTE
  // =========================
  pdf.setFillColor(...primaryColor)
  pdf.rect(0, 0, 210, 40, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(22)
  pdf.setFont('helvetica', 'bold')
  pdf.text('COMPTE-RENDU DE CONSULTATION', 105, 20, { align: 'center' })

  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'normal')
  pdf.text('OsteoUpgrade - Module de Diagnostic Guidé', 105, 30, { align: 'center' })

  yPosition = 50

  // =========================
  // INFOS PATIENT
  // =========================
  pdf.setTextColor(...primaryColor)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('INFORMATIONS PATIENT', 20, yPosition)

  yPosition += 10
  pdf.setDrawColor(...primaryColor)
  pdf.setLineWidth(0.5)
  pdf.line(20, yPosition - 3, 190, yPosition - 3)

  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')

  pdf.text(`Nom: ${data.patientName || 'Non renseigné'}`, 20, yPosition + 5)
  pdf.text(`Âge: ${data.patientAge || 'Non renseigné'}`, 20, yPosition + 12)
  pdf.text(
    `Date de consultation: ${new Date(data.consultationDate).toLocaleDateString('fr-FR')}`,
    20,
    yPosition + 19
  )
  pdf.text(
    `Nombre de régions examinées: ${data.episodes?.length || 0}`,
    20,
    yPosition + 26
  )

  yPosition += 40

  // =========================
  // BOUCLE SUR LES EPISODES
  // =========================
  const triageQuestions = [
    { key: 'painType', label: 'Type de douleur' },
    { key: 'painOnset', label: 'Apparition' },
    { key: 'aggravatingFactors', label: 'Facteurs aggravants' },
    { key: 'radiationPattern', label: 'Irradiation' },
    { key: 'neurologicalSymptoms', label: 'Symptômes neurologiques' },
    { key: 'relievingMovement', label: 'Mouvements soulageants' }
  ]

  data.episodes.forEach((episode, index) => {
    // Saut de page si on est trop bas
    if (yPosition > 230) {
      pdf.addPage()
      yPosition = 20
    }

    // Titre épisode
    pdf.setTextColor(...primaryColor)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    const regionLabel = REGION_LABELS[episode.region] || episode.region || 'Non renseignée'
    pdf.text(
      `ÉPISODE ${index + 1} - ${regionLabel.toUpperCase()}`,
      20,
      yPosition
    )

    yPosition += 10
    pdf.setDrawColor(...primaryColor)
    pdf.line(20, yPosition - 3, 190, yPosition - 3)

    // ---------- TRIAGE ----------
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Analyse clinique - triage', 20, yPosition + 6)

    yPosition += 10
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')

    triageQuestions.forEach(question => {
      const value = episode.triageAnswers?.[question.key]
      if (value !== undefined && value !== null && value !== '') {
        if (yPosition > 260) {
          pdf.addPage()
          yPosition = 20
        }

        let answer: string
        if (question.key === 'neurologicalSymptoms') {
          answer = value ? 'Présents' : 'Absents'
        } else {
          answer = TRIAGE_LABELS[question.key]?.[value] || String(value)
        }

        pdf.setFont('helvetica', 'bold')
        pdf.text(`${question.label}:`, 20, yPosition + 5)
        pdf.setFont('helvetica', 'normal')
        pdf.text(answer, 70, yPosition + 5)

        yPosition += 7
      }
    })

    yPosition += 5

    // ---------- DIAGNOSTIC ----------
    if (episode.selectedPathology) {
      if (yPosition > 230) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setTextColor(...primaryColor)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Diagnostic retenu', 20, yPosition + 6)

      yPosition += 10
      pdf.setDrawColor(...primaryColor)
      pdf.line(20, yPosition - 3, 190, yPosition - 3)

      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(episode.selectedPathology.name, 20, yPosition + 6)

      yPosition += 10

      if (episode.selectedPathology.description) {
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        const lines = pdf.splitTextToSize(episode.selectedPathology.description, 170)
        lines.forEach((line: string) => {
          if (yPosition > 260) {
            pdf.addPage()
            yPosition = 20
          }
          pdf.text(line, 20, yPosition)
          yPosition += 5
        })
      }

      if (episode.selectedPathology.recommendations) {
        if (yPosition > 250) {
          pdf.addPage()
          yPosition = 20
        }
        yPosition += 5
        pdf.setFont('helvetica', 'bold')
        pdf.text('Recommandations:', 20, yPosition)
        pdf.setFont('helvetica', 'normal')
        const recLines = pdf.splitTextToSize(
          episode.selectedPathology.recommendations,
          170
        )
        yPosition += 7
        recLines.forEach((line: string) => {
          if (yPosition > 260) {
            pdf.addPage()
            yPosition = 20
          }
          pdf.text(line, 20, yPosition)
          yPosition += 5
        })
      }

      yPosition += 5
    }

    // ---------- TESTS ----------
    if (episode.testResults && episode.testResults.length > 0) {
      if (yPosition > 230) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setTextColor(...primaryColor)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Tests orthopédiques réalisés', 20, yPosition + 6)

      yPosition += 10
      pdf.setDrawColor(...primaryColor)
      pdf.line(20, yPosition - 3, 190, yPosition - 3)

      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      episode.testResults.forEach((test, idx) => {
        if (yPosition > 260) {
          pdf.addPage()
          yPosition = 20
        }

        const resultText =
          test.result === 'positive'
            ? 'POSITIF'
            : test.result === 'negative'
            ? 'NÉGATIF'
            : 'INCERTAIN'

        const resultColor: [number, number, number] =
          test.result === 'positive'
            ? [34, 197, 94]
            : test.result === 'negative'
            ? [239, 68, 68]
            : [251, 191, 36]

        const testLabel = test.name || `Test ${idx + 1}`

        pdf.setTextColor(0, 0, 0)
        pdf.text(`${idx + 1}. ${testLabel}`, 20, yPosition + 5)

        pdf.setTextColor(...resultColor)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`[${resultText}]`, 190, yPosition + 5, { align: 'right' })

        pdf.setFont('helvetica', 'normal')
        yPosition += 7
      })
    }

    yPosition += 10
  })

  // =========================
  // NOTES GLOBALES
  // =========================
  if (data.notes && data.notes.trim() !== '') {
    if (yPosition > 220) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setTextColor(...primaryColor)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('NOTES DE CONSULTATION', 20, yPosition)

    yPosition += 10
    pdf.setDrawColor(...primaryColor)
    pdf.line(20, yPosition - 3, 190, yPosition - 3)

    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const noteLines = pdf.splitTextToSize(data.notes, 170)
    noteLines.forEach((line: string) => {
      if (yPosition > 260) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.text(line, 20, yPosition + 5)
      yPosition += 5
    })
  }

  // =========================
  // PIED DE PAGE
  // =========================
  const pageCount = pdf.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.5)
    pdf.line(20, 280, 190, 280)

    pdf.setTextColor(...secondaryColor)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString(
        'fr-FR'
      )}`,
      105,
      285,
      { align: 'center' }
    )
    pdf.text(`Page ${i} / ${pageCount}`, 105, 290, { align: 'center' })
  }

  const fileName = `Consultation_${data.patientName || 'Patient'}_${new Date()
    .toLocaleDateString('fr-FR')
    .replace(/\//g, '-')}.pdf`

  pdf.save(fileName)
}
