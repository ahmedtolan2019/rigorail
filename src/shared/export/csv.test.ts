import { afterEach, expect, test, vi } from 'vitest'
import { exportCsv } from './csv'

afterEach(() => vi.restoreAllMocks())

test('CSV export escapes values and starts with a UTF-8 BOM for Excel', async () => {
  let blob: Blob | undefined
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: (value: Blob) => {
      blob = value
      return 'blob:test'
    },
    revokeObjectURL: () => undefined,
  })
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => undefined)
  exportCsv(
    { fileName: 'a/b', title: 'Report', currency: 'USD' },
    {
      name: 'Sheet',
      rows: [{ name: 'Comma, "quoted"', amount: 12.5, note: 'سطر\nجديد' }],
      columns: [
        { header: 'Name', value: (row) => row.name },
        { header: 'Amount', value: (row) => row.amount, format: 'money' },
        { header: 'Note', value: (row) => row.note },
      ],
    },
  )
  expect(click).toHaveBeenCalledOnce()
  // Blob.text() strips a BOM while decoding, so check the raw bytes.
  const bytes = new Uint8Array(await blob!.arrayBuffer())
  expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
  expect(new TextDecoder().decode(bytes)).toBe(
    'Name,Amount,Note\r\n"Comma, ""quoted""",12.5,"سطر\nجديد"',
  )
})
