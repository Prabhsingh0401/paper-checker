"use client";

import { useState, useRef } from "react";

interface AnswerKeyInputProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
}

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx";

export default function AnswerKeyInput({
  file,
  onFileSelect,
  onFileRemove,
}: AnswerKeyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) onFileSelect(selected);
    e.target.value = "";
  }

  return (
    <div className="rounded-2xl border border-border-light bg-surface/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-foreground">
          Answer Key{" "}
          <span className="text-muted font-normal">(optional)</span>
        </p>
        {file && (
          <button
            onClick={onFileRemove}
            className="text-xs text-muted hover:text-error transition-colors"
          >
            Remove
          </button>
        )}
      </div>
      {file ? (
        <p className="text-xs text-muted truncate">{file.name}</p>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-accent hover:text-accent/80 transition-colors"
        >
          Upload answer key or marking scheme
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
