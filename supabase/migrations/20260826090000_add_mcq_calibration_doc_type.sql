-- Adds a dedicated document type for real AS/A2 MCQ past papers, kept
-- separate from general course materials. These are uploaded purely as a
-- calibration reference for the MCQ generator (question style, difficulty
-- balance and per-question pacing) — never mined for grading content.
ALTER TYPE public.doc_type ADD VALUE IF NOT EXISTS 'mcq_calibration';
