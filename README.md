# OrbitAI — Agentic AI Data Analyst

**OrbitAI** is an AI-powered data analysis platform that lets users upload CSV/XLSX datasets, automatically understand data quality, clean datasets with human approval, and ask natural-language questions about their data.

Instead of requiring users to write SQL or Python, OrbitAI uses an AI agent to determine **what analysis is needed**, while deterministic data-processing tools execute the actual operations safely and reliably.

## 🚀 Live Demo

**[Try OrbitAI](https://orbit-ai-o4xq.vercel.app/)**

---

## ✨ Key Features

### 📁 Dataset Upload
- Upload CSV and XLSX files.
- Dataset ownership is isolated per authenticated user.
- Files are stored using Neon Object Storage.
- Original datasets are preserved.

### 🔍 Automatic Data Profiling
OrbitAI automatically analyzes an uploaded dataset and identifies:
- Number of rows and columns
- Column data types
- Missing values
- Unique values
- Numeric statistics
- Duplicate rows
- Potential data-quality issues

### 🧠 Semantic Schema
OrbitAI uses an LLM to understand the meaning of dataset columns. For example, `Revenue` can be matched with terms such as `sales`, `income`, or `earnings` when users ask questions in natural language.

### 🧹 AI-Assisted Data Cleaning
OrbitAI generates a proposed cleaning plan based on detected data-quality problems, including duplicate rows, invalid dates, missing values, and statistical outliers.

**Destructive operations require user approval.** The original dataset is never silently overwritten.

### 🤖 Agentic Data Analysis
Users can ask questions such as:

```text
What are my total sales?
Which product generated the highest revenue?
Show sales by region.
Are there any unusual values in quantity?
```

The analysis agent can use bounded tools for dataset profiling, column inspection, SQL execution, statistical calculations, outlier detection, and chart generation.

### 📊 Automatic Charts
OrbitAI generates chart specifications from analysis results, while the frontend renders visualizations using Recharts.

### 👤 Human-in-the-Loop
The cleaning workflow follows:

```text
Detect → Propose → User Approves → Execute → Validate
```

---

# 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      Next.js UI      │
                         │  Dashboard / Charts  │
                         └──────────┬───────────┘
                                    │ REST API
                                    ▼
                         ┌──────────────────────┐
                         │      FastAPI         │
                         │      Backend         │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
      ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
      │   Dataset     │     │  Cleaning     │     │    Analysis   │
      │   Services    │     │   Services    │     │     Agent     │
      └───────┬───────┘     └───────┬───────┘     └───────┬───────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
       ┌────────────┐       ┌──────────────┐       ┌────────────┐
       │   DuckDB   │       │    Polars    │       │    Groq    │
       │ SQL Engine │       │ Data Engine  │       │    LLM     │
       └────────────┘       └──────────────┘       └────────────┘
              │
              ▼
       ┌────────────┐
       │ PostgreSQL │
       │   / Neon   │
       └────────────┘

       File Storage
              │
              ▼
       ┌────────────────────┐
       │ Neon Object Storage│
       └────────────────────┘
```

## 🔑 Core Design Principle

> **LLM decides WHAT. Deterministic code decides HOW.**

The LLM understands user intent and creates analysis or cleaning plans. Actual data operations are performed by deterministic services such as DuckDB and Polars. This makes transformations more predictable, auditable, and efficient.

---

# 🛠️ Tech Stack

## Frontend

- Next.js
- JavaScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Framer Motion
- Recharts
- React Markdown

## Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- DuckDB
- Polars
- PyArrow

## AI

- Groq
- `openai/gpt-oss-120b`
- Semantic schema generation
- AI-generated cleaning plans
- Agentic natural-language data analysis

## Database & Storage

- PostgreSQL
- Neon
- Neon Object Storage
- Parquet

## Authentication

- Clerk

## Deployment

- Vercel

---

# 🔄 Application Workflow

```text
1. User uploads dataset
          ↓
2. Dataset stored in Neon Object Storage
          ↓
3. Dataset is automatically profiled
          ↓
4. Quality issues are identified
          ↓
5. Semantic schema is generated
          ↓
6. User reviews cleaning plan
          ↓
7. User approves cleaning
          ↓
8. Deterministic cleaning engine executes changes
          ↓
9. Cleaned dataset is stored separately
          ↓
10. User asks questions in natural language
          ↓
11. Analysis agent selects appropriate tools
          ↓
12. DuckDB / Polars perform the computation
          ↓
13. Results are validated
          ↓
14. Answer + charts are returned to the user
```

---

# 🤖 Agent Design

OrbitAI uses a bounded analysis agent rather than an unrestricted LLM workflow.

Available tools include:

```text
profile_dataset
inspect_column
execute_sql
calculate_statistics
detect_outliers
create_chart
```

The agent is constrained by a maximum number of analysis steps and retries, uses read-only SQL for analysis, validates results, and returns structured outputs. Internal chain-of-thought is not exposed to users.

---

# 🧹 Data Cleaning Design

Cleaning is separated into two stages:

### 1. Planning

The LLM analyzes detected quality issues and creates a structured cleaning plan.

### 2. Execution

The deterministic cleaning engine executes the approved operations.

```text
Detected Issues
      ↓
AI Cleaning Plan
      ↓
User Approval
      ↓
Deterministic Cleaning Engine
      ↓
Cleaned Parquet Dataset
```

Removed rows are recorded for auditing.

---

# 📊 Analysis Example

A user can ask:

```text
Which product generated the highest revenue?
```

OrbitAI can:

```text
Understand question
      ↓
Identify Revenue + Product
      ↓
Generate appropriate SQL
      ↓
Execute SQL using DuckDB
      ↓
Validate result
      ↓
Generate answer
      ↓
Generate chart specification
      ↓
Render chart with Recharts
```

---

# 🔐 Security & Data Handling

- Clerk handles authentication.
- Backend validates the authenticated user.
- Dataset queries are restricted to the current user.
- Original files are preserved.
- Cleaned files are stored separately.
- Destructive cleaning operations require approval.
- Analysis SQL is restricted to read-only operations.
- The LLM does not need the complete raw CSV for analysis.

---

# 📂 Backend Structure

```text
backend/
└── app/
    ├── main.py
    ├── api/
    │   ├── datasets.py
    │   ├── analysis.py
    │   ├── cleaning.py
    │   └── auth.py
    ├── agent/
    ├── auth/
    ├── core/
    ├── models/
    │   └── database_models.py
    ├── schemas/
    │   ├── dataset.py
    │   ├── semantic_schema.py
    │   ├── cleaning.py
    │   ├── analysis.py
    │   └── chart.py
    └── services/
        ├── profiling_service.py
        ├── dataset_service.py
        ├── dataset_reader.py
        ├── storage_service.py
        ├── llm_service.py
        ├── semantic_schema_service.py
        ├── cleaning_service.py
        ├── cleaning_engine.py
        ├── analysis_service.py
        ├── statistics_service.py
        ├── outlier_service.py
        ├── chart_service.py
        ├── result_validation_service.py
        └── agent_service.py
```

---

# ⚙️ Local Development

## Prerequisites

- Node.js
- Python 3.12+
- PostgreSQL / Neon database
- Clerk account
- Groq API key
- Neon Object Storage credentials

## Backend

```bash
cd backend
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file containing the required database, Clerk, Groq, and Neon Object Storage credentials.

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Set:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

# 📌 Supported Dataset Formats

Currently supported:

- CSV
- XLSX

Cleaned datasets are stored internally as **Parquet** for efficient processing and can be downloaded as CSV.

---

# 🎯 Why OrbitAI?

Traditional data analysis often requires users to know SQL, Python, data-cleaning techniques, statistics, and visualization tools.

OrbitAI provides a natural-language workflow:

```text
Upload → Understand → Clean → Ask → Analyze → Visualize
```

The project demonstrates how LLMs, deterministic data systems, agentic workflows, structured outputs, human approval, and modern web applications can be combined into a practical AI product.

---

# 📚 What This Project Demonstrates

- Agentic AI workflows
- LLM tool calling
- Structured LLM outputs
- Natural-language-to-SQL
- Semantic column matching
- Data profiling
- Automated data-quality detection
- Human-in-the-loop AI
- Deterministic data cleaning
- DuckDB analytical queries
- Polars data processing
- Parquet-based data storage
- AI-generated chart specifications
- Secure API design
- User-level data isolation
- Object storage
- Full-stack AI application development
- Production deployment

---

# 🚀 Future Improvements

Potential extensions include:

- More advanced statistical analysis
- Additional chart types
- Larger dataset support
- Scheduled dataset analysis
- Exportable analysis reports
- Saved analysis conversations
- More advanced anomaly detection
- Data transformation history
- Additional file formats

---

## 👨‍💻 Project

**OrbitAI — Agentic AI Data Analyst**

Live application: **https://orbit-ai-o4xq.vercel.app/**

Built as a practical full-stack AI application focused on making dataset analysis accessible through natural language.
