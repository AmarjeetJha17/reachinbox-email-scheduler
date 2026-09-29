import {
  useEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  X
} from "lucide-react";

import { api } from "../services/api";

import type {
  SenderAccount
} from "../types/api";

interface CreateSenderResponse {
  success: boolean;
  message: string;
  data: {
    sender: SenderAccount;
  };
}

const initialForm = {
  name: "",
  fromEmail: "",
  smtpHost: "smtp.ethereal.email",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  secure: false,
  hourlyLimit: "200"
};

export function SendersPage() {
  const [senders, setSenders] =
    useState<SenderAccount[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [form, setForm] =
    useState(initialForm);

  async function loadSenders() {
    try {
      setLoading(true);

      const response =
        await api.get<{
          success: boolean;
          data: {
            senders: SenderAccount[];
          };
        }>("/senders");

      setSenders(
        response.data.data.senders
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load sender accounts."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSenders();
  }, []);

  function openModal() {
    setError(null);
    setSuccess(null);
    setForm(initialForm);
    setShowPassword(false);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setError(null);
  }

  function updateField(
    field: keyof typeof initialForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (
      !form.name.trim() ||
      !form.fromEmail.trim() ||
      !form.smtpHost.trim() ||
      !form.smtpUser.trim() ||
      !form.smtpPassword
    ) {
      setError(
        "Please complete all required fields."
      );

      return;
    }

    const smtpPort =
      Number(form.smtpPort);

    const hourlyLimit =
      Number(form.hourlyLimit);

    if (
      !Number.isInteger(smtpPort) ||
      smtpPort < 1 ||
      smtpPort > 65535
    ) {
      setError(
        "SMTP port must be between 1 and 65535."
      );

      return;
    }

    if (
      !Number.isInteger(hourlyLimit) ||
      hourlyLimit < 1
    ) {
      setError(
        "Hourly limit must be at least 1."
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await api.post<CreateSenderResponse>(
          "/senders",
          {
            name:
              form.name.trim(),

            fromEmail:
              form.fromEmail
                .trim()
                .toLowerCase(),

            smtpHost:
              form.smtpHost.trim(),

            smtpPort,

            smtpUser:
              form.smtpUser.trim(),

            smtpPassword:
              form.smtpPassword,

            secure:
              form.secure,

            hourlyLimit
          }
        );

      setSenders(
        (current) => [
          ...current,
          response.data.data.sender
        ]
      );

      setSuccess(
        "Sender added successfully."
      );

      setShowModal(false);
      setForm(initialForm);

      /*
       * Reload from backend so the UI reflects
       * the persistent database state.
       */
      await loadSenders();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ??
          "Unable to create sender account."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900"
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
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <Plus size={16} />
          Add Sender
        </button>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-neutral-400">
            Loading sender accounts...
          </div>
        ) : senders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Plus
                size={20}
                className="text-neutral-500"
              />
            </div>

            <p className="mt-4 font-medium">
              No sender accounts
            </p>

            <p className="mt-1 text-sm text-neutral-400">
              Add an SMTP sender to start scheduling campaigns.
            </p>

            <button
              type="button"
              onClick={openModal}
              className="mt-5 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Add your first sender
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {senders.map((sender) => (
              <div
                key={sender.id}
                className="flex items-center justify-between gap-6 p-5"
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

                  <span className="mt-1 inline-block text-xs text-emerald-600">
                    {sender.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Add Sender Account
                </h2>

                <p className="mt-1 text-sm text-neutral-400">
                  Connect an SMTP account for email delivery.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Sender name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    updateField(
                      "name",
                      value
                    )
                  }
                  placeholder="My Ethereal Sender"
                />

                <Field
                  label="From email"
                  type="email"
                  required
                  value={form.fromEmail}
                  onChange={(value) =>
                    updateField(
                      "fromEmail",
                      value
                    )
                  }
                  placeholder="sender@example.com"
                />
              </div>

              <div className="border-t border-neutral-100 pt-5">
                <p className="mb-4 text-sm font-semibold">
                  SMTP Configuration
                </p>

                <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
                  <Field
                    label="SMTP host"
                    required
                    value={form.smtpHost}
                    onChange={(value) =>
                      updateField(
                        "smtpHost",
                        value
                      )
                    }
                    placeholder="smtp.ethereal.email"
                  />

                  <Field
                    label="Port"
                    type="number"
                    required
                    value={form.smtpPort}
                    onChange={(value) =>
                      updateField(
                        "smtpPort",
                        value
                      )
                    }
                    placeholder="587"
                  />
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="SMTP username"
                    required
                    value={form.smtpUser}
                    onChange={(value) =>
                      updateField(
                        "smtpUser",
                        value
                      )
                    }
                    placeholder="Ethereal username"
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-800">
                      SMTP password
                    </label>

                    <div className="relative">
                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={
                          form.smtpPassword
                        }
                        onChange={(event) =>
                          updateField(
                            "smtpPassword",
                            event.target.value
                          )
                        }
                        required
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 pr-11 text-sm outline-none focus:border-neutral-500"
                        placeholder="Ethereal password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (value) =>
                              !value
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800"
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <label className="mt-5 flex items-center gap-3 rounded-xl bg-neutral-50 p-4">
                  <input
                    type="checkbox"
                    checked={form.secure}
                    onChange={(event) =>
                      updateField(
                        "secure",
                        event.target.checked
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-medium">
                      Use secure SMTP connection
                    </span>

                    <span className="mt-1 block text-xs text-neutral-400">
                      Usually disabled for Ethereal SMTP on port 587.
                    </span>
                  </span>
                </label>
              </div>

              <div className="border-t border-neutral-100 pt-5">
                <label className="mb-2 block text-sm font-medium">
                  Hourly sending limit
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.hourlyLimit}
                  onChange={(event) =>
                    updateField(
                      "hourlyLimit",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-500"
                />

                <p className="mt-2 text-xs text-neutral-400">
                  The lower of this sender limit and the campaign
                  limit will be enforced.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-neutral-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Adding sender..."
                    : "Add Sender"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-neutral-300 focus:border-neutral-500"
      />
    </div>
  );
}
