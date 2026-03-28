# After Me — Simulator Test Documents

Six realistic specimen PDFs covering every document category in the app.
All documents belong to the fictional person **James William Hartley** so they tell a coherent story in the vault.

---

## Documents

| # | File | App Category | Description |
|---|------|-------------|-------------|
| 1 | `01_passport_james_hartley.pdf` | **Identity** | UK passport with MRZ strip |
| 2 | `02_last_will_testament.pdf` | **Legal** | Last will & testament with executor named |
| 3 | `03_bank_statement_oct2024.pdf` | **Finance** | Barclays current account statement with transactions |
| 4 | `04_medical_record_summary.pdf` | **Medical** | NHS GP summary — medications, history, allergies |
| 5 | `05_life_insurance_policy.pdf` | **Insurance / Personal** | Aviva term life policy schedule with beneficiaries |
| 6 | `06_property_title_register.pdf` | **Personal / Property** | HM Land Registry official title copy |

---

## How to load onto the iOS Simulator

### Method 1 — Drag and Drop (quickest)

1. Open the **Simulator** and launch the **Files** app (swipe home → Files).
2. Navigate to **On My iPhone**.
3. Open a **Finder** window on your Mac and go to this folder:
   `ProjectDie/docs/test-documents/`
4. Drag all 6 PDF files from Finder **onto the Simulator** window.
   - Drop them directly onto the Files app. They will appear in **On My iPhone**.

### Method 2 — Xcode Devices (if drag-drop doesn't work)

1. In Xcode → **Window → Devices and Simulators**.
2. Select your booted simulator.
3. Under **Installed Apps**, find **After Me** and click the `+` gear button.
4. Add files — they land in the app's document sandbox (accessible via Files → After Me).

---

## How to add each document in the app

1. Open After Me on the simulator.
2. Tap the **Documents** tab.
3. Tap **+ Add Document**.
4. Choose **Pick from Files** (or camera icon for a photo scan).
5. Navigate to **On My iPhone** (or the After Me folder) and select a PDF.
6. Fill in the metadata — suggested values below.

| Document | Title | Category | Date |
|----------|-------|----------|------|
| 01_passport | Passport — James Hartley | Identity | 02/09/2019 |
| 02_will | Last Will & Testament | Legal | 05/01/2024 |
| 03_bank_statement | Barclays Statement Oct 2024 | Finance | 31/10/2024 |
| 04_medical_record | NHS Medical Summary | Medical | 12/11/2024 |
| 05_insurance_policy | Aviva Life Insurance | Personal | 01/02/2019 |
| 06_property_title | Property Title — 14 Elmwood Cres | Personal | 15/08/2018 |

---

## Regenerating

If you need to recreate the files (e.g. after clearing the simulator):

```bash
cd docs/test-documents
python3 generate_docs.py
```

Requires `fpdf2`: `pip3 install fpdf2`
