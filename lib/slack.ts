/**
 * Slack Incoming Webhook で通知を送信する
 *
 * 環境変数:
 *   SLACK_WEBHOOK_URL - Slack Incoming Webhook URL
 */

interface SlackNotifyParams {
  type: "writing" | "summary";
  studentName: string;
  date: string;
  topic?: string;
  scores: {
    content: number;
    organization: number;
    vocabulary: number;
    grammar: number;
  };
  correctionId?: string;
  teacherName?: string;
}

export async function sendSlackNotification(params: SlackNotifyParams): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("SLACK_WEBHOOK_URL is not set, skipping Slack notification");
    return;
  }

  const { type, studentName, date, topic, scores, correctionId, teacherName } = params;
  const total = scores.content + scores.organization + scores.vocabulary + scores.grammar;
  const typeLabel = type === "summary" ? "要約添削" : "ライティング添削";
  const scoreLabels = type === "summary"
    ? ["内容", "構成", "語彙", "言語"]
    : ["内容", "構成", "語彙", "文法"];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eiken-app-bay.vercel.app";
  const resultPath = type === "summary" ? "summary-result" : "result";

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📝 ${typeLabel}完了`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*生徒名:*\n${studentName}` },
        { type: "mrkdwn", text: `*日付:*\n${date}` },
      ],
    },
  ];

  // Topic (writing only)
  if (type === "writing" && topic) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*TOPIC:*\n${topic.length > 100 ? topic.slice(0, 100) + "..." : topic}`,
      },
    });
  }

  // Teacher
  if (teacherName) {
    blocks.push({
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*添削者:*\n${teacherName}` },
      ],
    });
  }

  // Scores
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: [
        `*スコア: ${total} / 16*`,
        `${scoreLabels[0]} ${scores.content}/4 ｜ ${scoreLabels[1]} ${scores.organization}/4 ｜ ${scoreLabels[2]} ${scores.vocabulary}/4 ｜ ${scoreLabels[3]} ${scores.grammar}/4`,
      ].join("\n"),
    },
  });

  // Score visual bar
  const filled = "🟪".repeat(total);
  const empty = "⬜".repeat(16 - total);
  blocks.push({
    type: "context",
    elements: [
      { type: "mrkdwn", text: filled + empty },
    ],
  });

  // Divider
  blocks.push({ type: "divider" });

  // Link to result
  if (correctionId) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "結果を確認", emoji: true },
          url: `${appUrl}/${resultPath}/${correctionId}`,
          style: "primary",
        },
      ],
    });
  }

  // Context footer
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `上級ライティング添削 • ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
      },
    ],
  });

  const payload = {
    blocks,
    text: `${typeLabel}完了: ${studentName} (${total}/16)`, // fallback text
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Slack notification failed:", res.status, body);
    // Slack通知の失敗は添削処理をブロックしない
  }
}
