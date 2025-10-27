# Demo 2 - Live Coding Quick Reference

**Use this during presentation for quick copy/paste!**

---

## Live Coding Section 1: Tax Percentage (5 min)

### 🎯 Goal
Show that Claude can **compute derived fields**, not just extract data.

### 📝 Talking Points BEFORE Coding
"Right now our receipt shows $8.10 in tax, but what if we wanted to know the tax **percentage**? Let's add that to our schema and see if Claude can figure it out."

---

### Step 1: Update Zod Schema

**File**: `backend/src/schemas/receipt.schema.ts`
**Line**: 9

**Add this line** after `tax: z.number(),`:

```typescript
  taxPercentage: z.number().optional(), // AI will calculate tax percentage
```

**Full context (lines 4-12)**:
```typescript
export const ReceiptDataSchema = z.object({
  merchant: z.string(),
  date: z.string(), // ISO format YYYY-MM-DD
  subtotal: z.number().optional(),
  tax: z.number(),
  taxPercentage: z.number().optional(), // 👈 ADD THIS LINE
  total: z.number(),
  category: z.enum(['food', 'retail', 'office', 'travel', 'entertainment', 'other']),
  // ...
});
```

**💬 Say**: "I'm just adding the field to the schema - no calculation code yet!"

---

### Step 2: Add Calculation Logic (Optional - Or Let Claude Do It!)

**File**: `backend/src/services/vision.service.ts`
**Line**: ~206 (after items transformation)

**Add these lines**:

```typescript
      // Calculate tax percentage if we have tax and subtotal
      if (receipt.tax && receipt.subtotal) {
        receipt.taxPercentage = (receipt.tax / receipt.subtotal) * 100;
      }
```

**Full context (lines 198-210)**:
```typescript
      // Handle items - map 'name' to 'description' and 'amount' to 'price' if needed
      if (receipt.items && Array.isArray(receipt.items)) {
        receipt.items = receipt.items.map((item: any) => ({
          description: item.description || item.name,
          price: item.price ?? item.amount,
          quantity: item.quantity
        }));
      }

      // Calculate tax percentage if we have tax and subtotal
      if (receipt.tax && receipt.subtotal) {
        receipt.taxPercentage = (receipt.tax / receipt.subtotal) * 100;
      }
    }

    return response;
  }
```

**💬 Say**: "Now we calculate it ourselves in the transformation layer. This gives us control over the business logic."

**🎭 Alternative**: Skip this step and let Claude compute it! You can show it working without the calculation code, then add the code to show programmatic control.

---

### Step 3: Update Frontend Display

**File**: `frontend/src/app/components/upload/upload.component.html`
**Line**: ~124 (after the Tax row, before Total)

**Add this block**:

```html
            @if (result.receipt?.taxPercentage) {
              <div class="detail-row highlight">
                <span class="label">Tax %:</span>
                <span class="value">{{ result.receipt.taxPercentage.toFixed(2) }}%</span>
              </div>
            }
```

**Full context (lines 117-130)**:
```html
            <div class="detail-row">
              <span class="label">Tax:</span>
              <span class="value">${{ result.receipt!.tax.toFixed(2) }}</span>
            </div>
            @if (result.receipt?.taxPercentage) {
              <div class="detail-row highlight">
                <span class="label">Tax %:</span>
                <span class="value">{{ result.receipt.taxPercentage.toFixed(2) }}%</span>
              </div>
            }
            <div class="detail-row total">
              <span class="label">Total:</span>
              <span class="value">${{ result.receipt!.total.toFixed(2) }}</span>
            </div>
```

**💬 Say**: "I'm adding a highlighted row to show the tax percentage right below the tax amount."

---

### Step 4: Test It!

1. **Upload** the Chicken Fiesta receipt
2. **Show result**: Tax % should display **13.51%**
3. **Math check**: $8.10 / $59.95 * 100 = 13.51% ✅

**💬 Say**:
- "Look at that - Claude computed the percentage for us!"
- "This is the power of structured outputs - the LLM understands what we need"
- "We could let Claude do it entirely, OR add our own calculation for control"

---

## Live Coding Section 2: Business Rules (Optional - 3-5 min)

### 🎯 Goal
Show that **GenAI + Business Logic** creates robust systems.

### Option A: Tip Fraud Detection

**File**: `backend/src/services/vision.service.ts`
**Location**: Inside `transformResponse()`, after tax percentage calculation

