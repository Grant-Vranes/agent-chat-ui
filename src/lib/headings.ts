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

export interface RoundGroup {
  roundIndex: number;
  userItem: OverviewItem;
  children: OverviewItem[];
}

export function extractHeadings(content: string, msgId: string): HeadingItem[] {
  const items: HeadingItem[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  const slugCount = new Map<string, number>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const baseSlug = text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, "");
    const count = slugCount.get(baseSlug) ?? 0;
    slugCount.set(baseSlug, count + 1);
    const id = count === 0 ? `heading-${msgId}-${baseSlug}` : `heading-${msgId}-${baseSlug}-${count}`;
    items.push({
      id,
      text,
      level,
      msgId,
    });
  }
  return items;
}

export function getRoundGroups(messages: ChatMessage[]): RoundGroup[] {
  const groups: RoundGroup[] = [];
  let roundIndex = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "user") continue;

    const userText = msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content;
    const userItem: OverviewItem = {
      id: `msg-${msg.id}`,
      text: userText,
      type: "user",
      msgId: msg.id,
    };

    const children: OverviewItem[] = [];

    const nextMsg = messages[i + 1];
    if (nextMsg?.role === "assistant") {
      const headings = extractHeadings(nextMsg.content, nextMsg.id);
      if (headings.length > 0) {
        for (const h of headings) {
          children.push({ id: h.id, text: h.text, type: "ai-heading", msgId: h.msgId });
        }
      } else {
        const aiText = nextMsg.content.length > 80 ? nextMsg.content.slice(0, 80) + "…" : nextMsg.content;
        children.push({
          id: `msg-${nextMsg.id}`,
          text: aiText,
          type: "ai-summary",
          msgId: nextMsg.id,
        });
      }
    }

    groups.push({ roundIndex: roundIndex++, userItem, children });
  }

  return groups;
}