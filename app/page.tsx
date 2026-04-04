import { Hero } from '@/components/ui/Hero'
import { DropZone } from '@/components/ui/DropZone'

export default function PostcardHome() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--lab-bg)' }}>
      <Hero />
      <DropZone />
    </main>
  )
}
