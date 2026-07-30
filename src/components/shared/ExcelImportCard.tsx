import { useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import type { ImportResult } from '../../types';

type ExcelImportCardProps = {
  title: string
  description: string
  onDownloadTemplate: () => Promise<void>
  onImport: (file: File) => Promise<ImportResult>
  onImportComplete?: () => void
}

const ExcelImportCard = ({
  title,
  description,
  onDownloadTemplate,
  onImport,
  onImportComplete,
}: ExcelImportCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleDownloadTemplate = async () => {
    setTemplateLoading(true);
    setError('');
    try {
      await onDownloadTemplate();
    } catch {
      setError('Failed to download template.');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Only .xlsx files are accepted.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const importResult = await onImport(file)
      setResult(importResult)
      if (importResult.imported > 0 || importResult.updated > 0) {
        onImportComplete?.()
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Import failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={templateLoading}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
        >
          <Download className="w-4 h-4 mr-2" />
          {templateLoading ? 'Downloading...' : 'Template'}
        </button>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-3">Drag & drop .xlsx here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Importing...' : 'Choose file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 bg-gray-50 rounded-md p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-900">
            Added: {result.imported} · Updated: {result.updated} · Skipped: {result.skipped}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-y-auto text-sm text-red-700 space-y-1">
              {result.errors.map((err) => (
                <li key={`${err.row}-${err.reason}`}>
                  Row {err.row}: {err.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelImportCard;
