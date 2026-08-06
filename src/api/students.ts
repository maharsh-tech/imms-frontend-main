import apiClient from './client'
import type { PaginatedResult, PaginationParams } from '../types/pagination'

export interface Student {
  id: string
  rollNumber: string
  name: string
  email: string
  department: string
  semester: number
  batch: string
  isActive: boolean
  userId?: string | null
}

export const getStudents = (
  params?: PaginationParams & { semester?: number; department?: string },
) =>
  apiClient
    .get<PaginatedResult<Student>>('/students', { params })
    .then((r) => r.data)

export type CreateStudentPayload = {
  rollNumber: string
  name: string
  department: string
  semester: number
  batch: string
}

export const createStudent = (data: CreateStudentPayload) =>
  apiClient.post<Student>('/students', data).then((r) => r.data)
