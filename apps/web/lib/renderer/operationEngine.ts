/**
 * Operation Engine untuk hidden-operation-text & readonly-operation-text
 * Syntax: "string" ++ column ++ " * " ++ col2 ++ " = " ++ col1 * col2
 * Operators: ++ (concat), "", *, /, +, -
 * Contoh: "hasil dari "++nama_column_1++" * "++nama_column_2++" = "++ nama_column_1 * nama_column_2
 * Jika col1=1 col2=2 => "1 * 2 = 2"
 */

export function evaluateOperation(expression: string, row: Record<string, any>): string {
  if (!expression || typeof expression !== "string") return ""

  // Split by ++ but keep inside "" safe? Simple split: expression.split("++")
  // Need to handle that ++ inside "" should not split, but our spec uses "" for string literals only, and ++ as delimiter outside strings.
  // So split by ++
  const rawTokens = expression.split("++")
  let result = ""

  for (let raw of rawTokens) {
    const token = raw.trim()
    if (!token) continue

    // String literal: starts and ends with "
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      result += token.slice(1, -1)
      continue
    }
    // If token is quoted but not perfectly, handle first and last char
    if (token.startsWith('"') || token.startsWith("'")) {
      // Might be like "hasil dari  with missing? take inner
      const first = token[0]
      const last = token[token.length - 1]
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        result += token.slice(1, -1)
        continue
      }
      // fallback: remove leading quote
      result += token.replace(/^["']|["']$/g, "")
      continue
    }

    // Check if token is arithmetic expression (contains * / + - and column names)
    // We detect if token contains operator and at least one column name pattern
    // Column names are assumed snake_case or alphanumeric
    // If token contains operator, evaluate as arithmetic
    if (/[*\/+\-]/.test(token)) {
      // Try to evaluate arithmetic: replace column names with numeric values
      // For safety, replace all word tokens that are column names
      // Example: "nama_column_1 * nama_column_2" -> "1 * 2"
      // If token also contains string like "hasil" without quotes, treat as column? Not.
      let expr = token
      // Find all potential column identifiers (alphanumeric + underscore)
      const colRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g
      const matches = token.match(colRegex) || []
      let isArithmetic = false
      for (const m of matches) {
        // if m is in row, replace; if m is numeric already, skip
        if (m in row) {
          const v = row[m]
          const num = parseFloat(String(v))
          const numStr = isNaN(num) ? "0" : String(num)
          // Replace all occurrences of this column name (word boundary)
          expr = expr.replace(new RegExp(`\\b${m}\\b`, "g"), numStr)
          isArithmetic = true
        } else if (/^\d+$/.test(m)) {
          // numeric literal, keep
          isArithmetic = true
        }
      }
      // If we replaced at least one column or contains operator, try to evaluate
      if (isArithmetic && /[*\/+\-]/.test(expr)) {
        try {
          // Sanitize: only allow digits, operators, parentheses, dots, spaces
          if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
            // If not purely numeric expression, fallback to string concatenation of tokens?
            // Try to fallback: if expr still contains letters, treat as missing columns -> 0
            expr = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, "0")
          }
          // Evaluate safely
          // eslint-disable-next-line no-new-func
          const fn = new Function(`"use strict"; return (${expr})`)
          const val = fn()
          result += String(val ?? "")
          continue
        } catch {
          // fallback to raw token interpolation as column value
          result += String(row[token] ?? token)
          continue
        }
      }
    }

    // Default: treat token as column reference
    // Trim and check if column exists in row
    const colName = token.trim()
    if (colName in row) {
      const v = row[colName]
      // Handle select_multiple or relation multiple stored as JSON string
      if (typeof v === "string" && (v.startsWith("[") || v.startsWith("{"))) {
        try {
          const parsed = JSON.parse(v)
          if (Array.isArray(parsed)) result += parsed.join(", ")
          else result += String(v)
        } catch {
          result += String(v ?? "")
        }
      } else {
        result += String(v ?? "")
      }
    } else {
      // If not found, treat as literal? Could be empty
      // Try to see if token itself is numeric
      if (!isNaN(Number(token))) result += token
      else result += "" // unknown column -> empty to avoid breaking
    }
  }

  return result
}

// Helper to compute all operation columns for a row
export function computeOperationColumns(
  columns: Array<{ name: string; type: string; optionsJson?: string | null }>,
  row: Record<string, any>
): Record<string, any> {
  const out = { ...row }
  for (const col of columns) {
    if (col.type === "hidden_operation_text" || col.type === "readonly_operation_text") {
      let expr = ""
      try {
        const opts = col.optionsJson ? JSON.parse(col.optionsJson) : {}
        expr = opts.expression || opts.formula || ""
      } catch {
        expr = ""
      }
      if (expr) {
        out[col.name] = evaluateOperation(expr, out)
      }
    }
  }
  return out
}

// Client-side helper for realtime: watch dependent columns
export function getDependentColumns(expression: string): string[] {
  if (!expression) return []
  const tokens = expression.split("++").map((t) => t.trim()).filter(Boolean)
  const deps: string[] = []
  for (const tok of tokens) {
    if (tok.startsWith('"') && tok.endsWith('"')) continue
    // Extract column names
    const matches = tok.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || []
    for (const m of matches) {
      // Exclude operators that are not columns? Hard to know, but assume all identifiers are columns
      // Filter out numeric
      if (!/^\d+$/.test(m) && !["true", "false", "null"].includes(m)) {
        if (!deps.includes(m)) deps.push(m)
      }
    }
  }
  return deps
}
