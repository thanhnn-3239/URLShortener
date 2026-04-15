"use client";

import { FormEvent, useState } from "react";
import { ClickToCopy } from "@/components/ClickToCopy";
import { validateUrl } from "@/lib/validation";

type FormResult = {
  code: string;
  short_url: string;
  destination_url: string;
};

export function ShortenForm() {
  const [destinationUrl, setDestinationUrl] = useState("");
  const [result, setResult] = useState<FormResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!validateUrl(destinationUrl)) {
      setResult(null);
      setErrorMessage("Please enter a valid HTTP/HTTPS URL.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ destination_url: destinationUrl })
      });

      let payload: FormResult & { message?: string };
      try {
        payload = (await response.json()) as FormResult & {
          message?: string;
        };
      } catch {
        // If response is not JSON (e.g., HTML error page), use status message
        throw new Error(
          `Server error (${response.status}): ${response.statusText || "Unknown error"}`
        );
      }

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to create short URL");
      }

      setResult(payload);
    } catch (error) {
      setResult(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create short URL"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-sky-100 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
          Fast link launch
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Shorten a URL and share it immediately.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Paste a destination link, generate a compact short URL, then copy it
          for campaigns, chats, and docs.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="destination-url"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Destination URL
          </label>
          <input
            id="destination-url"
            name="destination-url"
            type="url"
            value={destinationUrl}
            onChange={(event) => setDestinationUrl(event.target.value)}
            placeholder="https://example.com/your-campaign"
            className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-14 items-center justify-center rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {isSubmitting ? "Creating..." : "Shorten URL"}
          </button>
          <p className="text-sm text-slate-500">
            Generated links are available instantly and ready to track.
          </p>
        </div>
      </form>

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-800">
                Short URL is ready
              </p>
              <input
                readOnly
                aria-label="Generated short URL"
                value={result.short_url}
                className="mt-2 h-12 w-full rounded-xl border border-emerald-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none"
              />
              <p className="mt-2 truncate text-sm text-slate-600">
                Target: {result.destination_url}
              </p>
            </div>
            <ClickToCopy value={result.short_url} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
