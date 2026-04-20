import os
from lexer.lexer import Lexer
from parser.parser import Parser
from semantic.analyzer import SemanticAnalyzer
from logical.builder import LogicalPlanBuilder
from logical.optimizer import LogicalOptimizer
from execution.builder_exec import PhysicalPlanBuilder
from storage.catalog import Catalog
from utils.pretty_print import pretty_output
from utils.relational_algebra import to_relational_algebra,dml_ddl_to_ra

if os.path.exists("minisql_data.db"):
    os.remove("minisql_data.db")

catalog = Catalog()
analyzer = SemanticAnalyzer(catalog)
logical_builder = LogicalPlanBuilder()
optimizer = LogicalOptimizer(catalog)
physical_builder = PhysicalPlanBuilder(catalog, analyzer)

print("Initial tables:", catalog.tables)
print("Test Catalog ID:", id(catalog))

def clean_query(sql: str):
    lines = sql.split('\n')
    cleaned = []

    for line in lines:
        line = line.strip()

        # skip full-line comments
        if line.startswith("--") or line == "":
            continue

        # remove inline comments
        if "--" in line:
            line = line.split("--")[0].strip()

        if line:
            cleaned.append(line)

    return " ".join(cleaned)

def test(sql: str):
    print("\n" + "="*30)
    print("INPUT:")
    print(sql)

    try:
        sql = clean_query(sql)

        if not sql:
            print("(comment / empty query skipped)")
            return
        
        lexer = Lexer(sql)
        tokens = lexer.tokenize()
        parser = Parser(tokens)
        ast = parser.parse()
        analyzer.analyze(ast)

        logical_plan = logical_builder.build(ast)
        print("\n--- RELATIONAL ALGEBRA ---")
        stmt = dml_ddl_to_ra(logical_plan)
        if stmt:
            print(stmt)
        else:
            print(to_relational_algebra(logical_plan,"",True))
        logical_plan = optimizer.optimize(logical_plan)
        physical_plan = physical_builder.build(logical_plan)
        if not physical_plan:
            print("\nSTATUS: Command executed successfully")
            return

        print("\n--- OUTPUT ---")
        physical_plan.init()

        rows = []

        while True:
            tup = physical_plan.next()
            if tup is None:
                break
            rows.append(tup)

        pretty_output(rows)
    except Exception as e:
        print("\nERROR:", e)


test("CREATE TABLE Orders (id INT, customer_id INT);")
test("CREATE TABLE Customers (id INT, name TEXT);")

test("INSERT INTO Orders VALUES (1, 101);")
test("INSERT INTO Orders VALUES (2, 101);")
test("INSERT INTO Orders VALUES (3, 102);")
test("INSERT INTO Orders VALUES (4, 103);")

test("INSERT INTO Customers VALUES (101, 'Alice');")
test("INSERT INTO Customers VALUES (102, 'Bob');")
test("INSERT INTO Customers VALUES (103, 'Charlie');")

test("SELECT * FROM Orders WHERE NOT id = 1;")
test("SELECT * FROM Orders WHERE id = 1 AND customer_id = 101 OR id = 3;")

test("SELECT customer_id, COUNT(*) FROM Orders GROUP BY customer_id;")
test("SELECT customer_id, COUNT(*) FROM Orders GROUP BY customer_id HAVING COUNT(*) > 1;")
test("SELECT * FROM Orders ORDER BY customer_id DESC;")
test("SELECT * FROM Orders LIMIT 1;")

test("SELECT customer_id, COUNT(*) FROM Orders WHERE id > 1 GROUP BY customer_id HAVING COUNT(*) >= 1 ORDER BY customer_id DESC LIMIT 2;")

test("SELECT * FROM Orders WHERE id = 999;")

test("DELETE FROM Orders WHERE id = 1;")
test("SELECT * FROM Orders;")

test("DELETE FROM Orders WHERE id = 999;")
test("SELECT * FROM Orders;")

test("UPDATE Orders SET customer_id = 999 WHERE id = 2;")
test("SELECT * FROM Orders;")

test("UPDATE Orders SET customer_id = 111;")
test("SELECT * FROM Orders;")

test("TRUNCATE TABLE Orders;")
test("SELECT * FROM Orders;")

test("DROP TABLE Orders;")
test("SELECT * FROM Orders;")

test("DROP TABLE IF EXISTS Orders;")

test("CREATE TABLE users (id INT,email TEXT,PRIMARY KEY(id),UNIQUE(email));")
test("INSERT INTO users VALUES (1, 'a@gmail.com');")
test("INSERT INTO users VALUES (2, 'b@gmail.com');")
test("INSERT INTO users VALUES (1, 'a@gmail.com');")
test("INSERT INTO users VALUES (2, 'b@gmail.com');")
test("INSERT INTO users VALUES (3, 'a@gmail.com');")
test("INSERT INTO users VALUES (NULL, 'x@gmail.com');")
test("SELECT * FROM users; -- inline comment")
