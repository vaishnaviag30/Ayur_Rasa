import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pie } from "react-chartjs-2";
import { patientApi } from "../lib/api";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const doshaDetails: Record<string, { text: string }> = {
  Vata: {
    text: `Vata is formed by the combination of air and space. It governs all movement in the body and mind, including circulation, respiration, and the nervous system. Vata types tend to be creative, energetic, and quick-thinking but may experience anxiety or restlessness when imbalanced.`,
  },
  Pitta: {
    text: `Pitta is formed by the combination of fire and water. It governs digestion, metabolism, and transformation in the body. Pitta types are typically intelligent, focused, and ambitious but may become irritable or overly competitive when out of balance.`,
  },
  Kapha: {
    text: `Kapha is formed by the combination of earth and water. It provides structure, stability, and lubrication to the body. Kapha types are naturally calm, compassionate, and steady but may experience lethargy or attachment when imbalanced.`,
  },
};

const normalizeDoshaName = (value: string | undefined) => {
  if (!value) return "Vata";
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("vata")) return "Vata";
  if (normalized.startsWith("pitta")) return "Pitta";
  if (normalized.startsWith("kapha")) return "Kapha";
  return "Vata";
};

const getDoshaText = (dosha: string) => {
  return doshaDetails[normalizeDoshaName(dosha)]?.text || doshaDetails.Vata.text;
};

