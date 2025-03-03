import { AgentMessage, AgentMessageTextContent } from "../../types";

/**
 * Appends text to the last text message in the assistant message.
 * If the last message is not text, it creates a new text message.
 */
export function appendTextToAssistantMessage(
    assistantMessage: AgentMessage,
    text: string,
): void {
    const contentArrLength = assistantMessage.content.length;
    const isFirstAssistantMessage = contentArrLength === 0;
    const isLastMessageNotText = contentArrLength > 0 && assistantMessage.content[contentArrLength - 1].type !== "text";

    // create a new text message if it's a new message or the last message is not text
    if (isFirstAssistantMessage || isLastMessageNotText) {
        assistantMessage.content.push({
            type: "text",
            text: text,
        });
    } else {
        if (assistantMessage.content[contentArrLength - 1].type === "text") {
            (assistantMessage.content[contentArrLength - 1] as AgentMessageTextContent).text += text;
        }
    }
}