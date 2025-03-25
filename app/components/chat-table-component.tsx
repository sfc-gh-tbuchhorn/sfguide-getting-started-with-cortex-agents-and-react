import { motion } from "framer-motion";
import { Markdown } from "./markdown";
import { format } from "date-fns";

function convertSnowflakeDate(n: number): string {
    const base = new Date("1970-01-01T00:00:00Z");
    const corrected = new Date(base.getTime() + n * 86400000); // 86400000 ms/day
    return format(corrected, "MM-dd-yyyy");
}

function formatSnowflakeDatesInMarkdown(markdown: string): string {
    return markdown.replace(/\b\d{4,5}\b/g, (match) => {
        const n = parseInt(match, 10);
        if (n >= 16000 && n <= 20000) {
            return convertSnowflakeDate(n);
        }
        return match;
    });
}

export interface ChatTableComponentProps {
    tableMarkdown: string;
    open: boolean;
}

export function ChatTableComponent(props: ChatTableComponentProps) {
    const { tableMarkdown, open } = props;

    return (
        <motion.div
            className="w-full mx-auto max-w-3xl pr-4 pl-0 group/message"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0 } }}
        >
            <details open={open}>
                <summary>View result table</summary>
                <Markdown>{formatSnowflakeDatesInMarkdown(tableMarkdown)}</Markdown>
            </details>
        </motion.div>
    )
}