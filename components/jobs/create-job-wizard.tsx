"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AirportSearch } from "@/components/jobs/airport-search";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import type { AirportOut, TemplateSummary, JobOut } from "@/lib/api-types";

type WizardState = {
  title: string;
  icaoCode: string;
  airport: AirportOut | null;
  templateId: string;
};

const STEPS = [
  { number: 1, label: "Job Configuration", description: "Set up your analysis job" },
  { number: 2, label: "Configure Rules", description: "Select analysis templates" },
  { number: 3, label: "Review & Submit", description: "Confirm your settings" },
];

export function CreateJobWizard() {
  const router = useRouter();
  const { user } = useCurrentUser();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [airports, setAirports] = useState<AirportOut[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [state, setState] = useState<WizardState>({
    title: "",
    icaoCode: "",
    airport: null,
    templateId: "",
  });

  useEffect(() => {
    if (!user) return;
    const templatesUrl = `/api/v1/organisations/${user.organization_id}/templates/summary`;
    Promise.all([
      api.get<AirportOut[]>("/api/v1/airports?limit=500"),
      api.get<TemplateSummary[]>(templatesUrl),
    ])
      .then(([a, t]) => {
        setAirports(a);
        setTemplates(t);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [user]);

  const canProceedStep1 = state.title.trim().length > 0 && state.icaoCode.length > 0;
  const canProceedStep2 = state.templateId.length > 0;

  function handleAirportChange(icao: string, airport: AirportOut | null) {
    setState((prev) => ({ ...prev, icaoCode: icao, airport }));
  }

  function handleTemplateSelect(templateId: string) {
    setState((prev) => ({ ...prev, templateId }));
  }

  async function handleSubmit() {
    if (!user) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.post<JobOut>("/api/v1/jobs", {
        title: state.title,
        airport_icao: state.icaoCode,
        template_id: state.templateId,
      });
      router.push("/user/jobs");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create job");
      setIsSubmitting(false);
    }
  }

  const selectedTemplate = templates.find((t) => t.id === state.templateId);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create New Analysis Job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your analysis job using our step-by-step wizard
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <StepHeader currentStep={currentStep} />

        <div className="p-6">
          {currentStep === 1 && (
            <Step1
              state={state}
              airports={airports}
              loading={loadingData}
              onTitleChange={(title) => setState((prev) => ({ ...prev, title }))}
              onAirportChange={handleAirportChange}
            />
          )}
          {currentStep === 2 && (
            <Step2
              templates={templates}
              loading={loadingData}
              selectedTemplateId={state.templateId}
              onSelect={handleTemplateSelect}
            />
          )}
          {currentStep === 3 && (
            <Step3 state={state} selectedTemplate={selectedTemplate} />
          )}
        </div>

        {submitError && (
          <div className="mx-6 mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 1}
          >
            Back
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={currentStep === 1 ? !canProceedStep1 : !canProceedStep2}
            >
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !user}>
              {isSubmitting ? "Creating..." : "Create Job"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeader({ currentStep }: { currentStep: number }) {
  return (
    <div className="border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Create Analysis Job</h2>
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const done = currentStep > step.number;
          const active = currentStep === step.number;
          return (
            <div key={step.number} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    done
                      ? "bg-green-500 text-white"
                      : active
                        ? "bg-primary text-white"
                        : "border-2 border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {done ? <CheckIcon className="size-3.5" /> : step.number}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      active ? "text-primary" : done ? "text-green-600" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground/70">{step.description}</p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 mb-6 h-0.5 flex-1 transition-colors",
                    currentStep > step.number ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Step1({
  state,
  airports,
  loading,
  onTitleChange,
  onAirportChange,
}: {
  state: WizardState;
  airports: AirportOut[];
  loading: boolean;
  onTitleChange: (v: string) => void;
  onAirportChange: (icao: string, airport: AirportOut | null) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">Job Configuration</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide a descriptive title for your analysis job. This helps identify and organise your work.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="job-title">
          Job Title <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="job-title"
            placeholder="e.g., EGLL Airport Classification Analysis"
            value={state.title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={100}
            className="pr-14"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {state.title.length}/100
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>
          Airport <span className="text-destructive">*</span>
        </Label>
        {loading ? (
          <div className="h-9 animate-pulse rounded-md bg-muted" />
        ) : (
          <AirportSearch
            airports={airports}
            value={state.icaoCode}
            onChange={onAirportChange}
          />
        )}
        <p className="text-xs text-muted-foreground">
          Select an airport to fetch its AIP document from our library.
        </p>
      </div>
    </div>
  );
}

function Step2({
  templates,
  loading,
  selectedTemplateId,
  onSelect,
}: {
  templates: TemplateSummary[];
  loading: boolean;
  selectedTemplateId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">Configure Analysis Rules</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a pre-built template to configure rules automatically.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedTemplateId === template.id}
              onSelect={() => onSelect(template.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: TemplateSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col gap-2 rounded-lg border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/50 hover:bg-muted/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-foreground">{template.name}</span>
        {template.category && (
          <span className="shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
            {template.category}
          </span>
        )}
      </div>
      {template.description && (
        <p className="text-xs text-muted-foreground">{template.description}</p>
      )}
      {selected && (
        <p className="flex items-center gap-1 text-xs font-medium text-green-600">
          <CheckIcon className="size-3" />
          Template applied successfully
        </p>
      )}
    </button>
  );
}

function Step3({
  state,
  selectedTemplate,
}: {
  state: WizardState;
  selectedTemplate?: TemplateSummary;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">Review & Submit</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your job configuration before submitting for analysis.
        </p>
      </div>

      <div className="rounded-lg border p-5">
        <h4 className="mb-4 font-medium text-foreground">Job Summary</h4>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Job Title</dt>
            <dd className="mt-0.5 font-medium">{state.title || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">ICAO Code</dt>
            <dd className="mt-0.5 font-medium">{state.icaoCode || "Not specified"}</dd>
          </div>
          {state.airport && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Airport</dt>
              <dd className="mt-0.5 font-medium">{state.airport.name}</dd>
            </div>
          )}
          <div className="col-span-2">
            <dt className="text-muted-foreground">Analysis Template</dt>
            <dd className="mt-0.5 font-medium">
              {selectedTemplate ? selectedTemplate.name : "None selected"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
