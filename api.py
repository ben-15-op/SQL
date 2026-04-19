import time
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Any

from lexer.lexer import Lexer
from parser.parser import Parser
from semantic.analyzer import SemanticAnalyzer
from logical.builder import LogicalPlanBuilder
from logical.optimizer import LogicalOptimizer
from execution.builder_exec import PhysicalPlanBuilder
from storage.catalog import Catalog
from utils.relational_algebra import predicate_to_string, dml_ddl_to_ra

app = FastAPI(title="MiniSQL API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global catalog
catalog = Catalog()
analyzer = SemanticAnalyzer(catalog)
logical_builder = LogicalPlanBuilder()
optimizer = LogicalOptimizer(catalog)
physical_builder = PhysicalPlanBuilder(catalog)

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    status: str
    message: str
    rows: Optional[List[dict]] = None
    columns: Optional[List[str]] = None
    timings: dict
    plan_tree: dict
    ra_string: Optional[str] = None

class PipelineRequest(BaseModel):
    query: str

def serialize_ast(node) -> Any:
    if node is None:
        return None
    if isinstance(node, (str, int, float, bool)):
        return node
    if isinstance(node, list):
        return [serialize_ast(n) for n in node]
    try:
        attrs = {k: serialize_ast(v) for k, v in vars(node).items() if not k.startswith("_")}
        attrs["type"] = node.__class__.__name__
        return attrs
    except TypeError:
        return str(node)

# We can re-use the predicate_to_string function directly from util
def serialize_plan(plan) -> dict:
    if not plan:
        return {}

    node_type = plan.__class__.__name__
    label = node_type
    children = []

    if node_type == "LogicalScan":
        label = f"Scan({plan.table})"
    elif node_type == "LogicalFilter":
        from utils.relational_algebra import predicate_to_string
        label = f"Filter({predicate_to_string(plan.predicate)})"
        children.append(serialize_plan(plan.child))
    elif node_type == "LogicalProject":
        label = f"Project({', '.join(plan.columns)})"
        children.append(serialize_plan(plan.child))
    elif node_type == "LogicalJoin":
        from utils.relational_algebra import predicate_to_string
        label = f"Join({predicate_to_string(plan.condition)})"
        children.append(serialize_plan(plan.left_child))
        children.append(serialize_plan(plan.right_child))
    elif node_type == "LogicalGroupBy":
        label = f"GroupBy({', '.join(plan.group_cols)})"
        children.append(serialize_plan(plan.child))
    elif node_type == "LogicalHaving":
        from utils.relational_algebra import predicate_to_string
        label = f"Having({predicate_to_string(plan.predicate)})"
        children.append(serialize_plan(plan.child))
    elif node_type == "LogicalOrderBy":
        label = f"OrderBy({plan.column} {plan.order_type})"
        children.append(serialize_plan(plan.child))
    elif node_type == "LogicalLimit":
        label = f"Limit({plan.limit})"
        children.append(serialize_plan(plan.child))
    elif node_type == "LogicalCreateTable":
        cols = ", ".join([c[0] if isinstance(c, (list, tuple)) else str(c) for c in plan.columns])
        label = f"CreateTable({plan.table}, {cols})"
    elif node_type == "LogicalInsert":
        label = f"Insert({plan.table})"
    elif node_type == "LogicalDelete":
        label = f"Delete({plan.table})"
    elif node_type == "LogicalUpdate":
        label = f"Update({plan.table})"
    elif node_type == "LogicalTruncate":
        label = f"Truncate({plan.table})"

    return {
        "id": str(id(plan)),
        "type": node_type,
        "label": label,
        "children": children
    }


@app.post("/query", response_model=QueryResponse)
def execute_query(req: QueryRequest):
    sql = req.query
    timings = {}

    try:
        # Lexing & Parsing
        t0 = time.perf_counter()
        lexer = Lexer(sql)
        tokens = lexer.tokenize()
        parser = Parser(tokens)
        ast = parser.parse()
        timings["parse_ms"] = round((time.perf_counter() - t0) * 1000, 2)

        # Semantic Analysis
        t0 = time.perf_counter()
        analyzer.analyze(ast)
        timings["semantic_ms"] = round((time.perf_counter() - t0) * 1000, 2)

        # Logical Plan
        t0 = time.perf_counter()
        logical_plan = logical_builder.build(ast)
        timings["logical_ms"] = round((time.perf_counter() - t0) * 1000, 2)

        ra_string = dml_ddl_to_ra(logical_plan)
        
        # Optimization
        t0 = time.perf_counter()
        optimized_plan = optimizer.optimize(logical_plan)
        timings["optimize_ms"] = round((time.perf_counter() - t0) * 1000, 2)
        
        # Serialize Plan for UI
        plan_tree = serialize_plan(optimized_plan)
        
        # Physical Plan
        t0 = time.perf_counter()
        physical_plan = physical_builder.build(optimized_plan)
        
        if not physical_plan:
            timings["exec_ms"] = round((time.perf_counter() - t0) * 1000, 2)
            return QueryResponse(
                status="success",
                message="Command executed successfully.",
                timings=timings,
                plan_tree=plan_tree,
                ra_string=ra_string
            )

        # Execution
        physical_plan.init()
        rows = []
        columns = []
        while True:
            tup = physical_plan.next()
            if tup is None:
                break
            rows.append(tup)
            if not columns and tup:
                columns = list(tup.keys())
                
        timings["exec_ms"] = round((time.perf_counter() - t0) * 1000, 2)

        return QueryResponse(
            status="success",
            message=f"Returned {len(rows)} rows.",
            rows=rows,
            columns=columns,
            timings=timings,
            plan_tree=plan_tree,
            ra_string=ra_string
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/pipeline")
def execute_pipeline(req: PipelineRequest):
    sql = req.query
    stages = {}
    timings = {}

    import time
    from lexer.lexer import Lexer
    from parser.parser import Parser

    # Stage 1: Lex
    t0 = time.perf_counter()
    lexer = Lexer(sql)
    try:
        tokens = lexer.tokenize()
        stages["tokens"] = [{"type": t.type.name, "value": t.value} for t in tokens]
    except Exception as e:
        stages["tokens"] = []
        return {"query": sql, "stages": stages, "timings": timings, "error": str(e), "failed_stage": "Lexer"}
    timings["lex_ms"] = round((time.perf_counter() - t0) * 1000, 2)

    # Stage 2: Parse
    t0 = time.perf_counter()
    try:
        parser = Parser(tokens)
        ast = parser.parse()
        stages["ast"] = serialize_ast(ast)
    except Exception as e:
        stages["ast"] = None
        return {"query": sql, "stages": stages, "timings": timings, "error": str(e), "failed_stage": "Parser"}
    timings["parse_ms"] = round((time.perf_counter() - t0) * 1000, 2)

    # Stage 3: Semantic
    t0 = time.perf_counter()
    try:
        analyzer.analyze(ast)
        stages["semantic"] = {"status": "success", "error": None}
    except Exception as e:
        stages["semantic"] = {"status": "error", "error": str(e)}
        return {"query": sql, "stages": stages, "timings": timings, "error": str(e), "failed_stage": "Semantic"}
    timings["semantic_ms"] = round((time.perf_counter() - t0) * 1000, 2)

    # Stage 4: Logical
    t0 = time.perf_counter()
    logical_plan = logical_builder.build(ast)
    ra_string = dml_ddl_to_ra(logical_plan) if logical_plan else None
    
    optimized_plan = optimizer.optimize(logical_plan) if logical_plan else None
    stages["logical_plan"] = {
        "before_optimization": serialize_plan(logical_plan),
        "after_optimization": serialize_plan(optimized_plan),
        "ra_string": ra_string
    }
    timings["logical_ms"] = round((time.perf_counter() - t0) * 1000, 2)

    # Stage 5: Physical
    t0 = time.perf_counter()
    # Mocking mappings by walking logical nodes just for UI visualization
    mappings = []
    def walk_logical_for_mapping(node):
        if not node: return
        node_type = node.__class__.__name__
        phys_name = node_type.replace("Logical", "") + "Exec"
        if node_type == "LogicalScan": phys_name = "SeqScanExec"
        elif node_type == "LogicalFilter": phys_name = "FilterExec"
        elif node_type == "LogicalProject": phys_name = "ProjectExec"
        elif node_type == "LogicalJoin": phys_name = "NestedLoopJoinExec"
        
        desc = "Executes " + node_type.replace("Logical", "")
        if "SeqScanExec" in phys_name: desc = "Sequential scan of table rows"
        elif "FilterExec" in phys_name: desc = "Evaluates WHERE predicate per row"
        elif "ProjectExec" in phys_name: desc = "Selects only requested columns"
        elif "NestedLoopJoinExec" in phys_name: desc = "Nested iteration join over tables"

        serialized_label = serialize_plan(node).get("label", node_type)
        mappings.append({"logical": serialized_label, "logical_type": node_type, "physical": phys_name, "description": desc})
        
        if hasattr(node, "child"): walk_logical_for_mapping(node.child)
        if hasattr(node, "left_child"): walk_logical_for_mapping(node.left_child)
        if hasattr(node, "right_child"): walk_logical_for_mapping(node.right_child)

    walk_logical_for_mapping(optimized_plan)
    stages["physical_plan"] = {"mappings": mappings}
    timings["physical_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    
    # Build actual physical plan
    physical_plan = physical_builder.build(optimized_plan) if optimized_plan else None

    # Stage 6: Execute
    t0 = time.perf_counter()
    trace = []
    rows = []
    columns = []
    if physical_plan:
        trace.append(f"Initializing {physical_plan.__class__.__name__}")
        try:
            physical_plan.init()
            while True:
                tup = physical_plan.next()
                if tup is None:
                    break
                rows.append(tup)
                if not columns and tup:
                    columns = list(tup.keys())
            trace.append(f"Execution finished. Pulled {len(rows)} output tuples.")
        except Exception as e:
            trace.append(f"Runtime execution error: {e}")
            
    stages["execution"] = {"trace": trace, "rows": rows, "columns": columns}
    timings["exec_ms"] = round((time.perf_counter() - t0) * 1000, 2)

    return {"query": sql, "stages": stages, "timings": timings}


@app.get("/catalog")
def get_catalog():
    data = []
    
    # Reload from disk just in case changes are made
    catalog._load()
    
    for name, table in catalog.tables.items():
        data.append({
            "name": name,
            "columns": [{"name": k, "type": v} for k, v in table.columns.items()],
            "rows": len(table.rows),
            "primary_key": table.primary_key,
            "unique_keys": table.unique_keys
        })
    return {"tables": data}

# ─── Serve React Frontend (for deployment) ───
# After building the React app, serve the static files
STATIC_DIR = os.path.join(os.path.dirname(__file__), "ui", "dist")

if os.path.isdir(STATIC_DIR):
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="static-assets")

    # Catch-all: serve index.html for any non-API route (SPA routing)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=True)