function Accordion({
  title,
  content,
  defaultOpen = false,
}: {
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        // Keeping the button UI as is
        className="w-full flex justify-between items-center px-6 py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-lg font-medium text-gray-900">{title}</span>
        <svg
          className={`w-5 h-5 transform transition-transform ${
            open ? "rotate-180" : ""
          } text-gray-600`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[600px] mt-2" : "max-h-0"
        }`}
      >
        {open && (
          // **UI Change for Accordion Content:**
          // Changed background to bg-emerald-50 and border to border-emerald-300
          <div className="px-6 py-4 bg-emerald-50 border border-emerald-300 rounded-lg text-gray-700 leading-relaxed">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}

type SavedAssessment = {
  createdAt: string;
  vataScore?: number;
  pittaScore?: number;
  kaphaScore?: number;
  primaryDosha?: string;
};

export default function AssessmentResultClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assessmentResult, setAssessmentResult] = useState<{
    vata: number;
    pitta: number;
    kapha: number;
    primary: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResult = async () => {
      const hasQueryData =
        searchParams &&
        searchParams.has("vata") &&
        searchParams.has("pitta") &&
        searchParams.has("kapha");

      if (hasQueryData && searchParams) {
        const vata = Number(searchParams.get("vata") || 0);
        const pitta = Number(searchParams.get("pitta") || 0);
        const kapha = Number(searchParams.get("kapha") || 0);
        const rawPrimary = searchParams.get("primary");
        const primary =
          typeof rawPrimary === "string"
            ? rawPrimary
            : ([
                ["Vata", vata],
                ["Pitta", pitta],
                ["Kapha", kapha],
              ] as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ||
              "Vata";

        setAssessmentResult({ vata, pitta, kapha, primary });
        setIsLoading(false);
        return;
      }

      try {
        const response = await patientApi.getMyProfile();
        if (response.success && response.data?.patient) {
          type PatientRecord = {
            assessments?: unknown[];
            doshaPercentage?: string;
            dosha?: string;
          };

          const patient = response.data.patient as PatientRecord;
          const assessments = Array.isArray(patient.assessments)
            ? (patient.assessments as SavedAssessment[])
            : [];

          if (assessments.length > 0) {
            const latestAssessment = [...assessments].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];

            setAssessmentResult({
              vata: latestAssessment.vataScore ?? 0,
              pitta: latestAssessment.pittaScore ?? 0,
              kapha: latestAssessment.kaphaScore ?? 0,
              primary: latestAssessment.primaryDosha || "Vata",
            });
            setIsLoading(false);
            return;
          }

          if (patient.doshaPercentage) {
            try {
              const parsed = JSON.parse(patient.doshaPercentage);
              setAssessmentResult({
                vata: Number(parsed.vata) || 0,
                pitta: Number(parsed.pitta) || 0,
                kapha: Number(parsed.kapha) || 0,
                primary: patient.dosha || "Vata",
              });
              setIsLoading(false);
              return;
            } catch {
              // ignore parse failures and fall through to error state
            }
          }

          setError(
            "No assessment result found. Please complete the dosha quiz to see your result."
          );
        } else {
          setError(response.message || "Unable to load assessment results.");
        }
      } catch {
        setError("Unable to load assessment results.");
      }

      setIsLoading(false);
    };

    loadResult();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading assessment result...</p>
      </div>
    );
  }

  if (!assessmentResult) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-lg font-semibold text-red-700 mb-4">No saved assessment result found.</p>
          {error ? (
            <p className="text-gray-600 mb-6">{error}</p>
          ) : (
            <p className="text-gray-600 mb-6">
              Please complete the Dosha Assessment to view your personalized result.
            </p>
          )}
          <button
            onClick={() => router.push('/assessment')}
            className="rounded-full bg-green-600 px-8 py-3 text-white font-semibold hover:bg-green-700 transition"
          >
            Take Dosha Assessment
          </button>
        </div>
      </div>
    );
  }

  const { vata, pitta, kapha, primary } = assessmentResult;
  const doshaResult = [
    { name: "Vata", value: vata },
    { name: "Pitta", value: pitta },
    { name: "Kapha", value: kapha },
  ].sort((a, b) => b.value - a.value);
  const primaryDosha = normalizeDoshaName(primary);
  const secondaryDosha = normalizeDoshaName(doshaResult[1].name);

  const doshaSymbol =
    primaryDosha === "Vata" ? (
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg width="40" height="40" fill="none">
          <circle cx="20" cy="20" r="18" fill="#10b981" />
          <path
            d="M12 18c2-3 8-3 10 0M12 24c2-3 8-3 10 0"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ) : primaryDosha === "Pitta" ? (
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg width="40" height="40" fill="none">
          <circle cx="20" cy="20" r="18" fill="#10b981" />
          <path
            d="M20 12l3 9h-6l3-9zm0 9v5"
            stroke="#fff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ) : (
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg width="40" height="40" fill="none">
          <circle cx="20" cy="20" r="18" fill="#10b981" />
          <ellipse cx="20" cy="24" rx="7" ry="4" fill="#fff" />
        </svg>
      </div>
    );

  const chartData = {
    labels: ["Vata", "Pitta", "Kapha"],
    datasets: [
      {
        label: "Dosha Distribution",
        data: [vata, pitta, kapha],
        backgroundColor: ["#EC6B56", "#FFC154", "#47B39C"],
        borderColor: ["#fff", "#fff", "#fff"],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions: ChartOptions<"pie"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 14,
          },
          color: "#374151",
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.label}: ${context.parsed}%`;
          },
        },
        backgroundColor: "#1f2937",
      },
    },
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-sm tracking-wider text-gray-500 uppercase mb-3 font-medium">
            Dosha Quiz Result
          </p>
          <h1 className="text-4xl font-light text-gray-900 mb-10">
            Your dominant Dosha is
          </h1>

          <div className="flex flex-col items-center gap-4 mb-8">
            {doshaSymbol}
            <h2 className="text-3xl font-semibold text-gray-900">
              {primaryDosha}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-3 border border-emerald-600 text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-colors">
              Save Result as PDF
            </button>
            <button
              onClick={() => router.push('/diet-plan')}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              View Weekly Diet Plan
            </button>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
          <h2 className="text-center text-2xl font-semibold text-gray-900 mb-6">
            Dosha Distribution
          </h2>
          <div className="max-w-md mx-auto">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Health scale box */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-8 text-gray-700">
            <div>
              Primary:{" "}
              <span className="font-semibold text-emerald-700">
                {primaryDosha}
              </span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div>
              Secondary:{" "}
              <span className="font-semibold text-emerald-700">
                {secondaryDosha}
              </span>
            </div>
          </div>
        </div>

        {/* Dosha Accordions - Container is green */}
        <div className="bg-white border border-emerald-200 rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            What does it mean for you?
          </h2>
          <Accordion
            title={`You are predominantly ${primaryDosha}`}
            content={getDoshaText(primaryDosha)}
            defaultOpen={true}
          />
          <Accordion
            title={`Your secondary dosha is ${secondaryDosha}`}
            content={getDoshaText(secondaryDosha)}
            defaultOpen={false}
          />
        </div>
      </div>
    </div>
  );
}
