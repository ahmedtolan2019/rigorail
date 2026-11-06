import {
  AppWindow,
  Building2,
  GraduationCap,
  Handshake,
  Package,
  type LucideIcon,
} from 'lucide-react'
import type { RequestRecord } from './schema'

export const categoryIcons: Record<RequestRecord['category'], LucideIcon> = {
  equipment: Package,
  software: AppWindow,
  training: GraduationCap,
  services: Handshake,
  facilities: Building2,
}
