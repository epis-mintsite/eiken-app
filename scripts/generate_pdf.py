#!/usr/bin/env python3
"""
WeasyPrint を使って添削結果の HTML を PDF に変換するスクリプト。
stdin から JSON を受け取り、HTML を生成して PDF を stdout に書き出す。
"""

import json
import sys
from weasyprint import HTML

def score_color(score: int) -> str:
    if score >= 4:
        return "#16a34a"
    if score >= 3:
        return "#2563eb"
    if score >= 2:
        return "#ca8a04"
    return "#dc2626"

def bar_color(score: int) -> str:
    if score >= 4:
        return "#22c55e"
    if score >= 3:
        return "#3b82f6"
    if score >= 2:
        return "#eab308"
    return "#ef4444"

def priority_style(priority: str) -> tuple[str, str]:
    if priority == "high":
        return "#fecaca", "#991b1b"
    if priority == "medium":
        return "#fef08a", "#854d0e"
    return "#bbf7d0", "#166534"

def type_badge_style(error_type: str) -> tuple[str, str]:
    styles = {
        "grammar": ("#fee2e2", "#b91c1c"),
        "vocabulary": ("#f3e8ff", "#7c3aed"),
        "spelling": ("#ffedd5", "#c2410c"),
        "punctuation": ("#fef9c3", "#a16207"),
        "style": ("#dbeafe", "#1d4ed8"),
    }
    return styles.get(error_type, ("#f3f4f6", "#374151"))

def build_html(data: dict) -> str:
    scores = data["scores"]
    total = scores["content"] + scores["organization"] + scores["vocabulary"] + scores["grammar"]

    score_rows = ""
    for key, label in [("content", "内容"), ("organization", "構成"), ("vocabulary", "語彙"), ("grammar", "文法")]:
        s = scores[key]
        width_pct = (s / 4) * 100
        score_rows += f"""
        <tr>
            <td style="padding:6px 12px;">{label}</td>
            <td style="padding:6px 12px;text-align:right;font-weight:bold;color:{score_color(s)};">{s} / 4</td>
            <td style="padding:6px 12px;width:200px;">
                <div style="background:#e5e7eb;border-radius:4px;height:10px;width:100%;">
                    <div style="background:{bar_color(s)};border-radius:4px;height:10px;width:{width_pct}%;"></div>
                </div>
            </td>
        </tr>"""

    error_rows = ""
    for err in data.get("errors", []):
        bg, fg = type_badge_style(err["type"])
        error_rows += f"""
        <tr>
            <td style="padding:6px 8px;color:#9ca3af;">{err["id"]}</td>
            <td style="padding:6px 8px;">
                <span style="background:{bg};color:{fg};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">{err["type"]}</span>
            </td>
            <td style="padding:6px 8px;color:#dc2626;text-decoration:line-through;">{err["original"]}</td>
            <td style="padding:6px 8px;color:#15803d;font-weight:600;">{err["correction"]}</td>
        </tr>"""

    feedback_sections = ""
    for key, label, icon in [("content", "内容", "&#x1F4DD;"), ("organization", "構成", "&#x1F3D7;"), ("vocabulary", "語彙", "&#x1F4DA;"), ("grammar", "文法", "&#x270F;")]:
        text = data.get("feedback", {}).get(key, "")
        feedback_sections += f"""
        <div style="background:#f9fafb;border-radius:8px;padding:12px 16px;margin-bottom:10px;">
            <h4 style="margin:0 0 6px 0;font-size:14px;">{icon} {label}</h4>
            <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.7;">{text}</p>
        </div>"""

    advice_items = ""
    for item in data.get("advice", []):
        bg, fg = priority_style(item["priority"])
        label_map = {"high": "高", "medium": "中", "low": "低"}
        advice_items += f"""
        <div style="border:1px solid {bg};border-radius:8px;padding:12px 16px;margin-bottom:10px;">
            <p style="margin:0 0 4px 0;">
                <span style="background:{bg};color:{fg};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">優先度: {label_map.get(item["priority"], "中")}</span>
                <strong style="margin-left:8px;">{item["title"]}</strong>
            </p>
            <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.6;">{item["body"]}</p>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<style>
    @page {{ size: A4; margin: 20mm 15mm; }}
    body {{ font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans CJK JP", "Yu Gothic", sans-serif; font-size: 13px; color: #1f2937; line-height: 1.6; }}
    h1 {{ font-size: 22px; margin: 0 0 4px 0; }}
    h2 {{ font-size: 16px; margin: 24px 0 12px 0; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; }}
    table {{ width: 100%; border-collapse: collapse; }}
    .meta {{ color: #6b7280; font-size: 13px; margin-bottom: 20px; }}
</style>
</head>
<body>
    <h1>英検準一級 ライティング添削レポート</h1>
    <p class="meta">{data.get("student_name", "")} &mdash; {data.get("topic", "")}</p>

    <h2>原文（OCR結果）</h2>
    <div style="background:#f9fafb;border-radius:8px;padding:12px 16px;white-space:pre-wrap;font-size:13px;">
{data.get("original_text", "")}</div>

    <h2>採点結果 &mdash; <span style="color:{score_color(total // 4)};font-size:24px;">{total}</span> / 16（語数: {data.get("word_count", 0)}）</h2>
    <table>{score_rows}</table>

    <h2>エラーリスト（{len(data.get("errors", []))}件）</h2>
    <table style="font-size:12px;">
        <thead>
            <tr style="border-bottom:1px solid #e5e7eb;color:#9ca3af;">
                <th style="padding:6px 8px;text-align:left;">#</th>
                <th style="padding:6px 8px;text-align:left;">タイプ</th>
                <th style="padding:6px 8px;text-align:left;">原文</th>
                <th style="padding:6px 8px;text-align:left;">修正案</th>
            </tr>
        </thead>
        <tbody>{error_rows}</tbody>
    </table>

    <h2>4観点別 講評</h2>
    {feedback_sections}

    <h2>模範答案</h2>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;font-size:13px;line-height:1.8;white-space:pre-wrap;">
{data.get("model_essay", "")}</div>

    <h2>学習アドバイス</h2>
    {advice_items}

    <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:30px;">英検準一級 ライティング添削アプリ &mdash; 自動生成レポート</p>
</body>
</html>"""


if __name__ == "__main__":
    raw = sys.stdin.read()
    data = json.loads(raw)
    html_str = build_html(data)
    pdf_bytes = HTML(string=html_str).write_pdf()
    sys.stdout.buffer.write(pdf_bytes)
