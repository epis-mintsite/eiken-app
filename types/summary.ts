export interface SummaryScores {
  content: number;
  organization: number;
  vocabulary: number;
  grammar: number;
}

export interface SummaryError {
  id: number;
  original: string;
  type: string;
  correction: string;
  explanation: string;
}

export interface VocabSuggestion {
  original: string;
  suggested: string;
  reason: string;
}

export interface ContentAnalysis {
  key_points_coverage: string;
  unnecessary_content: string;
  structure_issues: string;
}

export interface ModelEssayAnnotation {
  sentence: string;
  role: string;
  explanation: string;
  techniques: string[];
}

export interface SummaryFeedback {
  content: string;
  organization: string;
  vocabulary: string;
  grammar: string;
}

export interface SummaryAdvice {
  priority: "high" | "medium" | "low";
  title: string;
  body: string;
}

export interface SummaryResult {
  scores: SummaryScores;
  good_points: string[];
  errors: SummaryError[];
  content_analysis: ContentAnalysis;
  vocabulary_suggestions: VocabSuggestion[];
  feedback: SummaryFeedback;
  model_essay: string;
  model_essay_annotations: ModelEssayAnnotation[];
  advice: SummaryAdvice[];
}

export interface SummaryRecord {
  id: string;
  type: "summary";
  student_name: string;
  passage_text: string;
  original_text: string;
  score_content: number;
  score_org: number;
  score_vocab: number;
  score_grammar: number;
  score_total: number;
  good_points_json: string[];
  errors_json: SummaryError[];
  content_analysis_json: ContentAnalysis;
  vocab_suggestions_json: VocabSuggestion[];
  feedback_json: SummaryFeedback;
  model_essay: string;
  model_essay_annotations?: ModelEssayAnnotation[];
  advice_json: SummaryAdvice[];
  word_count: number;
  corrected_at: string;
}
