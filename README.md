# MiniSQL — A Miniature Relational Database Engine

A full-pipeline SQL engine built from scratch in Python, featuring lexical analysis, parsing, semantic validation, logical plan generation, query optimization, physical execution via the Volcano Iterator model, and a React-based IDE frontend (**MiniSQL Studio**).

## Table of Contents

1. [Quick Start- installations& pre requistes](#quick-start)
2. [Overview](#overview)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Usage](#usage)
6. [Running Tests](#running-tests)
7. [Supported SQL](#supported-sql)
8. [Deployment](#deployment)

---

## Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Python** | ≥ 3.10 | Backend engine and API server |
| **pip** | (bundled with Python) | Python package manager |
| **Node.js** | ≥ 18 (recommended 20+) | Frontend build toolchain |
| **npm** | (bundled with Node.js) | JavaScript package manager |
| **Git** | Any recent version | Version control |
| **GCC / Clang** | Any *(optional)* | Only needed if running the legacy `codegen` / `compiler` modules |

Verify installations:

```bash
python --version        # Should print Python 3.10+
pip --version
node --version          # Should print v18+ or v20+
npm --version
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ben-15-op/SQL.git
cd SQL

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Install Frontend dependencies
cd ui
npm install
cd ..
```

**Python packages installed:**

| Package | Purpose |
|---------|---------|
| `fastapi` | High-performance async web framework for the API server |
| `uvicorn` | ASGI server to run FastAPI |
| `pydantic` | Request/response data validation and serialization |

> **Note:** For pinned (reproducible) versions, use `pip install -r requirements_ui.txt` instead.

**Frontend packages installed (from `package.json`):**

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `@xyflow/react` | Interactive node-graph for query plan visualization |
| `axios` | HTTP client for API communication |
| `lucide-react` | Icon library |
| `vite` | Lightning-fast dev server and bundler |
| `typescript` | Static type checking |

### Running the Project

**Terminal 1 — Start the API server:**

```bash
python -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Start the frontend dev server:**

```bash
cd ui
npm run dev
```

Then open the URL shown by Vite (typically `http://localhost:5173`).

### Using the Makefile

```bash
make install    # Install all dependencies (Python + Node)
make backend    # Start the FastAPI backend (port 8000)
make frontend   # Start the Vite dev server (port 5173)
make run        # Start both backend and frontend together (Windows)
make test       # Run all Python unit tests
make build      # Build frontend for production
make clean      # Remove caches, build artifacts, temp files
make help       # Show all available targets
```

---


## Overview

MiniSQL is a compiler-design lab project that implements the core pipeline of a relational database management system:

```
SQL String ──▶ Lexer ──▶ Parser (AST) ──▶ Semantic Analyzer ──▶ Logical Plan
    ──▶ Optimizer ──▶ Physical Plan ──▶ Volcano Execution Engine ──▶ Results
```

The project also ships with a **React + TypeScript** IDE (MiniSQL Studio) that provides:
- A rich SQL editor with syntax highlighting
- Real-time pipeline visualization (Tokens → AST → Logical Plan → Optimized Plan → Results)
- Interactive query graph (powered by React Flow)
- Catalog browser and storage monitor
- Light / Dark theme toggle
### 🌐 Live Demo — [https://sql-a8yx.onrender.com/](https://sql-a8yx.onrender.com/)
---

## Architecture

| Layer | Module | Description |
|-------|--------|-------------|
| **Lexer** | `lexer/` | Tokenizes raw SQL strings into a stream of typed tokens |
| **Parser** | `parser/` | Recursive-descent parser that builds an Abstract Syntax Tree (AST) |
| **Semantic Analyzer** | `semantic/` | Validates column references, type compatibility, and schema constraints against the catalog |
| **Logical Planner** | `logical/` | Converts the AST into a tree of relational algebra operators (Scan, Filter, Project, Join, GroupBy, etc.) |
| **Optimizer** | `logical/optimizer.py` | Applies rule-based optimizations (predicate pushdown, projection pruning) |
| **Physical Planner** | `planner/` | Maps logical operators to physical executor nodes |
| **Execution Engine** | `execution/` | Pull-based Volcano Iterator model — every operator exposes `init()`, `next()`, `close()` |
| **Storage** | `storage/` | JSON-backed persistent catalog, buffer pool, disk manager, and page/heap abstractions |
| **Code Generation** *(legacy)* | `codegen/` | Original AOT C-code generator (retained for reference; not used in the redesigned engine) |
| **Compiler** *(legacy)* | `compiler/` | Assembly generation and linking via GCC (retained for reference) |
| **Runtime** *(legacy)* | `runtime/` | Runs compiled C executables (retained for reference) |
| **Utilities** | `utils/` | Pretty-printer and relational algebra string serializer |
| **API Server** | `api.py` | FastAPI backend exposing `/query` and `/catalog` endpoints |
| **Frontend** | `ui/` | React + TypeScript + Vite IDE (MiniSQL Studio) |

---

## Project Structure

```
.
├── api.py                    # FastAPI entry point
├── catalog.json              # Persistent table data (auto-generated)
├── requirements.txt          # Python dependencies (unpinned)
├── requirements_ui.txt       # Python dependencies (pinned for deployment)
├── render.yaml               # Render.com deployment config
├── start_ui.bat              # Windows one-click launcher
├── Makefile                  # Build & run automation
├── README.md                 # This file
│
├── lexer/
│   ├── tokens.py             # Token type enum
│   └── lexer.py              # Tokenizer
│
├── parser/
│   ├── ast.py                # AST node definitions
│   └── parser.py             # Recursive-descent parser
│
├── semantic/
│   └── analyzer.py           # Semantic validation
│
├── logical/
│   ├── logical_plan.py       # Logical operator node classes
│   ├── builder.py            # AST → Logical Plan builder
│   └── optimizer.py          # Rule-based query optimizer
│
├── planner/
│   └── physical_plan_builder.py  # Logical → Physical plan mapper
│
├── execution/
│   ├── __init__.py
│   ├── builder_exec.py       # Physical plan builder (execution layer)
│   ├── seq_scan.py           # Sequential Scan operator
│   ├── filter.py             # Filter operator
│   ├── project.py            # Projection operator
│   ├── nested_loop_join.py   # Nested-Loop Join operator
│   ├── groupby.py            # Group By operator
│   ├── having.py             # Having clause operator
│   ├── orderby.py            # Order By operator
│   ├── limit.py              # Limit operator
│   ├── insert.py             # Insert executor
│   ├── ddl_dml_exec.py       # DDL/DML command executor
│   └── executor.py           # Base executor interface
│
├── storage/
│   ├── catalog.py            # JSON-backed system catalog
│   ├── buffer_pool.py        # Buffer pool manager
│   ├── disk_manager.py       # Disk I/O manager
│   ├── page.py               # Page abstraction
│   └── table_heap.py         # Heap-file table storage
│
├── codegen/                  # (Legacy) AOT C code generator
│   ├── c_generator.py
│   ├── emitter.py
│   └── templates.py
│
├── compiler/                 # (Legacy) GCC assembly/linking
│   ├── asm_generator.py
│   └── linker.py
│
├── runtime/                  # (Legacy) Compiled executable runner
│   └── executor.py
│
├── utils/
│   ├── pretty_print.py       # AST / plan tree printer
│   └── relational_algebra.py # RA string serializer
│
├── test_lexer.py             # Lexer unit tests
├── test_parser.py            # Parser unit tests
├── test_semantic.py          # Semantic analyzer tests
├── test_logical.py           # Logical plan tests
├── test_optimizer.py         # Optimizer tests
├── test_fullpipeline.py      # End-to-end pipeline tests
├── test_joins.py             # Join query tests
├── test_storage.py           # Storage layer tests
├── test_integrity.py         # Integrity constraint tests
├── test_codegen.py           # Code generation tests
├── test_compiler.py          # Compiler tests
├── test_runtime.py           # Runtime tests
├── test_in.py                # IN / subquery tests
├── test_ri.py                # Referential integrity tests
├── test_extra.py             # Miscellaneous tests
├── test_dot.py               # DOT graph tests
│
├── ui/                       # MiniSQL Studio (React frontend)
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx           # Main application component
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── theme.tsx         # Theme provider (light/dark)
│   │   └── components/
│   │       ├── PipelineView.tsx      # Pipeline debugger
│   │       ├── QueryGraph.tsx        # React Flow query plan graph
│   │       ├── CatalogView.tsx       # Table catalog browser
│   │       ├── ArchitectureView.tsx  # Architecture diagram
│   │       └── StorageMonitor.tsx    # Storage stats monitor
│   └── dist/                 # Production build output
│
├── build/                    # (Legacy) Compiled C artifacts
│
└── Final_Deliverable.md      # Design rationale document
```

---

## Usage

### Via MiniSQL Studio (Browser IDE)

1. Start the backend and frontend (see [Quick Start](#quick-start)).
2. Open the Vite URL in your browser.
3. Type SQL queries in the editor and press **Execute**.
4. Use the tabs to inspect: **Pipeline** (Tokens → AST → Plan → Results), **Query Graph**, **Catalog**, **Architecture**, and **Storage**.

### Via API (cURL / Postman)

```bash
# Execute a query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM students;"}'

# Get the catalog
curl http://localhost:8000/catalog
```

### Via Python (direct engine usage)

```python
from lexer.lexer import Lexer
from parser.parser import Parser
from semantic.analyzer import SemanticAnalyzer
from logical.builder import LogicalPlanBuilder
from logical.optimizer import LogicalOptimizer
from execution.builder_exec import PhysicalPlanBuilder
from storage.catalog import Catalog

catalog = Catalog()
analyzer = SemanticAnalyzer(catalog)
builder = LogicalPlanBuilder()
optimizer = LogicalOptimizer(catalog)
physical = PhysicalPlanBuilder(catalog, analyzer)

sql = "SELECT name, age FROM students WHERE age > 20;"

tokens = Lexer(sql).tokenize()
ast = Parser(tokens).parse()
analyzer.analyze(ast)
logical_plan = builder.build(ast)
optimized = optimizer.optimize(logical_plan)
executor = physical.build(optimized)

executor.init()
while True:
    row = executor.next()
    if row is None:
        break
    print(row)
```

---

## Running Tests

All test files are in the project root and use Python's built-in `unittest` framework.

```bash
# Run all tests
python -m pytest test_*.py -v

# Run individual test modules
python -m pytest test_lexer.py -v
python -m pytest test_parser.py -v
python -m pytest test_semantic.py -v
python -m pytest test_logical.py -v
python -m pytest test_optimizer.py -v
python -m pytest test_fullpipeline.py -v
python -m pytest test_joins.py -v
python -m pytest test_storage.py -v
python -m pytest test_integrity.py -v
python -m pytest test_in.py -v
python -m pytest test_ri.py -v

# Or using unittest directly
python -m unittest discover -s . -p "test_*.py" -v
```

> **Note:** Some tests create/modify `catalog.json`. If tests interfere with each other, delete `catalog.json` before re-running.

---

## Supported SQL

### DDL (Data Definition)
```sql
CREATE TABLE students (id INT, name TEXT, age INT);
CREATE TABLE orders (id INT, customer_id INT REFERENCES customers(id));
```

### DML (Data Manipulation)
```sql
INSERT INTO students VALUES (1, 'Alice', 22);
DELETE FROM students WHERE id = 1;
UPDATE students SET age = 23 WHERE name = 'Alice';
TRUNCATE TABLE students;
```

### DQL (Data Query)
```sql
SELECT * FROM students;
SELECT name, age FROM students WHERE age > 20;
SELECT name FROM students WHERE age > 20 ORDER BY name ASC LIMIT 5;
SELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) > 3;
SELECT c.name, o.amount FROM customers c JOIN orders o ON o.customer_id = c.id;
SELECT * FROM students WHERE age IN (20, 21, 22);
```

### Supported Clauses
- `WHERE` with `AND`, `OR`, `NOT`, comparison operators
- `JOIN` (inner, nested-loop)
- `GROUP BY` with aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)
- `HAVING`
- `ORDER BY` (`ASC` / `DESC`)
- `LIMIT`
- `IN` (value lists)
- Primary key and unique constraints
- Foreign key (`REFERENCES`) constraints

---

## Deployment

The project is deployed live at **[https://sql-a8yx.onrender.com/](https://sql-a8yx.onrender.com/)**.

Deployment is configured via `render.yaml` for one-click deployment on [Render](https://render.com):

```bash
# Build step (executed by Render)
pip install -r requirements.txt
cd ui && npm install && npm run build

# Start command
uvicorn api:app --host 0.0.0.0 --port $PORT
```

The FastAPI server serves the built React frontend from `ui/dist/` as static files.

---

## License

This project was developed as a Compiler Design Lab project.