```typescript
      // Fraud detection: Flag excessive tips
      if (receipt.tip && receipt.subtotal) {
        const tipPercentage = (receipt.tip / receipt.subtotal) * 100;

        if (tipPercentage > 25) {
          // Flag this receipt for review
          return {
            status: 'partial',
            receipt,
            missingFields: [],
            message: `⚠️ Unusual tip amount detected: ${tipPercentage.toFixed(1)}% tip`,
            suggestions: [
              'Please verify the tip amount is correct',
              'Check for duplicate charges',
              'Confirm this transaction with the merchant'
            ]
          };
        }
      }
```

**💬 Say**:
- "What if we want to catch expense fraud?"
- "Here's a simple rule: flag tips over 25%"
- "GenAI extracts the data, our business rules validate it"

**Test**: Manually edit a receipt JSON to have a $50 tip on a $100 meal → Should trigger warning

---

### Option B: Category Validation

**File**: `backend/src/services/vision.service.ts`
**Location**: After transformation logic

```typescript
      // Business rule: Validate category matches known merchants
      const knownMerchants: Record<string, string> = {
        'Chicken Fiesta': 'food',
        'Office Depot': 'office',
        'Anthropic': 'office',
        'Shell': 'travel'
      };

      if (receipt.merchant && receipt.merchant in knownMerchants) {
        const expectedCategory = knownMerchants[receipt.merchant];
        if (receipt.category !== expectedCategory) {
          console.warn(
            `⚠️ Category mismatch: Claude classified as "${receipt.category}" but expected "${expectedCategory}"`
          );
          // Could also return a partial status with suggestion
        }
      }
```

**💬 Say**:
- "We can validate Claude's categorization against known merchants"
- "This catches cases where Claude misclassifies"
- "Best of both worlds: AI flexibility + deterministic validation"

---

### Option C: Duplicate Detection (Talk Through - No Code)

**💬 Say**:
"Another common business rule is duplicate detection:
- Check if same merchant + amount + date already submitted
- Could use a database query or in-memory cache
- Return `status: 'not_a_receipt'` with message
- This prevents employees from submitting the same receipt twice
- **The AI extracts the data, our code enforces the policy**"

---

## 🎤 Closing Talking Points

### Key Messages
1. **Multimodal AI is powerful** - Handles any format, even handwriting
2. **Structured outputs are essential** - Zod schemas constrain the AI
3. **Simple wins most of the time** - Don't over-engineer with chains
4. **AI + Business Logic** - Combine intelligence with rules
5. **Production-ready patterns** - This is how you'd actually build it

### Transition to Next Demo
"In our next demo, we'll take this further: **personalized email generation with RAG**. We'll show how to pull dynamic context from a vector store to create hyper-personalized content. If you thought receipt parsing was cool, wait until you see AI-generated emails that actually sound human!"

---

## 🚨 Troubleshooting During Live Demo

### Backend not reloading after changes?
```bash
# Restart the dev server
# Ctrl+C, then:
npm run dev
```

### Frontend not showing new field?
```bash
# Hard refresh browser
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+R
```

### TypeScript errors in frontend?
The `taxPercentage` field is optional, so you must use `?.`:
```html
{{ result.receipt?.taxPercentage?.toFixed(2) }}
```

### Changes not appearing?
1. Save all files (Cmd+S / Ctrl+S)
2. Check dev server console for errors
3. Check browser console (F12) for errors

---

## 📋 Pre-Demo Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 4200
- [ ] Have 3-4 sample receipts ready (restaurant, PDF, handwritten)
- [ ] Pre-test handwritten receipt upload
- [ ] Have this QUICKSTART open for copy/paste
- [ ] Have backup screenshots if API fails
- [ ] Chicken Fiesta receipt ready for tax % demo
- [ ] Know the math: $8.10 / $59.95 = 13.51%
- [ ] Have browser dev tools (F12) open to show network calls (optional)

---

## ⏱️ Time Management

| Section | Time | Running Total |
|---------|------|---------------|
| Intro + BEFORE/AFTER | 2 min | 2 min |
| Upload 2-3 receipts | 5 min | 7 min |
| Handwritten receipt WOW | 3 min | 10 min |
| **Live Code: Tax %** | 5 min | 15 min |
| Business rules discussion | 3 min | 18 min |
| Simple vs Chain | 2 min | 20 min |
| **Buffer** | - | +3 min |

**Total**: 15-20 minutes

---

**Good luck with the demo! 🚀**
