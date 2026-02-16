# PostgreSQL MCP Server

PostgreSQL database access and operations.

## Package

```bash
npx -y @modelcontextprotocol/server-postgres
```

Requires `DATABASE_URL` environment variable.

## Protocol Version

Compatible with MCP Protocol 2025-11-25

## Overview

The PostgreSQL MCP server provides database access through standardized MCP primitives. It enables query execution, schema inspection, and database operations directly from AI assistants.

## Tools

| Tool | Description |
|------|-------------|
| `query` | Execute SQL query |
| `execute` | Execute SQL statement (INSERT/UPDATE/DELETE) |
| `list_tables` | List all tables in database |
| `describe_table` | Get table schema |
| `list_schemas` | List database schemas |
| `get_table_indexes` | Get indexes for a table |
| `get_foreign_keys` | Get foreign key relationships |

## Tool Parameters

### query

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sql` | string | Yes | SQL SELECT query |
| `params` | array | No | Query parameters |
| `limit` | integer | No | Max rows to return |

### execute

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sql` | string | Yes | SQL statement |
| `params` | array | No | Statement parameters |

### describe_table

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `table` | string | Yes | Table name |
| `schema` | string | No | Schema name (default: public) |

### list_tables

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `schema` | string | No | Schema name (default: public) |

### get_table_indexes

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `table` | string | Yes | Table name |
| `schema` | string | No | Schema name |

### get_foreign_keys

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `table` | string | Yes | Table name |
| `schema` | string | No | Schema name |

## Usage Examples

```
"List all tables in the database"
→ list_tables

"Show the schema of the users table"
→ describe_table table="users"

"Query active users"
→ query sql="SELECT * FROM users WHERE active = $1" params=[true] limit=100

"Get indexes on orders table"
→ get_table_indexes table="orders"

"Check foreign key relationships"
→ get_foreign_keys table="order_items"
```

## Connection String Format

```
DATABASE_URL=postgresql://user:password@host:port/database
```

Examples:
- Local: `postgresql://postgres:password@localhost:5432/mydb`
- Remote: `postgresql://user:pass@db.example.com:5432/production`
- With SSL: `postgresql://user:pass@host:5432/db?sslmode=require`

## When to Use

| Scenario | Use PostgreSQL MCP? |
|----------|---------------------|
| Query data | ✅ Yes |
| Schema inspection | ✅ Yes |
| Debug queries | ✅ Yes |
| Data exploration | ✅ Yes |
| Migrations | ❌ Use migration tools |
| Bulk operations | ❌ Use psql/scripts |
| Admin tasks | ❌ Use psql/pgAdmin |

## Security Notes

- Use read-only credentials when possible
- Avoid exposing production credentials
- Use parameterized queries (prevent SQL injection)
- Limit query results to prevent memory issues
- Review queries before execution

## Integration with Skills

- Works with `database-admin` agent for DB operations
- Use in `debugging` skill for data investigation
- Combine with `databases` skill for schema design

## Best Practices

1. **Use parameters**: Always use `params` for user input
2. **Limit results**: Set reasonable `limit` values
3. **Read-only first**: Start with SELECT queries
4. **Schema awareness**: Use `describe_table` before queries
5. **Index check**: Verify indexes for performance

## Resources

- [PostgreSQL MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
