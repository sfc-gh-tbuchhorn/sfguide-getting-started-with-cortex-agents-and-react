import { AgentMessage } from "../../types";

export function removeSqlTableFromMessages(messages: AgentMessage[]) {
    // new array to avoid mutation
    return structuredClone(messages).map(message => {
        if (Array.isArray(message.content)) {
            message.content = message.content.filter(item => item.type !== "sql_table");
        }
        return message;
    });
}