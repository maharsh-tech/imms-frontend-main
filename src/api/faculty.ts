import apiClient from './client'
import type { Faculty } from './subjects'

export type CreateFacultyPayload = {
  facultyCode: string
  name: string
  department: string
}

export const createFaculty = (data: CreateFacultyPayload) =>
  apiClient.post<Faculty>('/faculty', data).then((r) => r.data)
