
export const CORTEX_ANALYST_TOOL = {
    "tool_spec": {
        "type": "cortex_analyst_text_to_sql",
        "name": "analyst1"
    }
} as const;

export const CORTEX_SEARCH_TOOL = {
    "tool_spec": {
        "type": "cortex_search",
        "name": "search1"
    }
} as const;

export const DATA_2_ANALYTICS_TOOL = {
    "tool_spec": {
        "type": "cortex_analyst_sql_exec",
        "name": "sql_exec"
    }
} as const;

export const RELATED_QUERIES_REGEX = /Related query:\s*(.*?)\s*Answer:\s*(.*?)(?=\nRelated query:|\n*$)/gs;