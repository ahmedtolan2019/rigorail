const isPublic = (file) => /^modules\/[^/]+\/public\.ts$/.test(file)
const isTest = (file) =>
  file.startsWith('test/') || /\.test\.[cm]?[jt]sx?$/.test(file)
export function allowedImport(from, to) {
  if (
    from === 'main.tsx' &&
    to !== 'index.css' &&
    !to.startsWith('app/') &&
    !to.startsWith('shared/')
  )
    return false
  if (isTest(to) && !isTest(from)) return false
  if (from.startsWith('shared/') && !to.startsWith('shared/')) return false
  if (from.startsWith('modules/')) {
    if (!to.startsWith('shared/') && !to.startsWith('modules/')) return false
    if (
      to.startsWith('modules/') &&
      from.split('/')[1] !== to.split('/')[1] &&
      !isPublic(to)
    )
      return false
  }
  if (from.startsWith('app/') && to.startsWith('modules/') && !isPublic(to))
    return false
  return true
}
export { isTest }
