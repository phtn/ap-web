export const downloadAttachment = (
  values: {fullName: string},
  buildAttachmentText: () => string,
) => {
  if (typeof window === 'undefined') {
    return
  }

  const rawName =
    typeof values.fullName === 'string' ? values.fullName.trim() : ''
  const safeName =
    rawName.length > 0
      ? rawName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      : 'Unknown'

  // Match the template's filename (minus the trailing `)` which appears to be a typo).
  const filename = `Activate-Personal-Accident-Insurace-Details-For-${safeName}.txt`
  const text = buildAttachmentText()

  const blob = new Blob([text], {type: 'text/plain;charset=utf-8'})
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
