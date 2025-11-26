import jsPDF from 'jspdf'

interface ConsultationPDFData {
  patientName: string
  patientAge: string
  consultationDate: string
  region: string
  triageAnswers: any
  selectedPathology?: any
  testResults: any[]
  filteredPathologies?: any[]
  notes?: string
}

const REGION_LABELS: Record<string, string> = {
  'cervical': 'Cervical',
  'thoracique': 'Thoracique', 
  'lombaire': 'Lombaire',
  'epaule': 'Épaule',
  'coude': 'Coude',
  'poignet': 'Poignet',
  'main': 'Main',
  'hanche': 'Hanche',
  'genou': 'Genou',
  'cheville': 'Cheville',
  'pied': 'Pied'
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

  // Configuration des couleurs
  const primaryColor = [76, 29, 149] as [number, number, number] // purple-700
  const secondaryColor = [100, 100, 100] as [number, number, number]
  
  // En-tête
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
  
  // Informations patient
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
  pdf.text(`Date de consultation: ${new Date(data.consultationDate).toLocaleDateString('fr-FR')}`, 20, yPosition + 19)
  pdf.text(`Région anatomique: ${REGION_LABELS[data.region] || data.region}`, 20, yPosition + 26)
  
  yPosition += 40
  
  // Résultats du triage
  pdf.setTextColor(...primaryColor)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ANALYSE CLINIQUE - TRIAGE', 20, yPosition)
  
  yPosition += 10
  pdf.line(20, yPosition - 3, 190, yPosition - 3)
  
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  
  // Questions et réponses du triage
  const triageQuestions = [
    { key: 'painType', label: 'Type de douleur' },
    { key: 'painOnset', label: 'Apparition' },
    { key: 'aggravatingFactors', label: 'Facteurs aggravants' },
    { key: 'radiationPattern', label: 'Irradiation' },
    { key: 'neurologicalSymptoms', label: 'Symptômes neurologiques' },
    { key: 'relievingMovement', label: 'Mouvements soulageants' }
  ]
  
  triageQuestions.forEach(question => {
    if (data.triageAnswers[question.key] !== undefined) {
      let answer = data.triageAnswers[question.key]
      
      if (question.key === 'neurologicalSymptoms') {
        answer = answer ? 'Présents' : 'Absents'
      } else {
        answer = TRIAGE_LABELS[question.key]?.[answer] || answer
      }
      
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${question.label}:`, 20, yPosition + 5)
      pdf.setFont('helvetica', 'normal')
      pdf.text(answer, 70, yPosition + 5)
      yPosition += 7
    }
  })
  
  yPosition += 10
  
  // Diagnostic retenu
  if (data.selectedPathology) {
    pdf.setTextColor(...primaryColor)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('DIAGNOSTIC RETENU', 20, yPosition)
    
    yPosition += 10
    pdf.line(20, yPosition - 3, 190, yPosition - 3)
    
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(data.selectedPathology.name, 20, yPosition + 5)
    
    if (data.selectedPathology.description) {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(data.selectedPathology.description, 170)
      yPosition += 12
      lines.forEach((line: string) => {
        if (yPosition > 260) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(line, 20, yPosition)
        yPosition += 5
      })
    }
    
    if (data.selectedPathology.recommendations) {
      yPosition += 5
      pdf.setFont('helvetica', 'bold')
      pdf.text('Recommandations:', 20, yPosition)
      pdf.setFont('helvetica', 'normal')
      const recLines = pdf.splitTextToSize(data.selectedPathology.recommendations, 170)
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
    
    yPosition += 10
  }
  
  // Tests effectués
  if (data.testResults && data.testResults.length > 0) {
    if (yPosition > 200) {
      pdf.addPage()
      yPosition = 20
    }
    
    pdf.setTextColor(...primaryColor)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('TESTS ORTHOPÉDIQUES RÉALISÉS', 20, yPosition)
    
    yPosition += 10
    pdf.line(20, yPosition - 3, 190, yPosition - 3)
    
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)
    
    data.testResults.forEach((test, index) => {
      if (yPosition > 260) {
        pdf.addPage()
        yPosition = 20
      }
      
      const resultText = test.result === 'positive' ? 'POSITIF' : 
                        test.result === 'negative' ? 'NÉGATIF' : 
                        'INCERTAIN'
      const resultColor = test.result === 'positive' ? [34, 197, 94] : 
                         test.result === 'negative' ? [239, 68, 68] : 
                         [251, 191, 36]
      
      pdf.setFont('helvetica', 'normal')
      pdf.text(`${index + 1}. Test:`, 20, yPosition + 5)
      
      pdf.setTextColor(...(resultColor as [number, number, number]))
      pdf.setFont('helvetica', 'bold')
      pdf.text(`[${resultText}]`, 170, yPosition + 5, { align: 'right' })
      
      pdf.setTextColor(0, 0, 0)
      pdf.setFont('helvetica', 'normal')
      yPosition += 7
    })
  }
  
  // Notes
  if (data.notes && data.notes.trim() !== '') {
    if (yPosition > 220) {
      pdf.addPage()
      yPosition = 20
    }
    
    yPosition += 10
    pdf.setTextColor(...primaryColor)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('NOTES DE CONSULTATION', 20, yPosition)
    
    yPosition += 10
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
  
  // Pied de page
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
      `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
      105, 285, 
      { align: 'center' }
    )
    pdf.text(`Page ${i} / ${pageCount}`, 105, 290, { align: 'center' })
  }
  
  // Sauvegarde
  const fileName = `Consultation_${data.patientName || 'Patient'}_${
    new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
  }.pdf`
  
  pdf.save(fileName)
}
