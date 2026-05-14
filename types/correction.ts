export interface CorrectionError {
  id: number;
  original: string;
  type: string;
  correction: string;
}

export interface Scores {
  content: number;
  organization: number;
  vocabulary: number;
  grammar: number;
}

export interface Feedback {
  content: string;
  organization: string;
  vocabulary: string;
  grammar: string;
}

export interface Advice {
  priority: "high" | "medium" | "low";
  title: string;
  body: string;
}

export interface CorrectionResult {
  scores: Scores;
  errors: CorrectionError[];
  feedback: Feedback;
  model_essay: string;
  advice: Advice[];
}

export interface CorrectionRecord {
  id: string;
  student_name: string;
  topic: string;
  original_text: string;
  image_url: string | null;
  score_content: number;
  score_org: number;
  score_vocab: number;
  score_grammar: number;
  score_total: number;
  errors_json: CorrectionError[];
  feedback_json: Feedback;
  model_essay: string;
  advice_json: Advice[];
  word_count: number;
  corrected_at: string;
}
