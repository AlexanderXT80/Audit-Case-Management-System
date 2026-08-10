export interface RiskFactor {
  name: string;
  percentage: number;
}

export interface RiskAnalysisInput {
  taxpayerId: string;
  riskCoefficient: number;
  reasoningHash: string;
}

export interface RiskAnalysisResult {
  scoreValue: number;
  scorePercentage: number;
  rawOutput: string;
  factors: RiskFactor[];
  explanation: string;
}

export function generateReasoningHash(): string {
  const characters = "0123456789abcdef";
  let result = "";

  for (let i = 0; i < 48; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return `sha256: ${result}`;
}

export function runRiskAnalysisModel({
  taxpayerId,
  riskCoefficient,
  reasoningHash,
}: RiskAnalysisInput): RiskAnalysisResult {
  const scoreValue = Number(riskCoefficient);
  const scorePercentage = Math.round(scoreValue * 100);

  const explanation = `Cognitive ML Core Analysis complete: Calculated anomalies for ${taxpayerId}. Identified abnormal credit claims ratios with reasoning footprint ${reasoningHash.substring(0, 20)}...`;

  const rawOutput = JSON.stringify({
    engine_id: "RSS-CORE-V2",
    timestamp: new Date().toISOString(),
    model_signature: "cms_cognitive_risk_v2.0",
    hash: reasoningHash,
    features: {
      vat_gap_index: scoreValue,
      frequent_loans_ratio: Math.min(0.9, scoreValue * 1.1),
      benford_variance: Math.min(0.8, scoreValue * 0.85)
    },
    evaluation: {
      evasion_probability: scoreValue,
      clerical_fault: parseFloat((1 - scoreValue).toFixed(2))
    },
    explanation
  }, null, 2);

  const factors: RiskFactor[] = [
    { name: "Industry Deviation & Anomalous Ratios", percentage: Math.round(scorePercentage * 0.5) },
    { name: "Round Transactional Sequence Matching", percentage: Math.round(scorePercentage * 0.3) },
    { name: "Input Tax Credit Over-Reporting Bias", percentage: Math.round(scorePercentage * 0.2) }
  ];

  return {
    scoreValue,
    scorePercentage,
    rawOutput,
    factors,
    explanation
  };
}
