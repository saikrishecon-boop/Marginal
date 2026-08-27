# Cambridge Economics Navigator

You are a world-class Senior Software Architect, Product Manager, UX Designer, AI Engineer, and Full-Stack Engineer. Your task is NOT to create a prototype. Your task is to transform my existing project into a production-ready SaaS platform for Cambridge International AS/A Level Economics.

IMPORTANT:

This is NOT a greenfield project.

You MUST first understand and preserve the existing architecture.

Existing Repository:

https://github.com/vaquitavoid-blip/economics-ai-reimagined

The repository already contains:

• Gemini-powered examiner pipeline

• Essay grading engine

• Calibration anchor system

• Two-pass grading

• AO1/AO2/AO3 marking

• Examiner prompts

• Audit prompts

• Supabase backend

• Authentication

• Existing database

• Existing UI

DO NOT replace working logic.

Instead, improve, refactor, modernize and expand it.

======================================================

PROJECT GOAL

======================================================

Build the most advanced Cambridge Economics AI platform available.

Imagine combining:

ChatGPT

Claude

Khan Academy

Grammarly

Notion AI

Quizlet

Google Classroom

into one platform built specifically for Cambridge Economics students and teachers.

Every feature must ultimately help students score higher marks.

This should look and feel like a polished commercial SaaS product.

======================================================

PRIMARY OBJECTIVES

======================================================

1. Preserve all existing grading intelligence.

2. Keep Gemini API as the primary LLM.

3. Continue using Supabase.

4. Expand into a complete AI learning ecosystem.

5. Build everything production-ready.

======================================================

TECH STACK

======================================================

Frontend

React

TypeScript

Vite

TailwindCSS

shadcn/ui

Framer Motion

React Query

React Router

Backend

Supabase

Database

PostgreSQL

Authentication

Supabase Auth

Storage

Supabase Storage

Vector Database

pgvector

Embeddings

Google text embeddings

LLM

Gemini 2.5 Flash

Gemini 2.5 Pro

======================================================

UI DESIGN

======================================================

The application must feel premium.

Modern

Minimal

Glassmorphism

Professional

Dark Mode

Light Mode

Animated transitions

Beautiful typography

Rounded cards

Excellent spacing

Responsive

Fast

No clutter.

No Streamlit appearance.

Think Linear + Notion + ChatGPT.

======================================================

APPLICATION STRUCTURE

======================================================

Landing Page

Student Portal

Teacher Portal

Admin Portal

Learning Platform

Essay Grader

Knowledge Base

Analytics

Settings

======================================================

AUTHENTICATION

======================================================

Student

Teacher

Admin

Secure login

Email verification

Password reset

Role based permissions

Row Level Security

======================================================

STUDENT DASHBOARD

======================================================

Display

Study streak

Current grade

Predicted grade

Essays graded

AO1 average

AO2 average

AO3 average

Topic mastery

Weakest topics

Strongest topics

Daily goals

Recent essays

Recent learning

Recommended revision

Progress charts

Study time

Heatmap

Weekly insights

======================================================

TEACHER DASHBOARD

======================================================

Create classes

Invite students

View analytics

Assign essays

Assign practice

Monitor progress

Class averages

Weak topics

Strong topics

Download reports

View submissions

======================================================

ADMIN PANEL

======================================================

Manage users

Manage teachers

Manage students

Manage API keys

Manage prompts

Manage calibration anchors

Manage uploaded resources

Manage knowledge base

Manage embeddings

View usage

View logs

View analytics

======================================================

ESSAY GRADER

======================================================

Students paste essays.

Return

Overall mark

AO1

AO2

AO3

Band

Examiner report

Strengths

Weaknesses

Missing analysis

Missing evaluation

Missing definitions

Missing examples

Missing diagrams

Suggested improvements

Suggested resources

Suggested practice

Confidence score

======================================================

CALIBRATION

======================================================

Preserve

Calibration anchors

Examiner prompts

Audit prompts

Two-pass grading

AO logic

Band descriptors

Never remove these.

======================================================

KNOWLEDGE BASE

======================================================

Teachers upload

Coursebooks

Syllabus

Examiner reports

Mark schemes

Past papers

PDF

DOCX

Images

OCR

Extract text

Chunk intelligently

Generate embeddings

Store in pgvector

Duplicate detection

Versioning

======================================================

CONTENT TAXONOMY

======================================================

Everything must be organised as

Subject

