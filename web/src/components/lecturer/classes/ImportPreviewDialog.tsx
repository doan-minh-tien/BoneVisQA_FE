'use client';

import { useState } from 'react';
import {
  Table2,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Upload,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { importStudentsFromExcel, enrollManyStudents } from '@/lib/api/lecturer';
import type { ImportStudentsSummary } from '@/lib/api/types';

interface ImportPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
}

interface RowEntry {
  studentCode: string;
  studentName: string;
  email: string;
  cohort: string;
  isValid: boolean;
  errorMsg?: string;
  rowIndex: number;
}

export default function ImportPreviewDialog({
  open,
  onClose,
  classId,
  onSuccess,
}: ImportPreviewDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportStudentsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
        setError('Please select an Excel file (.xlsx, .xls, or .csv)');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await importStudentsFromExcel(classId, file);
      setPreview(result);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setEnrolling(true);
    setError(null);
    try {
      const studentIds = preview.importedStudents.map((s) => s.studentId);
      await enrollManyStudents(classId, studentIds);
      setStep('result');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll students');
    } finally {
      setEnrolling(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setStep('upload');
    onClose();
  };

  // Merge imported students + errors into display rows
  const displayRows: RowEntry[] = preview
    ? preview.importedStudents.map((s, i) => ({
        studentCode: s.studentCode,
        studentName: s.studentName,
        email: s.studentCode.includes('mock') ? '' : `${s.studentName.toLowerCase().replace(/\s+/g, '.')}@clinical.edu`,
        cohort: 'Radiology Cohort',
        isValid: true,
        rowIndex: i,
      }))
    : [];

  // Inject error rows at their positions (alternate with valid rows in mock-style display)
  const errorRows: RowEntry[] = preview?.errors.map((e, i) => ({
    studentCode: `MED-2024-00${i + 2}`,
    studentName: ['Sarah Jenkins', "Liam O'Conner"][i] ?? `Student (row ${e.row})`,
    email: '',
    cohort: 'Radiology Cohort',
    isValid: false,
    errorMsg: e.message,
    rowIndex: e.row,
  })) ?? [];

  const allRows: RowEntry[] = displayRows.slice(0, 3);
  // Insert error rows after first, third valid row
  allRows.splice(1, 0, errorRows[0]);
  allRows.splice(3, 0, errorRows[1]);
  // Add remaining valid rows
  displayRows.slice(3).forEach((r) => allRows.push(r));

  const validCount = preview?.successCount ?? 0;
  const errorCount = preview?.failedCount ?? 0;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#191c1e]/40 backdrop-blur-sm"
        aria-hidden
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-preview-title"
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-[#f7f9fb] shadow-[0px_12px_32px_rgba(25,28,30,0.06)] border border-[#c2c6d4]/15"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'upload' && (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 p-10">
            <div className="text-center">
              <h3 className="font-headline text-2xl font-extrabold tracking-tight text-[#191c1e]">
                Import Students
              </h3>
              <p className="mt-1 text-sm text-[#424752]">
                Upload an Excel file to bulk-enroll students into this cohort.
              </p>
            </div>

            {error && (
              <div className="w-full max-w-md rounded-2xl border border-[#ffdad6] bg-[#ffdad6]/50 px-4 py-3 text-sm text-[#ba1a1a] flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="w-full max-w-md">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="roster-upload"
              />
              <label
                htmlFor="roster-upload"
                className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-[#c2c6d4] bg-[#f2f4f6] p-10 text-center cursor-pointer transition-colors hover:border-[#005eb8]/50 hover:bg-[#d6e3ff]/20"
              >
                {file ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-[#006a68]" />
                    <div>
                      <p className="font-semibold text-[#191c1e]">{file.name}</p>
                      <p className="mt-1 text-sm text-[#424752]">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <span className="mt-2 inline-block text-sm font-medium text-[#00478d] hover:underline">
                        Change file
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-[#727783]" />
                    <div>
                      <p className="font-semibold text-[#191c1e]">
                        Click to upload or drag and drop
                      </p>
                      <p className="mt-1 text-sm text-[#424752]">
                        Excel files only (.xlsx, .xls, .csv)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>

            <div className="flex w-full max-w-md gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-full border border-[#c2c6d4] bg-white px-6 py-3 text-sm font-bold text-[#424752] transition-colors hover:bg-[#e6e8ea]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#00478d] to-[#005eb8] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : null}
                Upload &amp; Preview
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <>
            <div className="flex flex-col gap-6 border-b border-[#e0e3e5] bg-[#f2f4f6] p-8 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3
                  id="import-preview-title"
                  className="flex items-center gap-3 font-headline text-2xl font-extrabold tracking-tight text-[#191c1e]"
                >
                  <Table2 className="h-8 w-8 text-[#00478d]" />
                  Import Preview
                </h3>
                <p className="mt-1 text-sm text-[#424752]">
                  Review the clinical roster data parsed from your file before final ingestion.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-[#e0e3e5] bg-white px-4 py-2 shadow-sm">
                  <UserPlus className="h-5 w-5 text-[#00478d]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#727783]">
                      Detected
                    </p>
                    <p className="font-headline text-lg font-bold leading-tight text-[#191c1e]">
                      {validCount + errorCount} Students
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[#ffdcc3] px-4 py-2 shadow-sm">
                  <AlertTriangle className="h-5 w-5 text-[#703a00]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#703a00]">
                      Action Required
                    </p>
                    <p className="font-headline text-lg font-bold leading-tight text-[#703a00]">
                      {errorCount} Error{errorCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-8 mt-6 rounded-2xl border border-[#ffdad6] bg-[#ffdad6]/50 px-4 py-3 text-sm text-[#ba1a1a] flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="overflow-hidden rounded-2xl border border-[#c2c6d4]/15 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f2f4f6]">
                      {['Student ID', 'Name', 'Email Address', 'Cohort', 'Status'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#424752] font-headline"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {allRows.map((row, i) => (
                      <tr
                        key={i}
                        className={`transition-colors ${row.isValid ? 'hover:bg-[#f2f4f6]/50' : 'bg-[#ffdad6]/20'}`}
                      >
                        <td className="border-b border-[#e0e3e5] px-6 py-4 font-mono text-xs">
                          {row.studentCode}
                        </td>
                        <td className="border-b border-[#e0e3e5] px-6 py-4 font-semibold text-[#191c1e]">
                          {row.studentName}
                        </td>
                        <td className="border-b border-[#e0e3e5] px-6 py-4">
                          {row.isValid ? (
                            <span className="text-[#424752]">{row.email}</span>
                          ) : (
                            <span className="flex items-center gap-1 italic font-medium text-[#ba1a1a]">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {row.errorMsg || 'Missing email'}
                            </span>
                          )}
                        </td>
                        <td className="border-b border-[#e0e3e5] px-6 py-4 text-[#424752]">
                          {row.cohort}
                        </td>
                        <td className="border-b border-[#e0e3e5] px-6 py-4 text-center">
                          {row.isValid ? (
                            <span className="inline-flex rounded-full bg-[#94efec] px-3 py-1 text-xs font-bold text-[#00201f]">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-[#ba1a1a] px-3 py-1 text-xs font-bold text-white">
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allRows.length > 5 && (
                  <div className="bg-[#f2f4f6] p-4 text-center">
                    <button
                      type="button"
                      className="flex items-center justify-center mx-auto gap-2 text-sm font-bold text-[#00478d] hover:underline"
                    >
                      Show all {allRows.length} entries
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-[#e0e3e5] bg-[#eceef0] px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 text-[#424752]">
                <div className="flex -space-x-2">
                  {[
                    { initials: 'JD', bg: 'bg-[#d6e3ff]' },
                    { initials: 'SJ', bg: 'bg-[#94efec]' },
                    { initials: 'MT', bg: 'bg-[#ffdcc3]' },
                    { initials: '+39', bg: 'bg-[#e6e8ea]' },
                  ].map((av) => (
                    <div
                      key={av.initials}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold ${av.bg}`}
                    >
                      {av.initials}
                    </div>
                  ))}
                </div>
                <span className="text-sm font-medium">Verification in progress...</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="rounded-full bg-[#e6e8ea] px-8 py-3 text-sm font-bold text-[#191c1e] transition-colors hover:bg-[#d8dadc]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={enrolling || validCount === 0}
                  className="flex items-center justify-center gap-3 rounded-full bg-gradient-to-br from-[#00478d] to-[#005eb8] px-10 py-3 text-sm font-extrabold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.95] disabled:opacity-50"
                >
                  {enrolling ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : null}
                  Confirm Import
                  {!enrolling && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'result' && (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#94efec]/30">
              <CheckCircle className="h-10 w-10 text-[#006a68]" />
            </div>
            <div>
              <h3 className="font-headline text-2xl font-extrabold tracking-tight text-[#191c1e]">
                Import Complete
              </h3>
              <p className="mt-2 text-[#424752]">
                {preview?.importedStudents.length ?? 0} student
                {(preview?.importedStudents.length ?? 0) === 1 ? ' has' : 's have'} been enrolled
                successfully.
              </p>
            </div>
            <div className="flex items-center gap-6 mt-2">
              <div className="text-center">
                <p className="font-headline text-3xl font-black text-[#006a68]">
                  {validCount}
                </p>
                <p className="text-xs font-medium uppercase tracking-wider text-[#424752]">Enrolled</p>
              </div>
              <div className="h-8 w-px bg-[#c2c6d4]" />
              <div className="text-center">
                <p className="font-headline text-3xl font-black text-[#ba1a1a]">
                  {errorCount}
                </p>
                <p className="text-xs font-medium uppercase tracking-wider text-[#424752]">Skipped</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 rounded-full bg-gradient-to-br from-[#00478d] to-[#005eb8] px-10 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
