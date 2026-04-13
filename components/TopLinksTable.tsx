'use client';

import React, { useState, useCallback } from 'react';
import { Copy, ExternalLink } from 'lucide-react';

type SortKey = 'code' | 'destination_url' | 'click_count';
type SortOrder = 'asc' | 'desc';

interface TopLink {
  code: string;
  destination_url: string;
  click_count: number;
}

interface TopLinksTableProps {
  links: TopLink[];
  onLinkClick?: (code: string) => void;
}

export default function TopLinksTable({ links, onLinkClick }: TopLinksTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('click_count');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  }, [sortKey, sortOrder]);

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  const sortedLinks = React.useMemo(() => {
    const sorted = [...links].sort((a, b) => {
      let aVal: string | number = a[sortKey];
      let bVal: string | number = b[sortKey];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [links, sortKey, sortOrder]);

  if (links.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="text-gray-500">
          <p className="text-lg font-semibold">No short links yet</p>
          <p className="text-sm">Create a short link to start tracking clicks</p>
        </div>
      </div>
    );
  }

  const SortHeader = ({ label, sortKey: key }: { label: string; sortKey: SortKey }) => (
    <th className="cursor-pointer select-none px-6 py-3 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50">
      <button
        onClick={() => handleSort(key)}
        className="flex items-center gap-2 font-semibold"
      >
        {label}
        <span className="text-gray-400">
          {sortKey === key && (sortOrder === 'desc' ? '↓' : '↑')}
        </span>
      </button>
    </th>
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Links</h3>
        <p className="mt-1 text-sm text-gray-500">
          Showing top {sortedLinks.length} performing items
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortHeader label="Short Code" sortKey="code" />
              <SortHeader label="Destination URL" sortKey="destination_url" />
              <SortHeader label="Clicks" sortKey="click_count" />
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedLinks.map((link) => (
              <tr
                key={link.code}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="button"
                      onClick={() => onLinkClick?.(link.code)}
                      className="rounded bg-gray-100 px-2 py-1 font-mono text-sm font-semibold text-gray-900 hover:bg-gray-200"
                    >
                      {link.code}
                    </button>
                    <button
                      onClick={() => handleCopyCode(link.code)}
                      className="rounded p-1 hover:bg-gray-200 transition-colors"
                      title="Copy code"
                      aria-label={`Copy ${link.code} to clipboard`}
                    >
                      <Copy
                        size={16}
                        className={copiedCode === link.code ? 'text-green-600' : 'text-gray-400'}
                      />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="truncate" title={link.destination_url}>
                    <a
                      href={link.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {link.destination_url}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                    {link.click_count.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onLinkClick?.(link.code)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
