// types/jspdf-autotable.d.ts
declare module 'jspdf-autotable' {
  export interface UserOptions {
    head?: any[][]
    body?: any[][]
    startY?: number
    margin?: { top?: number; right?: number; bottom?: number; left?: number }
    theme?: 'striped' | 'grid' | 'plain'
    styles?: any
    headStyles?: any
    bodyStyles?: any
    columnStyles?: any
    [key: string]: any
  }
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: import('jspdf-autotable').UserOptions) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}
