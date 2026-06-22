export type SafetyStatus = "unchecked" | "safe" | "review" | "rejected" | "error";
export type ArchiveModerationStatus = "pending" | "approved" | "rejected";

type ModerationCategories = Record<string, boolean>;
type ModerationScores = Record<string, number>;

type OpenAIModerationResult = {
  flagged?: boolean;
  categories?: ModerationCategories;
  category_scores?: ModerationScores;
};

export type ModerationDecision = {
  safetyStatus: SafetyStatus;
  moderationStatus: ArchiveModerationStatus;
  flagged: boolean;
  categories: ModerationCategories;
  scores: ModerationScores;
  model: string;
  reason: string | null;
};

const MODERATION_MODEL =
  process.env.OPENAI_MODERATION_MODEL || "omni-moderation-latest";

const REJECT_CATEGORIES = new Set([
  "sexual/minors",
  "self-harm/instructions",
]);

const REVIEW_CATEGORIES = new Set([
  "harassment",
  "harassment/threatening",
  "hate",
  "hate/threatening",
  "illicit",
  "illicit/violent",
  "self-harm",
  "self-harm/intent",
  "sexual",
  "violence",
  "violence/graphic",
]);

const REVIEW_SCORE_THRESHOLDS: Record<string, number> = {
  "harassment": 0.65,
  "harassment/threatening": 0.35,
  "hate": 0.55,
  "hate/threatening": 0.3,
  "illicit": 0.7,
  "illicit/violent": 0.35,
  "self-harm": 0.55,
  "self-harm/intent": 0.35,
  "sexual": 0.55,
  "violence": 0.8,
  "violence/graphic": 0.35,
};

function trueCategories(categories: ModerationCategories) {
  return Object.entries(categories)
    .filter(([, value]) => Boolean(value))
    .map(([category]) => category);
}

function highScoreCategories(scores: ModerationScores) {
  return Object.entries(REVIEW_SCORE_THRESHOLDS)
    .filter(([category, threshold]) => (scores[category] || 0) >= threshold)
    .map(([category]) => category);
}

export function moderationStatusFromSafety(
  safetyStatus: SafetyStatus
): ArchiveModerationStatus {
  if (safetyStatus === "safe") return "approved";
  if (safetyStatus === "rejected") return "rejected";
  return "pending";
}

export function getModerationModel() {
  return MODERATION_MODEL;
}

export async function moderateReflection(
  reflection: string
): Promise<ModerationDecision> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      safetyStatus: "error",
      moderationStatus: "pending",
      flagged: true,
      categories: {},
      scores: {},
      model: MODERATION_MODEL,
      reason: "Moderation is not configured.",
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODERATION_MODEL,
        input: reflection,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("OpenAI moderation error:", JSON.stringify(error));
      throw new Error("Moderation request failed");
    }

    const data = await response.json();
    const result = data.results?.[0] as OpenAIModerationResult | undefined;
    const categories = result?.categories || {};
    const scores = result?.category_scores || {};
    const triggered = trueCategories(categories);
    const highScores = highScoreCategories(scores);
    const reviewSignals = Array.from(new Set([...triggered, ...highScores]));

    const shouldReject = reviewSignals.some((category) =>
      REJECT_CATEGORIES.has(category)
    );
    const shouldReview =
      Boolean(result?.flagged) ||
      reviewSignals.some((category) => REVIEW_CATEGORIES.has(category));

    const safetyStatus: SafetyStatus = shouldReject
      ? "rejected"
      : shouldReview
      ? "review"
      : "safe";

    const reason =
      safetyStatus === "safe"
        ? null
        : `${safetyStatus === "rejected" ? "Rejected" : "Held for review"}: ${
            reviewSignals.length ? reviewSignals.join(", ") : "moderation signal"
          }`;

    return {
      safetyStatus,
      moderationStatus: moderationStatusFromSafety(safetyStatus),
      flagged: Boolean(result?.flagged) || safetyStatus !== "safe",
      categories,
      scores,
      model: MODERATION_MODEL,
      reason,
    };
  } catch (error) {
    console.error("Moderation check failed:", error);
    return {
      safetyStatus: "error",
      moderationStatus: "pending",
      flagged: true,
      categories: {},
      scores: {},
      model: MODERATION_MODEL,
      reason: "Moderation check failed.",
    };
  }
}
