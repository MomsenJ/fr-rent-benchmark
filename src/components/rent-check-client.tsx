"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { formatCurrency, formatCurrencyPrecise, formatPercent } from "@/lib/formatters";
import type { DatasetSummary, FormSegment, RentCheckResult, SearchLocationResult } from "@/lib/types";

type Language = "en" | "fr";

interface RentCheckClientProps {
  summary: DatasetSummary;
}

interface FormErrors {
  commune?: string;
  segment?: string;
  surfaceArea?: string;
  monthlyRent?: string;
  form?: string;
}

interface RangeChartProps {
  result: RentCheckResult;
  language: Language;
}

const CATEGORY_STYLES: Record<RentCheckResult["categoryLabel"], { band: string; panel: string }> = {
  low: {
    band: "bg-emerald-600 text-white",
    panel: "border-emerald-200 bg-emerald-50",
  },
  fair: {
    band: "bg-sky-700 text-white",
    panel: "border-sky-200 bg-sky-50",
  },
  high: {
    band: "bg-amber-500 text-slate-950",
    panel: "border-amber-200 bg-amber-50",
  },
  "very high": {
    band: "bg-rose-600 text-white",
    panel: "border-rose-200 bg-rose-50",
  },
};

const COPY = {
  en: {
    badge: "France apartment rent check",
    language: "Language",
    headline: "Is your rent too high?",
    subheadline:
      "See how your rent compares with local apartment benchmarks across France, using 2025 public reference data.",
    locationsCovered: "Locations covered",
    benchmarkEntries: "Benchmark entries",
    dataSourceCard: "Data source",
    dataSourceCardValue: "Indicateurs de loyers apartment",
    rentCheckTitle: "Rent check",
    rentCheckIntro:
      "Enter a city, home type, size, and monthly rent. The answer appears just below with a clear verdict and an expected range.",
    city: "City",
    cityPlaceholder: "Type a city or arrondissement",
    searchingLocations: "Searching locations…",
    startTyping: "Start with at least 2 characters.",
    department: "Department",
    arrondissement: "Arrondissement",
    homeType: "Home type",
    studioLabel: "Studio / 1-2 rooms",
    studioHint: "Best for studios, one-bedroom, and compact two-room apartments.",
    largeLabel: "3+ rooms",
    largeHint: "Best for larger apartments with three rooms or more.",
    size: "Size",
    sizeHint: "Enter the apartment size in square meters.",
    monthlyRent: "Monthly rent",
    monthlyRentHint: "Enter the rent paid each month, excluding fees if needed.",
    submit: "Check this rent",
    checking: "Checking…",
    resultPlaceholder:
      "Submit the form to see a quick verdict, an expected rent range, and the local reference used for the estimate.",
    categories: {
      low: "Below benchmark",
      fair: "Fair range",
      high: "Above benchmark",
      "very high": "Well above benchmark",
    },
    expectedRange: "Expected range",
    fullBenchmarkRange: "Local benchmark range",
    fairRange: "Fair range",
    typicalRentMarker: "Typical rent",
    yourRentMarker: "Your rent",
    basedOnBenchmark: "Based on the local benchmark for",
    aboveFullRange: "Above benchmark range",
    belowFullRange: "Below benchmark range",
    yourMonthlyRent: "Your monthly rent",
    typicalMonthlyRent: "Typical monthly rent",
    localBenchmark: "Local benchmark",
    perSquareMeterBefore: "per m² before size adjustment",
    adjustedBenchmark: "Adjusted benchmark",
    perSquareMeterAfter: "per m² after adjusting for size",
    location: "Location",
    referenceSize: "Reference size used",
    estimateConfidence: "Estimate confidence",
    confidenceHigh: "High confidence",
    confidenceMedium: "Medium confidence",
    confidenceLow: "Lower confidence",
    confidenceUnknown: "Not available",
    howItWorks: "How it works",
    dataSource: "Data source",
    disclaimer: "Disclaimer",
    howItWorksP1:
      "Start by choosing a city and the apartment type that feels closest to the home you are checking. Then enter the size and monthly rent.",
    howItWorksP2:
      "The tool compares your rent with a local apartment reference for that location. It also adjusts the estimate for size, so a very small apartment and a larger apartment are not judged in exactly the same way.",
    coreCalculation: "Core calculation",
    calc1: "Adjusted benchmark rent per m² = local benchmark rent per m² × size adjustment",
    calc2: "Expected monthly rent = adjusted benchmark rent per m² × apartment size",
    calc3: "Verdict = compare your monthly rent with the expected monthly rent",
    adjust1: "Below 70% of the reference size: +8%",
    adjust2: "70% to under 90% of the reference size: +4%",
    adjust3: "90% to 110% of the reference size: no change",
    adjust4: "Above 110% to 140% of the reference size: -5%",
    adjust5: "Above 140% of the reference size: -10%",
    howItWorksP3:
      "The result is shown as a clear verdict, plus an expected range. That range matters because rents are naturally approximate, not exact.",
    confidenceTitle: "How estimate confidence is assigned",
    confidenceBody:
      "High confidence is reserved for estimates with strong local support and a relatively tight prediction range. Medium confidence means the estimate is still useful but less precise. Lower confidence usually means the estimate relies on weaker local evidence or a broader uncertainty range.",
    dataSourceP1:
      "This app uses locally stored public apartment rent benchmark data published through data.gouv.fr under the Indicateurs de loyers apartment datasets.",
    dataSourceP2:
      "The current version covers {locations} locations and {benchmarks} benchmark entries. Some large cities, including Paris, appear at arrondissement level so the estimate can stay more locally specific.",
    dataSourceP3: 'Source: data.gouv.fr – "Carte des loyers" (Ministère de la Transition écologique)',
    disclaimerP1:
      "This is a directional rent check, not a formal legal or regulatory opinion. It is designed to help you understand whether a rent looks broadly in line with a local benchmark.",
    disclaimerP2:
      "Real rents can still differ because of furnishing, condition, floor level, views, outdoor space, renovation quality, exact street, or whether charges are included.",
    disclaimerP3:
      "If a rent looks far above the benchmark, treat that as a strong signal to investigate further rather than a final verdict on its own.",
    selectCityError: "Select a city from the suggestions list.",
    selectHomeTypeError: "Choose a home type.",
    invalidSizeError: "Enter a valid size in square meters.",
    invalidMonthlyRentError: "Enter a valid monthly rent in euros.",
    genericError: "The rent check could not be completed. Please try again.",
    benchmarkNotFound: "No benchmark was found for this city and home type.",
    gapFair: "{gap} from the expected monthly rent",
    gapLow: "{gap} below the expected monthly rent",
    gapHigh: "{gap} above the expected monthly rent",
    gapExplainLow: "About {percent} lower than the local benchmark for this size-adjusted apartment estimate.",
    gapExplainFair:
      "About {percent} away from the local benchmark, which still sits inside the fair band.",
    gapExplainHigh: "About {percent} higher than the local benchmark for this size-adjusted apartment estimate.",
    gapExplainVeryHigh:
      "About {percent} higher than the local benchmark, clearly outside the fair band.",
    approximateBenchmark: "Approximate benchmark",
  },
  fr: {
    badge: "France apartment rent check",
    language: "Langue",
    headline: "Votre loyer est-il trop élevé ?",
    subheadline:
      "Comparez votre loyer aux références locales du marché des appartements en France, à partir de données publiques de référence 2025.",
    locationsCovered: "Lieux couverts",
    benchmarkEntries: "Références disponibles",
    dataSourceCard: "Source",
    dataSourceCardValue: "Indicateurs de loyers apartment",
    rentCheckTitle: "Vérifier un loyer",
    rentCheckIntro:
      "Saisissez une ville, un type de logement, une surface et un loyer mensuel. Le résultat apparaît juste en dessous avec un verdict clair et une fourchette attendue.",
    city: "Ville",
    cityPlaceholder: "Saisissez une ville ou un arrondissement",
    searchingLocations: "Recherche des lieux…",
    startTyping: "Commencez avec au moins 2 caractères.",
    department: "Département",
    arrondissement: "Arrondissement",
    homeType: "Type de logement",
    studioLabel: "Studio / 1-2 pièces",
    studioHint: "Pour les studios, T1 et petits T2.",
    largeLabel: "3+ pièces",
    largeHint: "Pour les appartements plus grands avec trois pièces ou plus.",
    size: "Surface",
    sizeHint: "Indiquez la surface du logement en mètres carrés.",
    monthlyRent: "Loyer mensuel",
    monthlyRentHint: "Indiquez le loyer payé chaque mois, hors charges si nécessaire.",
    submit: "Vérifier ce loyer",
    checking: "Vérification…",
    resultPlaceholder:
      "Validez le formulaire pour voir un verdict rapide, une fourchette de loyer attendue et la référence locale utilisée.",
    categories: {
      low: "Sous le niveau de référence",
      fair: "Dans la fourchette normale",
      high: "Au-dessus du niveau de référence",
      "very high": "Très au-dessus du niveau de référence",
    },
    expectedRange: "Fourchette attendue",
    fullBenchmarkRange: "Fourchette locale de référence",
    fairRange: "Fourchette cohérente",
    typicalRentMarker: "Loyer typique",
    yourRentMarker: "Votre loyer",
    basedOnBenchmark: "Basé sur la référence locale pour",
    aboveFullRange: "Au-dessus de la fourchette",
    belowFullRange: "En dessous de la fourchette",
    yourMonthlyRent: "Votre loyer mensuel",
    typicalMonthlyRent: "Loyer mensuel typique",
    localBenchmark: "Référence locale",
    perSquareMeterBefore: "par m² avant ajustement de surface",
    adjustedBenchmark: "Référence ajustée",
    perSquareMeterAfter: "par m² après ajustement de surface",
    location: "Lieu",
    referenceSize: "Surface de référence utilisée",
    estimateConfidence: "Fiabilité de l'estimation",
    confidenceHigh: "Fiabilité élevée",
    confidenceMedium: "Fiabilité moyenne",
    confidenceLow: "Fiabilité plus faible",
    confidenceUnknown: "Non disponible",
    howItWorks: "Comment ça marche",
    dataSource: "Source des données",
    disclaimer: "Avertissement",
    howItWorksP1:
      "Commencez par choisir une ville et le type de logement qui correspond le mieux au bien que vous évaluez. Saisissez ensuite la surface et le loyer mensuel.",
    howItWorksP2:
      "L'outil compare votre loyer à une référence locale pour ce lieu. Il ajuste aussi l'estimation selon la surface, afin qu'un très petit logement et un logement plus grand ne soient pas évalués de la même manière.",
    coreCalculation: "Calcul principal",
    calc1: "Référence ajustée au m² = référence locale au m² × ajustement de surface",
    calc2: "Loyer mensuel attendu = référence ajustée au m² × surface du logement",
    calc3: "Verdict = comparaison entre votre loyer mensuel et le loyer attendu",
    adjust1: "En dessous de 70 % de la surface de référence : +8 %",
    adjust2: "De 70 % à moins de 90 % de la surface de référence : +4 %",
    adjust3: "De 90 % à 110 % de la surface de référence : pas de changement",
    adjust4: "Au-dessus de 110 % jusqu'à 140 % de la surface de référence : -5 %",
    adjust5: "Au-dessus de 140 % de la surface de référence : -10 %",
    howItWorksP3:
      "Le résultat affiche un verdict clair ainsi qu'une fourchette attendue. Cette fourchette est importante, car un loyer reste une estimation et non une valeur exacte.",
    confidenceTitle: "Comment la fiabilité est attribuée",
    confidenceBody:
      "Une fiabilité élevée est réservée aux estimations bien étayées localement et avec une fourchette de prédiction relativement resserrée. Une fiabilité moyenne signifie que l'estimation reste utile mais moins précise. Une fiabilité plus faible reflète généralement une base locale plus limitée ou une incertitude plus large.",
    dataSourceP1:
      "Cette application utilise des données publiques de référence sur les loyers d'appartements, stockées localement et publiées sur data.gouv.fr dans les jeux Indicateurs de loyers apartment.",
    dataSourceP2:
      "La version actuelle couvre {locations} lieux et {benchmarks} références. Certaines grandes villes, dont Paris, apparaissent au niveau de l'arrondissement afin de garder une estimation plus locale.",
    dataSourceP3: 'Source : data.gouv.fr – « Carte des loyers » (Ministère de la Transition écologique)',
    disclaimerP1:
      "Il s'agit d'un indicateur directionnel, et non d'un avis juridique ou réglementaire formel. Il sert à voir rapidement si un loyer semble globalement cohérent avec une référence locale.",
    disclaimerP2:
      "Les loyers réels peuvent varier selon l'ameublement, l'état du logement, l'étage, la vue, l'extérieur, la qualité des rénovations, la rue exacte ou l'inclusion des charges.",
    disclaimerP3:
      "Si un loyer paraît nettement au-dessus de la référence, considérez cela comme un signal fort à examiner davantage, et non comme une conclusion définitive à lui seul.",
    selectCityError: "Sélectionnez une ville dans la liste de suggestions.",
    selectHomeTypeError: "Choisissez un type de logement.",
    invalidSizeError: "Saisissez une surface valide en mètres carrés.",
    invalidMonthlyRentError: "Saisissez un loyer mensuel valide en euros.",
    genericError: "La vérification du loyer n'a pas pu être effectuée. Veuillez réessayer.",
    benchmarkNotFound: "Aucune référence n'a été trouvée pour cette ville et ce type de logement.",
    gapFair: "{gap} d'écart par rapport au loyer mensuel attendu",
    gapLow: "{gap} en dessous du loyer mensuel attendu",
    gapHigh: "{gap} au-dessus du loyer mensuel attendu",
    gapExplainLow: "Environ {percent} en dessous de la référence locale pour cette estimation ajustée selon la surface.",
    gapExplainFair:
      "Environ {percent} d'écart par rapport à la référence locale, tout en restant dans la fourchette normale.",
    gapExplainHigh: "Environ {percent} au-dessus de la référence locale pour cette estimation ajustée selon la surface.",
    gapExplainVeryHigh:
      "Environ {percent} au-dessus de la référence locale, clairement au-delà de la fourchette normale.",
    approximateBenchmark: "Référence approximative",
  },
} as const;

