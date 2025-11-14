// utils/generateTestingPDF.ts
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface TestResult {
  testId: string
  testName: string
  region: string
  result: 'positive' | 'negative' | 'uncertain' | null
  notes: string
  sensitivity?: number
  specificity?: number
}

interface TestingSession {
  patientName: string
  patientAge: string
  sessionDate: string
  results: TestResult[]
  notes: string
}

export const generateTestingPDF = (session: TestingSession) => {
  const doc = new jsPDF()
  
  // Couleurs
  const primaryColor: [number, number, number] = [37, 99, 235] // Bleu
  const greenColor: [number, number, number] = [34, 197, 94]
  const redColor: [number, number, number] = [239, 68, 68]
  const yellowColor: [number, number, number] = [250, 204, 21]
  
  // En-tête
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.text('OsteoUpgrade', 20, 20)
  
  doc.setFontSize(14)
  doc.text('Rapport de Tests Orthopédiques', 20, 30)
  
  // Informations du patient
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.text('Informations du Patient', 20, 55)
  
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text('Patient:', 20, 65)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(session.patientName || 'Non renseigné', 50, 65)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Âge:', 20, 72)
  doc.setTextColor(0, 0, 0)
  doc.text(session.patientAge || 'Non renseigné', 50, 72)
  
  doc.setTextColor(100, 100, 100)
  doc.text('Date:', 20, 79)
  doc.setTextColor(0, 0, 0)
  doc.text(new Date(session.sessionDate).toLocaleDateString('fr-FR'), 50, 79)
  
  doc.setTextColor(100, 100, 100)
  doc.text('Nombre de tests:', 20, 86)
  doc.setTextColor(0, 0, 0)
  doc.text(session.results.length.toString(), 50, 86)
  
  // Ligne de séparation
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 95, 190, 95)
  
  // Résultats des tests
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Résultats des Tests', 20, 110)
  
  // Grouper les tests par région
  const testsByRegion: Record<string, TestResult[]> = {}
  session.results.forEach(result => {
    if (!testsByRegion[result.region]) {
      testsByRegion[result.region] = []
    }
    testsByRegion[result.region].push(result)
  })
  
  let yPosition = 120
  
  Object.entries(testsByRegion).forEach(([region, tests]) => {
    // Vérifier si on doit passer à la page suivante
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    // Région
    doc.setFillColor(240, 240, 240)
    doc.rect(20, yPosition, 170, 8, 'F')
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(region, 22, yPosition + 5)
    yPosition += 12
    
    // Tests de cette région
    tests.forEach(test => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      // Nom du test
      doc.setTextColor(0, 0, 0)
      doc.text(`• ${test.testName}`, 25, yPosition)
      
      // Résultat avec couleur
      let resultText = 'Non testé'
      let resultColor: [number, number, number] = [150, 150, 150]
      
      if (test.result === 'positive') {
        resultText = 'Positif'
        resultColor = greenColor
      } else if (test.result === 'negative') {
        resultText = 'Négatif'
        resultColor = redColor
      } else if (test.result === 'uncertain') {
        resultText = 'Incertain'
        resultColor = yellowColor
      }
      
      doc.setTextColor(...resultColor)
      doc.text(resultText, 140, yPosition)
      
      // Statistiques si disponibles
      if (test.sensitivity || test.specificity) {
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(9)
        let statsText = ''
        if (test.sensitivity) statsText += `Se: ${test.sensitivity}% `
        if (test.specificity) statsText += `Sp: ${test.specificity}%`
        doc.text(statsText, 165, yPosition)
      }
      
      yPosition += 6
      
      // Notes si présentes
      if (test.notes) {
        doc.setTextColor(80, 80, 80)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        const lines = doc.splitTextToSize(`Notes: ${test.notes}`, 160)
        lines.forEach((line: string) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          doc.text(line, 30, yPosition)
          yPosition += 4
        })
        doc.setFont('helvetica', 'normal')
      }
      
      yPosition += 4
    })
    
    yPosition += 5
  })
  
  // Notes générales
  if (session.notes) {
    if (yPosition > 240) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setDrawColor(200, 200, 200)
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Notes Générales', 20, yPosition)
    yPosition += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(session.notes, 170)
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(line, 20, yPosition)
      yPosition += 5
    })
  }
  
  // Pied de page sur toutes les pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 280, 190, 280)
    
    // Texte du pied de page
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text('Généré par OsteoUpgrade', 20, 287)
    doc.text(`Page ${i} / ${pageCount}`, 180, 287)
    doc.text(new Date().toLocaleDateString('fr-FR'), 100, 287)
  }
  
  // Sauvegarder le PDF
  const fileName = `tests_${session.patientName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`
  doc.save(fileName)
}

// Fonction pour générer un récapitulatif statistique
export const generateStatsSummary = (results: TestResult[]) => {
  const stats = {
    total: results.length,
    positive: results.filter(r => r.result === 'positive').length,
    negative: results.filter(r => r.result === 'negative').length,
    uncertain: results.filter(r => r.result === 'uncertain').length,
    notTested: results.filter(r => r.result === null).length,
    byRegion: {} as Record<string, number>
  }
  
  results.forEach(result => {
    if (!stats.byRegion[result.region]) {
      stats.byRegion[result.region] = 0
    }
    stats.byRegion[result.region]++
  })
  
  return stats
}