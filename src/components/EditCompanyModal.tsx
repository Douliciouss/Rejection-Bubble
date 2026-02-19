"use client";

import { useState, useEffect } from "react";
import { updateCompany } from "@/lib/actions";

interface EditCompanyModalProps {
  companyId: string;
  name: string;
  companyUrl: string | null;
  logoUrl: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditCompanyModal({
  companyId,
  name: initialName,
  companyUrl: initialUrl,
  logoUrl: initialLogo,
  onClose,
  onSaved,
}: EditCompanyModalProps) {
  const [name, setName] = useState(initialName);
  const [companyUrl, setCompanyUrl] = useState(initialUrl ?? "");
  const [logoUrl, setLogoUrl] = useState(initialLogo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialName);
    setCompanyUrl(initialUrl ?? "");
    setLogoUrl(initialLogo ?? "");
  }, [initialName, initialUrl, initialLogo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData();
    formData.set("company_id", companyId);
    formData.set("name", name.trim());
    formData.set("company_url", companyUrl.trim() || "");
    formData.set("logo_url", logoUrl.trim() || "");
    const result = await updateCompany(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-xl bg-bubble-surface border border-bubble-border p-6 shadow-xl"
        role="dialog"
        aria-labelledby="edit-company-title"
      >
        <h2 id="edit-company-title" className="text-lg font-semibold mb-4">
          Edit company
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium mb-1">
              Company name *
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-bubble-bg border border-bubble-border focus:border-bubble-accent outline-none"
            />
          </div>
          <div>
            <label htmlFor="edit-url" className="block text-sm font-medium mb-1">
              Careers page URL
            </label>
            <input
              id="edit-url"
              type="url"
              placeholder="https://..."
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-bubble-bg border border-bubble-border focus:border-bubble-accent outline-none"
            />
          </div>
          <div>
            <label htmlFor="edit-logo" className="block text-sm font-medium mb-1">
              Logo URL
            </label>
            <input
              id="edit-logo"
              type="url"
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-bubble-bg border border-bubble-border focus:border-bubble-accent outline-none"
            />
          </div>
          {error && <p className="text-sm text-bubble-danger">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-bubble-border hover:bg-bubble-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-bubble-accent text-bubble-bg font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
