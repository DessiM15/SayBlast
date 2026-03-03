"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CsvUploadProps {
  audienceListId: string;
  onUploadComplete: () => void;
}

interface UploadResult {
  added: number;
  skipped: number;
  invalid: number;
  total: number;
}

export default function CsvUpload({
  audienceListId,
  onUploadComplete,
}: CsvUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);
    setError(null);

    try {
      const csvText = await file.text();

      const response = await fetch("/api/contacts/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audienceListId, csvText }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Upload failed");
      }

      const data = (await response.json()) as UploadResult;
      setResult(data);
      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-3.5 w-3.5" />
              Upload CSV
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          CSV with email, firstName, lastName columns
        </span>
      </div>

      {result && (
        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-800 dark:bg-green-950">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              Upload complete
            </p>
            <p className="text-green-700 dark:text-green-300">
              {result.added} added, {result.skipped} duplicates skipped
              {result.invalid > 0 && `, ${result.invalid} invalid rows`}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm dark:border-red-800 dark:bg-red-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