function sanitizeIntegerInput(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function replaceVars(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((output, [key, value]) => output.replace(`{${key}}`, value), template);
}

function segmentLabel(segment: FormSegment, language: Language): string {
  return segment === "apartment_1_2p" ? COPY[language].studioLabel : COPY[language].largeLabel;
}

function confidenceLabel(value: string | null, language: Language): string {
  const t = COPY[language];
  if (!value) {
    return t.confidenceUnknown;
  }

  if (value === "high") {
    return t.confidenceHigh;
  }

  if (value === "medium") {
    return t.confidenceMedium;
  }

  return t.confidenceLow;
}

function gapSummary(result: RentCheckResult, language: Language): string {
  const t = COPY[language];
  const gap = formatCurrencyPrecise(Math.abs(result.euroGap));

  if (result.categoryLabel === "fair") {
    return replaceVars(t.gapFair, { gap });
  }

  if (result.categoryLabel === "low") {
    return replaceVars(t.gapLow, { gap });
  }

  return replaceVars(t.gapHigh, { gap });
}

function gapExplanation(result: RentCheckResult, language: Language): string {
  const t = COPY[language];
  const percent = formatPercent(Math.abs(result.percentageGap));

  if (result.categoryLabel === "low") {
    return replaceVars(t.gapExplainLow, { percent });
  }

  if (result.categoryLabel === "fair") {
    return replaceVars(t.gapExplainFair, { percent });
  }

  if (result.categoryLabel === "high") {
    return replaceVars(t.gapExplainHigh, { percent });
  }

  return replaceVars(t.gapExplainVeryHigh, { percent });
}

function expectedRangeLabel(result: RentCheckResult, language: Language): string {
  if (result.expectedMonthlyRentLower === null || result.expectedMonthlyRentUpper === null) {
    return COPY[language].approximateBenchmark;
  }

  return `${formatCurrency(result.expectedMonthlyRentLower)} - ${formatCurrency(result.expectedMonthlyRentUpper)}`;
}

function fairRangeBounds(result: RentCheckResult): { lower: number; upper: number } {
  return {
    lower: result.expectedMonthlyRent * 0.9,
    upper: result.expectedMonthlyRent * 1.1,
  };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function anchorStyle(position: number, preferred: "start" | "center" | "end" = "center"): CSSProperties {
  const resolved =
    preferred === "center"
      ? position < 12
        ? "start"
        : position > 88
          ? "end"
          : "center"
      : preferred;

  const transform =
    resolved === "start" ? "translateX(0)" : resolved === "end" ? "translateX(-100%)" : "translateX(-50%)";

  return {
    left: `calc(${position}% + 1.25rem)`,
    transform,
  };
}

function RangeChart({ result, language }: RangeChartProps) {
  const t = COPY[language];
  const fullLower = result.expectedMonthlyRentLower ?? result.expectedMonthlyRent * 0.8;
  const fullUpper = result.expectedMonthlyRentUpper ?? result.expectedMonthlyRent * 1.2;
  const fairRange = fairRangeBounds(result);
  const safeLeft = 6;
  const safeRight = 94;
  const clusterSafeLeft = 10;
  const clusterSafeRight = 90;
  const axisSpan = safeRight - safeLeft;
  const benchmarkSpan = Math.max(fullUpper - fullLower, 1);
  const clampToAxis = (value: number): number => Math.max(safeLeft, Math.min(safeRight, value));
  const clampToCluster = (value: number): number => Math.max(clusterSafeLeft, Math.min(clusterSafeRight, value));

  const scaleValue = (value: number): number => {
    const normalized = ((value - fullLower) / benchmarkSpan) * axisSpan + safeLeft;
    return clampToAxis(normalized);
  };

  const fullLeft = safeLeft;
  const fullRight = safeRight;
  const fairLeft = scaleValue(fairRange.lower);
  const fairRight = scaleValue(fairRange.upper);
  const typicalPosition = scaleValue(result.expectedMonthlyRent);
  const userRawPosition = ((result.monthlyRent - fullLower) / benchmarkSpan) * axisSpan + safeLeft;
  const userPosition = clampToAxis(userRawPosition);
  const userOutOfRange =
    result.monthlyRent < fullLower ? "below" : result.monthlyRent > fullUpper ? "above" : "within";
  const fullCenter = (fullLeft + fullRight) / 2;
  const fairCenter = (fairLeft + fairRight) / 2;
  const userAnchor = userOutOfRange === "below" ? "start" : userOutOfRange === "above" ? "end" : "center";
  const userClusterPosition =
    userOutOfRange === "below"
      ? clusterSafeLeft
      : userOutOfRange === "above"
        ? clusterSafeRight
        : clampToCluster(userPosition);

  return (
    <div className="rounded-[1.45rem] bg-white/75 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <div className="text-sm leading-6 text-slate-700">
        {language === "fr"
          ? "Le loyer typique, la fourchette cohérente et la fourchette complète sont affichés sur la même échelle."
          : "Typical rent, the fair range, and the full benchmark range are shown on the same scale."}
      </div>
      <div className="mt-5">
        <div className="relative h-[18rem] rounded-[1.6rem] border border-slate-200/80 bg-slate-50/90 px-5 py-5 sm:h-[19rem]">
          <div className="absolute left-5 right-5 top-[8.25rem] h-2 rounded-full bg-slate-200" />
          <div
            className="absolute top-[8.25rem] h-2 rounded-full bg-slate-400"
            style={{
              left: `calc(${fullLeft}% + 1.25rem)`,
              width: `calc(${Math.max(fullRight - fullLeft, 1)}% - 0rem)`,
            }}
          />
          <div
            className="absolute top-[8rem] h-3 rounded-full bg-sky-500"
            style={{
              left: `calc(${fairLeft}% + 1.25rem)`,
              width: `calc(${Math.max(fairRight - fairLeft, 1)}% - 0rem)`,
            }}
          />

          <div className="absolute top-3 text-center" style={anchorStyle(fullCenter)}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t.fullBenchmarkRange}
            </div>
          </div>
          <div
            className="absolute h-8 w-px border-l border-dashed border-slate-300"
            style={{ left: `calc(${fullLeft}% + 1.25rem)`, top: "4.35rem" }}
          />
          <div
            className="absolute h-8 w-px border-l border-dashed border-slate-300"
            style={{ left: `calc(${fullRight}% + 1.25rem)`, top: "4.35rem" }}
          />
          <div
            className="absolute top-[3.2rem] whitespace-nowrap text-xs font-semibold text-slate-900"
            style={anchorStyle(fullLeft, "start")}
          >
            {formatCurrency(fullLower)}
          </div>
          <div
            className="absolute top-[3.2rem] whitespace-nowrap text-xs font-semibold text-slate-900"
            style={anchorStyle(fullRight, "end")}
          >
            {formatCurrency(fullUpper)}
          </div>
          <div
            className="absolute h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-slate-500 shadow-sm"
            style={{ left: `calc(${fullLeft}% + 1.25rem)`, top: "8rem" }}
          />
          <div
            className="absolute h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-slate-500 shadow-sm"
            style={{ left: `calc(${fullRight}% + 1.25rem)`, top: "8rem" }}
          />

          <div className="absolute top-[10.45rem] text-center" style={anchorStyle(fairCenter)}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">
              {t.fairRange}
            </div>
          </div>
          <div
            className="absolute h-6 w-px border-l border-dashed border-sky-300"
            style={{ left: `calc(${fairLeft}% + 1.25rem)`, top: "9.05rem" }}
          />
          <div
            className="absolute h-6 w-px border-l border-dashed border-sky-300"
            style={{ left: `calc(${fairRight}% + 1.25rem)`, top: "9.05rem" }}
          />
          <div
            className="absolute top-[12.65rem] whitespace-nowrap text-xs font-semibold text-slate-900"
            style={anchorStyle(fairLeft, "start")}
          >
            {formatCurrency(fairRange.lower)}
          </div>
          <div
            className="absolute top-[12.65rem] whitespace-nowrap text-xs font-semibold text-slate-900"
            style={anchorStyle(fairRight, "end")}
          >
            {formatCurrency(fairRange.upper)}
          </div>
          <div
            className="absolute h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-sky-600 shadow-sm"
            style={{ left: `calc(${fairLeft}% + 1.25rem)`, top: "7.95rem" }}
          />
          <div
            className="absolute h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-sky-600 shadow-sm"
            style={{ left: `calc(${fairRight}% + 1.25rem)`, top: "7.95rem" }}
          />

          <div
            className="absolute w-1 -translate-x-1/2 rounded-full bg-slate-950"
            style={{ left: `calc(${typicalPosition}% + 1.25rem)`, top: "5.25rem", height: "4rem" }}
          />
          <div
            className="absolute w-1 -translate-x-1/2 rounded-full bg-rose-600"
            style={{ left: `calc(${userPosition}% + 1.25rem)`, top: "8.95rem", height: "4rem" }}
          />
          <div
            className="absolute top-[2.9rem] rounded-2xl bg-slate-950 px-3 py-2 text-white shadow-lg"
            style={anchorStyle(typicalPosition)}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
              {t.typicalRentMarker}
            </div>
            <div className="mt-1 whitespace-nowrap text-sm font-semibold">{formatCurrency(result.expectedMonthlyRent)}</div>
          </div>
          <div
            className="absolute top-[11.15rem] flex flex-col gap-2"
            style={anchorStyle(userClusterPosition, userAnchor)}
          >
            <div className="rounded-2xl bg-rose-600 px-3 py-2 text-white shadow-lg">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/75">
                {t.yourRentMarker}
              </div>
              <div className="mt-1 whitespace-nowrap text-sm font-semibold">{formatCurrency(result.monthlyRent)}</div>
            </div>
            {userOutOfRange !== "within" ? (
              <div className="whitespace-nowrap px-1 text-[11px] font-medium leading-4 text-rose-700">
                {userOutOfRange === "above" ? t.aboveFullRange : t.belowFullRange}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RentCheckClient({ summary }: RentCheckClientProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [query, setQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<SearchLocationResult | null>(null);
  const [suggestions, setSuggestions] = useState<SearchLocationResult[]>([]);
  const [segment, setSegment] = useState<FormSegment>("apartment_1_2p");
  const [surfaceArea, setSurfaceArea] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<RentCheckResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const t = COPY[language];

  useEffect(() => {
    if (selectedLocation && query === selectedLocation.displayName) {
      setSuggestions([]);
      return;
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsSearching(true);

      try {
        const response = await fetch(`/api/locations?query=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as { locations: SearchLocationResult[] };
        setSuggestions(payload.locations);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query, selectedLocation]);

  useEffect(() => {
    if (!result) {
      return;
    }

    resultRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [result]);

  function validateForm(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!selectedLocation || query !== selectedLocation.displayName) {
      nextErrors.commune = t.selectCityError;
    }

    if (!segment) {
      nextErrors.segment = t.selectHomeTypeError;
    }

    const parsedSurfaceArea = Number(surfaceArea);
    if (!Number.isFinite(parsedSurfaceArea) || parsedSurfaceArea <= 0) {
      nextErrors.surfaceArea = t.invalidSizeError;
    }

    const parsedMonthlyRent = Number(monthlyRent);
    if (!Number.isFinite(parsedMonthlyRent) || parsedMonthlyRent <= 0) {
      nextErrors.monthlyRent = t.invalidMonthlyRentError;
    }

    return nextErrors;
  }

  function validateField(field: "surfaceArea" | "monthlyRent", value: string) {
    const parsed = Number(value);

    if (!value || !Number.isFinite(parsed) || parsed <= 0) {
      setErrors((current) => ({
        ...current,
        [field]: field === "surfaceArea" ? t.invalidSizeError : t.invalidMonthlyRentError,
      }));
      return;
    }

    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !selectedLocation) {
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/rent-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationKey: selectedLocation.inseeCode,
          segment,
          surfaceArea: Number(surfaceArea),
          monthlyRent: Number(monthlyRent),
        }),
      });

      const payload = (await response.json()) as { result?: RentCheckResult; errorCode?: string };
      if (!response.ok || !payload.result) {
        const errorMap: Record<string, string> = {
          invalid_selection: t.selectCityError,
          invalid_surface_area: t.invalidSizeError,
          invalid_monthly_rent: t.invalidMonthlyRentError,
          benchmark_not_found: t.benchmarkNotFound,
        };
        setErrors({ form: payload.errorCode ? errorMap[payload.errorCode] : t.genericError });
        return;
      }

      setErrors({});
      setResult(payload.result);
    } catch {
      setErrors({ form: t.genericError });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <section className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0e2236] text-white shadow-[0_30px_120px_rgba(3,8,24,0.45)]">
        <div className="grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.96fr_1.04fr] lg:items-start lg:px-12 lg:py-12">
          <div className="space-y-6 lg:space-y-7 lg:pr-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[#f8d7a8]">
                <span aria-hidden="true">🇫🇷</span>
                <span>{t.badge}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-300">
                <span>{t.language}</span>
                <div className="inline-flex rounded-full border border-white/15 bg-white/6 p-1">
                  {(["fr", "en"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLanguage(option)}
                      className={`rounded-full px-3 py-1 transition ${
                        language === option ? "bg-white text-[#0e2236]" : "text-slate-200"
                      }`}
                    >
                      {option.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">{t.headline}</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">{t.subheadline}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:max-w-sm lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                <div className="text-sm uppercase tracking-[0.18em] text-slate-300">{t.locationsCovered}</div>
                <div className="mt-3 text-2xl font-semibold tracking-[0.04em]">
                  {summary.locationCount.toLocaleString("fr-FR")}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                <div className="text-sm uppercase tracking-[0.18em] text-slate-300">{t.benchmarkEntries}</div>
                <div className="mt-3 text-2xl font-semibold tracking-[0.04em]">
                  {summary.benchmarkCount.toLocaleString("fr-FR")}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                <div className="text-sm uppercase tracking-[0.18em] text-slate-300">{t.dataSourceCard}</div>
                <div className="mt-2 text-xl font-semibold">{t.dataSourceCardValue}</div>
                <div className="mt-1 text-xs text-slate-300">data.gouv.fr</div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#f8d7a8]/20 bg-[#f5eadf] p-5 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:p-7 lg:-ml-6 lg:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">{t.rentCheckTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{t.rentCheckIntro}</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="relative">
                <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="commune-search">
                  {t.city}
                </label>
                <input
                  id="commune-search"
                  type="text"
                  autoComplete="off"
                  placeholder={t.cityPlaceholder}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedLocation(null);
                    setShowSuggestions(true);
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.commune;
                      return next;
                    });
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowSuggestions(false), 120);
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-[#0e2236] focus:ring-4 focus:ring-[#0e2236]/10"
                />
                <div className="mt-2 text-xs text-slate-500">{isSearching ? t.searchingLocations : t.startTyping}</div>
                {showSuggestions && suggestions.length > 0 ? (
                  <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.inseeCode}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setSelectedLocation(suggestion);
                          setQuery(suggestion.displayName);
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-slate-100"
                      >
                        <span>
                          <span className="block font-medium text-slate-900">{suggestion.displayName}</span>
                          <span className="block text-xs uppercase tracking-[0.16em] text-slate-500">
                            {suggestion.departmentCode
                              ? `${t.department} ${suggestion.departmentCode}`
                              : "France"}
                          </span>
                        </span>
                        {suggestion.isArrondissement ? (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                            {t.arrondissement}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
                {errors.commune ? <p className="mt-2 text-sm text-rose-700">{errors.commune}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">{t.homeType}</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: "apartment_1_2p" as const, label: t.studioLabel, hint: t.studioHint },
                    { value: "apartment_3p_plus" as const, label: t.largeLabel, hint: t.largeHint },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        segment === option.value
                          ? "border-[#0e2236] bg-white shadow-sm"
                          : "border-slate-300 bg-[#fffaf5]"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="segment"
                        value={option.value}
                        checked={segment === option.value}
                        onChange={() => setSegment(option.value)}
                      />
                      <span className="block font-medium text-slate-900">{option.label}</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">{option.hint}</span>
                    </label>
                  ))}
                </div>
                {errors.segment ? <p className="mt-2 text-sm text-rose-700">{errors.segment}</p> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="surface-area">
                    {t.size}
                  </label>
                  <div className="relative">
                    <input
                      id="surface-area"
                      type="text"
                      inputMode="numeric"
                      placeholder="52"
                      value={surfaceArea}
                      onChange={(event) => {
                        const nextValue = sanitizeIntegerInput(event.target.value);
                        setSurfaceArea(nextValue);
                        if (errors.surfaceArea) {
                          validateField("surfaceArea", nextValue);
                        }
                      }}
                      onBlur={() => validateField("surfaceArea", surfaceArea)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-14 text-base shadow-sm outline-none transition focus:border-[#0e2236] focus:ring-4 focus:ring-[#0e2236]/10"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-slate-500">
                      m²
                    </span>
                  </div>
                  {!errors.surfaceArea ? <p className="mt-2 text-xs text-slate-500">{t.sizeHint}</p> : null}
                  {errors.surfaceArea ? <p className="mt-2 text-sm text-rose-700">{errors.surfaceArea}</p> : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="monthly-rent">
                    {t.monthlyRent}
                  </label>
                  <div className="relative">
                    <input
                      id="monthly-rent"
                      type="text"
                      inputMode="numeric"
                      placeholder="1450"
                      value={monthlyRent}
                      onChange={(event) => {
                        const nextValue = sanitizeIntegerInput(event.target.value);
                        setMonthlyRent(nextValue);
                        if (errors.monthlyRent) {
                          validateField("monthlyRent", nextValue);
                        }
                      }}
                      onBlur={() => validateField("monthlyRent", monthlyRent)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-base shadow-sm outline-none transition focus:border-[#0e2236] focus:ring-4 focus:ring-[#0e2236]/10"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-slate-500">
                      €
                    </span>
                  </div>
                  {!errors.monthlyRent ? <p className="mt-2 text-xs text-slate-500">{t.monthlyRentHint}</p> : null}
                  {errors.monthlyRent ? <p className="mt-2 text-sm text-rose-700">{errors.monthlyRent}</p> : null}
                </div>
              </div>

              {errors.form ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errors.form}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0e2236] px-5 py-3.5 text-base font-medium text-white transition hover:bg-[#16324d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? t.checking : t.submit}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div
          ref={resultRef}
          className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
        >
          {result ? (
            <div>
              <div className={`px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] sm:px-7 ${CATEGORY_STYLES[result.categoryLabel].band}`}>
                {t.categories[result.categoryLabel]}
              </div>
              <div className="space-y-6 p-5 sm:p-7">
                <div className={`rounded-[1.6rem] border p-5 sm:p-6 ${CATEGORY_STYLES[result.categoryLabel].panel}`}>
                  <div className="space-y-5">
                    <div className="max-w-2xl space-y-3">
                      <div>
                        <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
                          {t.categories[result.categoryLabel]}
                        </h2>
                        <p className="mt-2 text-lg text-slate-800">{gapSummary(result, language)}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-700">{gapExplanation(result, language)}</p>
                      </div>
                    </div>
                    <RangeChart result={result} language={language} />
                  </div>
                </div>

                <dl className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <dt className="text-sm text-slate-500">{t.location}</dt>
                    <dd className="mt-1 text-base font-medium text-slate-900">{result.commune.displayName}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <dt className="text-sm text-slate-500">{t.homeType}</dt>
                    <dd className="mt-1 text-base font-medium text-slate-900">
                      {segmentLabel(result.segment, language)}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <dt className="text-sm text-slate-500">{t.estimateConfidence}</dt>
                    <dd className="mt-1 text-base font-medium text-slate-900">
                      {confidenceLabel(result.confidenceBase, language)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-7">
              <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm leading-7 text-slate-600">
                {t.resultPlaceholder}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <details className="group rounded-[1.6rem] border border-slate-200 bg-[#fef8ef] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-semibold text-slate-900">
              <span>{t.howItWorks}</span>
              <span className="text-sm text-slate-500 transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
              <p>{t.howItWorksP1}</p>
              <p>{t.howItWorksP2}</p>
              <div className="rounded-3xl bg-white/80 p-4">
                <p className="font-medium text-slate-900">{t.coreCalculation}</p>
                <p className="mt-2 text-slate-700">{t.calc1}</p>
                <p className="mt-1 text-slate-700">{t.calc2}</p>
                <p className="mt-1 text-slate-700">{t.calc3}</p>
              </div>
              <ul className="space-y-2 rounded-3xl bg-white/80 p-4">
                <li>{t.adjust1}</li>
                <li>{t.adjust2}</li>
                <li>{t.adjust3}</li>
                <li>{t.adjust4}</li>
                <li>{t.adjust5}</li>
              </ul>
              <p>{t.howItWorksP3}</p>
              <div className="rounded-3xl bg-white/80 p-4">
                <p className="font-medium text-slate-900">{t.confidenceTitle}</p>
                <p className="mt-2 text-slate-700">{t.confidenceBody}</p>
              </div>
            </div>
          </details>

          <details className="group rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-semibold text-slate-900">
              <span>{t.dataSource}</span>
              <span className="text-sm text-slate-500 transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
              <p>{t.dataSourceP1}</p>
              <p>
                {replaceVars(t.dataSourceP2, {
                  locations: summary.locationCount.toLocaleString("fr-FR"),
                  benchmarks: summary.benchmarkCount.toLocaleString("fr-FR"),
                })}
              </p>
              <p>{t.dataSourceP3}</p>
            </div>
          </details>

          <details className="group rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-semibold text-slate-900">
              <span>{t.disclaimer}</span>
              <span className="text-sm text-slate-500 transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
              <p>{t.disclaimerP1}</p>
              <p>{t.disclaimerP2}</p>
              <p>{t.disclaimerP3}</p>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
