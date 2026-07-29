import apiClient from './client';
import type { ImportResult } from '../types';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadStudentTemplate = async (): Promise<void> => {
  const { data } = await apiClient.get<Blob>('/students/import/template', { responseType: 'blob' });
  downloadBlob(data, 'students-template.xlsx');
};

export const downloadFacultyTemplate = async (): Promise<void> => {
  const { data } = await apiClient.get<Blob>('/faculty/import/template', { responseType: 'blob' });
  downloadBlob(data, 'faculty-template.xlsx');
};

export const importStudents = async (file: File): Promise<ImportResult> => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<ImportResult>('/students/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const importFaculty = async (file: File): Promise<ImportResult> => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<ImportResult>('/faculty/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
