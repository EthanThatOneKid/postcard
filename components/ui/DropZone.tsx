'use client'

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  UploadSimple,
  X,
  CheckCircle,
} from '@phosphor-icons/react'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXTS = '.jpg,.jpeg,.png,.webp'

interface EvidenceFile {
  dataUrl: string
  name: string
  size: string
  type: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const cls = [
    'absolute w-4 h-4',
    position === 'tl' ? 'top-0 left-0 border-t-2 border-l-2' : '',
    position === 'tr' ? 'top-0 right-0 border-t-2 border-r-2' : '',
    position === 'bl' ? 'bottom-0 left-0 border-b-2 border-l-2' : '',
    position === 'br' ? 'bottom-0 right-0 border-b-2 border-r-2' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={cls}
      style={{ borderColor: 'var(--lab-cyan)' }}
      aria-hidden
    />
  )
}

export function DropZone() {
  const [dragOver, setDragOver] = useState(false)
  const [evidence, setEvidence] = useState<EvidenceFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported format. Accepts: .JPG  .PNG  .WEBP')
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      setEvidence({
        dataUrl: e.target?.result as string,
        name: file.name,
        size: formatBytes(file.size),
        type: file.type.split('/')[1].toUpperCase(),
      })
    }
    reader.readAsDataURL(file)
  }, [])

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) loadFile(file)
    },
    [loadFile]
  )

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) loadFile(file)
    },
    [loadFile]
  )

  const clearEvidence = () => {
    setEvidence(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section
      className="lab-grid-bg w-full px-6 pb-20"
      style={{ background: 'var(--lab-bg)' }}
    >
      <div className="mx-auto max-w-2xl">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-[10px] tracking-[0.25em] uppercase"
            style={{ color: 'var(--lab-muted)' }}
          >
            Evidence Submission
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: 'var(--lab-border-dim)' }}
          />
          <span
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{ color: 'var(--lab-muted-2)' }}
          >
            File Intake
          </span>
        </div>

        {/* Drop zone card */}
        <div className="relative">
          <div
            className={[
              'relative rounded-sm border border-dashed transition-all duration-200 cursor-pointer select-none',
              dragOver ? 'lab-drop-active' : '',
            ].join(' ')}
            style={{
              borderColor: dragOver ? 'var(--lab-cyan)' : 'var(--lab-border)',
              background: dragOver
                ? 'rgba(34,211,238,0.04)'
                : 'var(--lab-surface)',
            }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            aria-label="Drop evidence image or click to browse"
          >
            {/* Corner brackets */}
            <Corner position="tl" />
            <Corner position="tr" />
            <Corner position="bl" />
            <Corner position="br" />

            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <div
                className="mb-5 rounded-full p-4"
                style={{
                  background: dragOver
                    ? 'rgba(34,211,238,0.1)'
                    : 'var(--lab-surface-2)',
                  border: `1px solid ${dragOver ? 'var(--lab-cyan)' : 'var(--lab-border)'}`,
                  transition: 'all 0.2s',
                }}
              >
                <UploadSimple
                  size={28}
                  weight="light"
                  style={{
                    color: dragOver ? 'var(--lab-cyan)' : 'var(--lab-muted)',
                    transition: 'color 0.2s',
                  }}
                />
              </div>

              <p
                className="text-sm tracking-[0.12em] uppercase mb-2"
                style={{ color: 'var(--lab-text)' }}
              >
                {dragOver ? 'Release to submit evidence' : 'Drop screenshot here'}
              </p>
              <p
                className="text-[11px] tracking-[0.1em] mb-6"
                style={{ color: 'var(--lab-muted)' }}
              >
                or
              </p>

              {/* Browse button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  inputRef.current?.click()
                }}
                className="px-5 py-2 text-[11px] tracking-[0.2em] uppercase rounded-sm transition-all duration-150"
                style={{
                  border: '1px solid var(--lab-border)',
                  color: 'var(--lab-muted)',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--lab-cyan)'
                  e.currentTarget.style.color = 'var(--lab-cyan)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--lab-border)'
                  e.currentTarget.style.color = 'var(--lab-muted)'
                }}
              >
                Browse Files
              </button>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXTS}
                className="hidden"
                onChange={onFileChange}
                aria-hidden
              />

              <p
                className="mt-6 text-[10px] tracking-[0.2em] uppercase"
                style={{ color: 'var(--lab-muted-2)' }}
              >
                Accepts:&nbsp;&nbsp;.JPG &nbsp; .PNG &nbsp; .WEBP
              </p>
            </div>
          </div>
        </div>

        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase"
              style={{ color: 'var(--lab-red)' }}
            >
              <span>⚠</span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Evidence Preview */}
        <AnimatePresence>
          {evidence && (
            <motion.div
              key="evidence"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mt-6 rounded-sm overflow-hidden"
              style={{
                border: '1px solid var(--lab-border)',
                background: 'var(--lab-surface)',
              }}
            >
              {/* Preview header bar */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{
                  borderBottom: '1px solid var(--lab-border-dim)',
                  background: 'var(--lab-surface-2)',
                }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    size={14}
                    weight="fill"
                    style={{ color: 'var(--lab-green)' }}
                  />
                  <span
                    className="text-[10px] tracking-[0.25em] uppercase"
                    style={{ color: 'var(--lab-green)' }}
                  >
                    Evidence Submitted
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearEvidence}
                  className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors duration-150 px-2 py-1 rounded-sm"
                  style={{ color: 'var(--lab-muted)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = 'var(--lab-red)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'var(--lab-muted)')
                  }
                >
                  <X size={12} />
                  Clear
                </button>
              </div>

              {/* Image + metadata */}
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div
                  className="relative flex-shrink-0 w-32 h-32 rounded-sm overflow-hidden"
                  style={{ border: '1px solid var(--lab-border)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={evidence.dataUrl}
                    alt="Uploaded evidence"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay watermark */}
                  <div
                    className="absolute inset-0 flex items-end p-1.5 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(transparent 50%, rgba(2,11,24,0.8))',
                    }}
                  >
                    <span
                      className="text-[8px] tracking-[0.15em] uppercase"
                      style={{ color: 'var(--lab-cyan)' }}
                    >
                      Evidence
                    </span>
                  </div>
                </div>

                {/* File metadata */}
                <div className="flex flex-col justify-center gap-3">
                  <MetaRow label="Filename" value={evidence.name} />
                  <MetaRow label="Format" value={evidence.type} />
                  <MetaRow label="Size" value={evidence.size} />
                  <MetaRow
                    label="Status"
                    value="Pending Analysis"
                    valueStyle={{ color: 'var(--lab-amber)' }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  )
}

function MetaRow({
  label,
  value,
  valueStyle,
}: {
  label: string
  value: string
  valueStyle?: React.CSSProperties
}) {
  return (
    <div className="flex items-baseline gap-2 text-[11px]">
      <span
        className="tracking-[0.2em] uppercase w-20 flex-shrink-0"
        style={{ color: 'var(--lab-muted-2)' }}
      >
        {label}
      </span>
      <span
        className="tracking-[0.05em] truncate max-w-[180px]"
        style={{ color: 'var(--lab-text)', ...valueStyle }}
      >
        {value}
      </span>
    </div>
  )
}
