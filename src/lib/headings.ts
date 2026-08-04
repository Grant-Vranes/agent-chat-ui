import { ChatMessage } from "./storage";

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
  msgId: string;
}

export interface OverviewItem {
  id: string;
  text: string;
  type: "user" | "ai-heading" | "ai-summary";
  msgId: string;
}

function headingId(msgId: string, text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, "");
  return `heading-${msgId}-${slug}`;
}

export function extractHeadings(content: string, msgId: string): HeadingItem[] {
  const items: HeadingItem[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    items.push({
      id: headingId(msgId, text),
      text,
      level,
      msgId,
    });
  }
  return items;
}

export function getOverview(messages: ChatMessage[]): OverviewItem[] {
  const items: OverviewItem[] = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      const text = msg.content.length > 50 ? msg.content.slice(0, 50) + "…" : msg.content;
      items.push({
        id: `msg-${msg.id}`,
        text,
        type: "user",
        msgId: msg.id,
      });
    } else {
      const headings = extractHeadings(msg.content, msg.id);
      if (headings.length > 0) {
        for (const h of headings) {
          items.push({ ...h, type: "ai-heading" } as OverviewItem);
        }
      } else {
        const text = msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content;
        items.push({
          id: `msg-${msg.id}`,
          text,
          type: "ai-summary",
          msgId: msg.id,
        });
      }
    }
  }
  return items;
}