Unit

Chapter

Topic

Subtopic

Learning Outcome

Difficulty

Extension Material

Searchable

Filterable

======================================================

AI RETRIEVAL

======================================================

Every AI response must use retrieval.

Retrieve

Relevant syllabus

Relevant mark schemes

Relevant textbook

Relevant examiner report

Relevant examples

Relevant evaluation

Relevant diagrams

Never hallucinate.

Ground every answer.

======================================================

LEARNING PLATFORM

======================================================

Create four major modules.

======================================================

1. KNOWLEDGE

======================================================

Definitions

Flashcards

MCQs

True/False

Fill in blanks

Quick quizzes

Topic summaries

Key terminology

======================================================

2. ANALYSIS

======================================================

Cause and effect

Application

Chain building

Reasoning exercises

Case studies

Identify missing links

Improve analysis

======================================================

3. EVALUATION

======================================================

Balanced judgement

Conditional conclusions

Strength vs weakness

Evaluate policy

Ranking exercises

Decision making

======================================================

4. DIAGRAMS

======================================================

Interactive diagrams

Supply

Demand

PED

PES

YED

XED

Taxes

Subsidies

Externalities

Monopoly

Perfect competition

Inflation

Unemployment

AD-AS

Current Account

Exchange Rates

Students can

Learn

Interact

Practice

Draw

Self-check

======================================================

PRACTICE ENGINE

======================================================

Generate

MCQs

Definitions

Essay plans

Case studies

Short answers

Long essays

Evaluation drills

Topic tests

Mixed tests

Adaptive revision

======================================================

AI TUTOR

======================================================

Students can ask questions naturally.

The tutor should

Explain

Give examples

Use diagrams

Suggest revision

Ask follow-up questions

Teach like a Cambridge teacher.

======================================================

ANALYTICS

======================================================

Track

AO trends

Topic mastery

Study time

Essay improvement

Predicted grades

Learning velocity

Revision recommendations

======================================================

SEARCH

======================================================

Global AI Search across

Coursebooks

Syllabus

Past papers

Examiner reports

Knowledge base

Examples

======================================================

STATUS PAGE

======================================================

Show

Current Gemini model

Database health

Embedding status

Knowledge base size

Prompt versions

Calibration anchors

Supabase status

API status

======================================================

SETTINGS

======================================================

Theme

Notifications

Learning preferences

AI settings

Account

Privacy

======================================================

DATABASE

======================================================

Expand Supabase schema.

Include

Users

Teachers

Students

Classes

Assignments

Essays

Essay versions

Essay feedback

Calibration anchors

Knowledge documents

Chunks

Embeddings

Study sessions

Practice history

Revision history

Analytics

======================================================

PERFORMANCE

======================================================

Fast loading

Optimistic updates

Caching

Lazy loading

Pagination

Streaming AI responses

======================================================

SECURITY

======================================================

RLS

Secure API

Input validation

Rate limiting

Audit logs

Encryption

======================================================

UX

======================================================

Every page should feel polished.

No unfinished components.

Beautiful empty states.

Skeleton loaders.

Helpful onboarding.

Excellent accessibility.

======================================================

CODE QUALITY

======================================================

Modular

Reusable

Strong typing

Custom hooks

Component library

Clean architecture

Scalable folder structure

Error boundaries

Testing ready

Maintainable

======================================================

IMPORTANT

======================================================

Whenever a feature already exists in the repository:

DO NOT rewrite it unnecessarily.

Improve it.

Refactor it.

Modernize it.

Reuse the business logic.

Maintain backwards compatibility wherever possible.

Think like you're building a company worth millions, not a hackathon project.

Before implementing each feature:

1. Analyse the current repository.

2. Check whether the feature already exists.

3. Reuse existing logic.

4. Improve architecture.

5. Build a polished UI.

6. Ensure production quality.

7. Keep Gemini API and Supabase as the core infrastructure.

8. Make every feature directly contribute to helping Cambridge Economics students achieve the highest possible exam marks.

This project was originally scaffolded with [Lovable](https://lovable.dev) and has since
been detached: it now runs as a standalone TanStack Start app against its own
Supabase project, with no Lovable account or subscription required to build,
run, or deploy it. See `MIGRATION.md` for the full self-hosting setup.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
#   E c o n - G r a d e r - 2 . 0  
 #   E c o n - G r a d e r - 2 . 0  
 #   M a r g i n a l  
 