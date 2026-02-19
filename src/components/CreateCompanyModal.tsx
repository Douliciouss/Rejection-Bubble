"use client";

import { useState } from "react";
import { createCompany } from "@/lib/actions";

interface CreateCompanyModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateCompanyModal({ onClose, onCreated }: CreateCompanyModalProps) {
  const [name, setName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData();
    formData.set("name", name.trim());
    if (companyUrl.trim()) formData.set("company_url", companyUrl.trim());
    if (logoUrl.trim()) formData.set("logo_url", logoUrl.trim());
    const result = await createCompany(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-xl bg-bubble-surface border border-bubble-border p-6 shadow-xl"
        role="dialog"
        aria-labelledby="create-company-title"
      >
        <h2 id="create-company-title" className="text-lg font-semibold mb-4">
          Add company
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium mb-1">
              Company name *
            </label>
            <input
              id="company-name"
              type="text"
              placeholder="e.g. Google"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-bubble-bg border border-bubble-border focus:border-bubble-accent outline-none"
            />
          </div>
          <div>
            <label htmlFor="company-url" className="block text-sm font-medium mb-1">
              Careers page URL (optional)
            </label>
            <input
              id="company-url"
              type="url"
              placeholder="https://..."
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-bubble-bg border border-bubble-border focus:border-bubble-accent outline-none"
            />
          </div>
          <div>
            <label htmlFor="logo-url" className="block text-sm font-medium mb-1">
              Logo URL (optional)
            </label>
            <input
              id="logo-url"
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
              {loading ? "Adding…" : "Add company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
