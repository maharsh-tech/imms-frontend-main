import type { AccountInvite } from '../../../types'

export type RoleFilter = 'ALL' | 'STUDENT' | 'TEACHER' | 'COORDINATOR'

export const buildPreviewEmail = (identifier: string, role: string): string => {
  const id = identifier.trim().toLowerCase()
  if (!id) return ''
  const domain = role === 'STUDENT' ? 'charusat.edu.in' : 'charusat.ac.in'
  if (id.includes('@')) return id
  return `${id}@${domain}`
}

export const parseBulkLines = (
  text: string,
  role: string,
): { identifier?: string; email?: string }[] => {
  const entries: { identifier?: string; email?: string }[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (role === 'COORDINATOR' || role === 'TEACHER') {
      if (trimmed.includes('@')) {
        entries.push({ email: trimmed.toLowerCase() })
      } else if (role === 'TEACHER') {
        entries.push({ identifier: trimmed.toLowerCase() })
      } else {
        entries.push({ email: trimmed.toLowerCase() })
      }
      continue
    }
    const id = trimmed.split(/[,\t\s]+/)[0]?.trim()
    if (!id) continue
    entries.push({ identifier: id.toUpperCase() })
  }
  return entries
}

export const downloadInviteLinksExcel = async (
  createdInvites: AccountInvite[],
  bulkRole: string,
) => {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Activation Links')

  worksheet.columns = [
    { header: 'Student/Faculty/Coordinator ID', key: 'idOrEmail', width: 35 },
    { header: 'Activation Link', key: 'link', width: 60 },
  ]

  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A365D' },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  })
  headerRow.height = 25

  createdInvites.forEach((invite) => {
    const idOrEmail = invite.identifier || invite.email
    const addedRow = worksheet.addRow({
      idOrEmail,
      link: invite.activationLink || '—',
    })
    addedRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
    })
    addedRow.height = 20
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `activation_links_${bulkRole.toLowerCase()}s.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
