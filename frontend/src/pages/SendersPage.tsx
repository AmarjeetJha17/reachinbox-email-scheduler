import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { api } from "../services/api";
import type { SenderAccount } from "../types/api";

export function SendersPage() {
  const [senders, setSenders] = useState<SenderAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get<{
          success: boolean;
          data: {
            senders: SenderAccount[];
          };
        }>("/senders");

        setSenders(response.data.data.senders);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-semibold">
            Sender Accounts
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Manage the accounts used to send campaigns.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={16} />
          Add Sender
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white">
        {loading ? (
          <div className="p-6 text-sm text-neutral-400">
            Loading senders...
          </div>
        ) : senders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">
              No sender accounts
            </p>

            <p className="mt-1 text-sm text-neutral-400">
              Add an SMTP sender to start scheduling campaigns.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {senders.map((sender) => (
              <div
                key={sender.id}
                className="flex items-center justify-between p-5"
              >
                <div>
                  <p className="font-medium">
                    {sender.name}
                  </p>

                  <p className="mt-1 text-sm text-neutral-400">
                    {sender.fromEmail}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium">
                    {sender.hourlyLimit}/hour
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    {sender.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
