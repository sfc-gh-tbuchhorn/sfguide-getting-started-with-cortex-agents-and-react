import shortUUID from "short-uuid";
import { AgentMessage, AgentMessageRole } from "../../types";
import { AgentApiQueryParams } from "../../useAgentAPIQuery";

export function getStandardData2AnalyticsPayload(toolResources: AgentApiQueryParams['toolResources'], input: string, statement: string, analystTextResponse: string | undefined, queryId: string) {
    const payload: AgentMessage[] = [];

    payload.push({
        id: shortUUID.generate(),
        role: AgentMessageRole.USER,
        content: [{
            type: "text",
            text: input,
        }],
    })

    payload.push({
        "id": shortUUID.generate(),
        "role": AgentMessageRole.ASSISTANT,
        "content": [{
            "type": "tool_use",
            "tool_use": {
                "tool_use_id": "toolu_f2068995",
                "name": "analyst1",
                "input": {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    "semantic_model_file": (toolResources?.analyst1 as any)?.semantic_model_file ?? "",
                    "user_query": input,
                }
            }
        }, {
            "type": "tool_results",
            "tool_results": {
                "name": "analyst1",
                "content": [{
                    "type": "json",
                    "json": {
                        "text": analystTextResponse ?? "",
                        "sql": statement,
                    }
                }]
            }
        }]
    })

    payload.push({
        "id": shortUUID.generate(),
        "role": AgentMessageRole.USER,
        "content": [{
            "type": "tool_results",
            "tool_results": {
                "name": "sql_exec",
                "content": [{
                    "type": "json",
                    "json": { "query_id": queryId }
                }]
            }
        }],
    })

    return payload;
}