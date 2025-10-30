# Sample Receipts for Tool Calling Demo

These sample receipts are designed to match the 5 tasks with budgets in Demo 1's `tasks.json`.

## Receipt → Task Mapping

| Receipt | Amount | Date | Expected Match | Confidence |
|---------|--------|------|----------------|------------|
| **1-aws-receipt.txt** | $127.43 | Oct 25, 2025 | task-26: "Setup AWS cloud infrastructure" | ~92% |
| **2-office-supplies-receipt.txt** | $61.49 | Oct 30, 2025 | task-27: "Purchase office supplies" | ~88% |
| **3-team-lunch-receipt.txt** | $100.74 | Oct 28, 2025 | task-28: "Team retrospective lunch" | ~90% |
| **4-github-enterprise-receipt.txt** | $2,098.75 | Nov 1, 2025 | task-29: "Renew GitHub Enterprise licenses" | ~95% |
| **5-conference-receipt.txt** | $847.69 | Nov 2, 2025 | task-30: "Register for DevOps conference" | ~93% |

## Task Details (from tasks.json)

### task-26: Setup AWS cloud infrastructure
- **Budget:** $150.00
- **Created:** Oct 20, 2025
- **Due:** Nov 1, 2025
- **Receipt Date:** Oct 25 ✓ (within work period)
- **Receipt Amount:** $127.43 ✓ (85% budget utilization)

### task-27: Purchase office supplies
- **Budget:** $75.00
- **Created:** Oct 28, 2025
- **Due:** Nov 5, 2025
- **Receipt Date:** Oct 30 ✓ (within work period)
- **Receipt Amount:** $61.49 ✓ (82% budget utilization)

### task-28: Team retrospective lunch
- **Budget:** $120.00
- **Created:** Oct 25, 2025
- **Due:** Nov 2, 2025
- **Receipt Date:** Oct 28 ✓ (within work period)
- **Receipt Amount:** $100.74 ✓ (84% budget utilization)

### task-29: Renew GitHub Enterprise licenses
- **Budget:** $2,100.00
- **Created:** Oct 30, 2025
- **Due:** Nov 8, 2025
- **Receipt Date:** Nov 1 ✓ (within work period)
- **Receipt Amount:** $2,098.75 ✓ (99.9% budget utilization - very high!)

### task-30: Register for DevOps conference
- **Budget:** $850.00
- **Created:** Oct 28, 2025
- **Due:** Nov 10, 2025
- **Receipt Date:** Nov 2 ✓ (within work period)
- **Receipt Amount:** $847.69 ✓ (99.7% budget utilization - very high!)

## How to Use for Demo

### Option 1: Text Screenshots
1. Open each `.txt` file
2. Take a screenshot (make it look like a receipt photo)
3. Upload to Demo 2 frontend

### Option 2: Convert to Images
```bash
# macOS: Use TextEdit → Print → Save as PDF → Export as PNG
# Or use ImageMagick:
convert -density 150 -background white -fill black \
  -pointsize 12 -font "Courier-New" \
  label:@1-aws-receipt.txt 1-aws-receipt.png
```

### Option 3: Use as-is
The tool calling demo can handle text files directly since Claude can parse plain text.

## Expected Demo Flow

When uploading `1-aws-receipt.txt`:

```
🤖 AI Reasoning Process    ● LIVE

Progress Log:
14:32:15.123  ✅ Receipt parsed successfully
14:32:15.456  🤔 Claude is analyzing the receipt...
14:32:16.789  🔧 Tool: search_tasks_semantic
14:32:17.234  ✓ search_tasks_semantic completed
14:32:17.567  🔧 Tool: filter_by_date_range
14:32:18.012  ✓ filter_by_date_range completed
14:32:18.345  🔧 Tool: rank_by_budget_match
14:32:19.123  ✓ rank_by_budget_match completed
14:32:19.456  🎯 Match found: Setup AWS cloud infrastructure (92% confidence)

🔧 Tools Called:

search_tasks_semantic
Input: {"query": "AWS cloud infrastructure compute storage", "limit": 10}
Result: Found 3 tasks
✓ Complete

filter_by_date_range
Input: {"taskIds": ["task-26", "task-18", "task-9"], "receiptDate": "2025-10-25"}
Result: 1 task matches (Oct 25 within Oct 20 - Nov 1)
✓ Complete

rank_by_budget_match
Input: {"taskIds": ["task-26"], "receiptAmount": 127.43}
Result: $127.43 of $150.00 (85% utilization)
✓ Complete

🧠 Claude's Reasoning:
"I need to find tasks related to AWS and cloud infrastructure.
The receipt shows AWS services totaling $127.43...
[reasoning continues]"

🎯 Matched Task:
Setup AWS cloud infrastructure
92% Confidence

Task ID: task-26
Assigned to: Mike
Budget: $150.00
Receipt Amount: $127.43
Task Period: Oct 20, 2025 - Nov 1, 2025

Match Reasons:
✓ Semantic match: Receipt matches task "Setup AWS cloud infrastructure"
✓ Budget fit: $127.43 of $150.00 (85% utilization)
✓ Date match: Receipt date falls within task work period
```

## Testing Checklist

- [ ] AWS receipt → matches task-26
- [ ] Office supplies → matches task-27
- [ ] Team lunch → matches task-28
- [ ] GitHub license → matches task-29
- [ ] Conference → matches task-30
- [ ] All tool calls execute successfully
- [ ] SSE stream shows progress in real-time
- [ ] Confidence scores are high (>80%)
- [ ] Match reasons are accurate

## Notes

- All receipts have amounts UNDER their respective task budgets
- All receipts have dates WITHIN their task work periods (createdAt → dueDate)
- Merchant names semantically match task descriptions
- Categories align with task types (office, food, software, travel)
