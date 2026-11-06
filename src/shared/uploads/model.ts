import { z } from 'zod'
import type { ApiClient } from '../api/client'

/** A stored file as records reference it. Never show `id` to users. */
export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number().int().nonnegative(),
  type: z.string(),
})
export type Attachment = z.infer<typeof attachmentSchema>
/** Where to send the bytes: usually a short-lived presigned storage URL. */
export const uploadTicketSchema = z.object({
  id: z.string(),
  url: z.string(),
  method: z.enum(['PUT', 'POST']),
  headers: z.record(z.string(), z.string()).optional(),
})
export type UploadTicket = z.infer<typeof uploadTicketSchema>

export interface UploadOptions {
  /** 0 to 1. */
  onProgress: (fraction: number) => void
  signal: AbortSignal
}
export type Uploader = (
  file: File,
  options: UploadOptions,
) => Promise<Attachment>
/** Sends the bytes for a ticket. Replaceable for multipart or resumable uploads. */
export type PutFile = (
  ticket: UploadTicket,
  file: File,
  options: UploadOptions,
) => Promise<void>

export class UploadError extends Error {
  constructor(readonly status: number) {
    super(`Upload failed (${status}).`)
    this.name = 'UploadError'
  }
}

/** XHR transfer, because fetch cannot report upload progress. */
export const xhrPut: PutFile = (ticket, file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open(ticket.method, ticket.url)
    for (const [name, value] of Object.entries(ticket.headers ?? {}))
      request.setRequestHeader(name, value)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total)
    }
    request.onload = () =>
      request.status < 300 ? resolve() : reject(new UploadError(request.status))
    request.onerror = () => reject(new UploadError(0))
    request.onabort = () => reject(signal.reason)
    signal.addEventListener('abort', () => request.abort(), { once: true })
    request.send(file)
  })

/**
 * Two-step upload: `POST /uploads {name, size, type}` returns a ticket, then the
 * bytes go straight to storage. Records attach the returned `id` afterwards.
 */
export function createUploader(
  api: ApiClient,
  put: PutFile = xhrPut,
): Uploader {
  return async (file, options) => {
    const meta = {
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
    }
    const ticket = await api.request('/uploads', uploadTicketSchema, {
      method: 'POST',
      body: JSON.stringify(meta),
      signal: options.signal,
    })
    await put(ticket, file, options)
    options.onProgress(1)
    return { id: ticket.id, ...meta }
  }
}

export function formatBytes(bytes: number, language?: string) {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const
  let value = bytes,
    unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return new Intl.NumberFormat(language, {
    style: 'unit',
    unit: units[unit],
    unitDisplay: 'short',
    maximumFractionDigits: unit ? 1 : 0,
  }).format(value)
}
