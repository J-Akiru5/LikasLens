"use client";

import { useEffect, useState } from "react";
import { laravelGet } from "@likaslens/shared";
import type { ApiResponse, PaginatedResponse } from "@likaslens/shared";
import { Card } from "@likaslens/shared";
import { Scale, Search } from "lucide-react";

interface Law {
  id: string;
  law_code: string;
  title: string;
  summary: string;
  issuing_agency: string;
  is_active: boolean;
}

export default function LawsPage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: Record<string, string> = { per_page: "50" };
    if (search) params.search = search;

    laravelGet<PaginatedResponse<Law>>(`/admin/laws?${new URLSearchParams(params)}`)
      .then((res) => { if (res.success) setLaws(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Environmental Laws</h1>
        <p className="text-sm text-gray-500">Philippine environmental legislation reference</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search laws..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {laws.map((law) => (
            <Card key={law.id}>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <Scale className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {law.law_code}
                    </span>
                    <h3 className="font-medium text-gray-900">{law.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{law.summary}</p>
                  <p className="mt-1 text-xs text-gray-400">{law.issuing_agency}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
