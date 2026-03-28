"""
Generates 6 realistic test documents for After Me simulator testing.
Each document covers a different category: identity, legal, finance, medical, insurance, personal.
"""

from fpdf import FPDF
from fpdf.enums import XPos, YPos
import os

OUT = os.path.dirname(os.path.abspath(__file__))

AMBER  = (201, 150, 58)
DARK   = (30, 34, 47)
MID    = (60, 66, 90)
LIGHT  = (240, 242, 248)
WHITE  = (255, 255, 255)
GREEN  = (46, 160, 67)
RED    = (180, 50, 50)
BLUE   = (40, 90, 160)

# ── helpers ──────────────────────────────────────────────────────────────────

def new_doc() -> FPDF:
    pdf = FPDF()
    pdf.set_margins(20, 20, 20)
    pdf.add_page()
    return pdf

def header_bar(pdf: FPDF, title: str, subtitle: str, color=DARK):
    pdf.set_fill_color(*color)
    pdf.rect(0, 0, 210, 38, "F")
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_xy(20, 8)
    pdf.cell(0, 10, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(20)
    pdf.cell(0, 6, subtitle)
    pdf.set_text_color(*DARK)
    pdf.set_xy(20, 45)

def field(pdf: FPDF, label: str, value: str, label_w=55):
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(100, 100, 110)
    pdf.cell(label_w, 7, label.upper())
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 7, value, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

def divider(pdf: FPDF):
    pdf.set_draw_color(210, 212, 220)
    pdf.line(20, pdf.get_y() + 2, 190, pdf.get_y() + 2)
    pdf.ln(6)

def section_title(pdf: FPDF, text: str):
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*AMBER)
    pdf.cell(0, 8, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    divider(pdf)

def watermark(pdf: FPDF, text: str):
    pdf.set_font("Helvetica", "B", 48)
    pdf.set_text_color(220, 222, 228)
    pdf.set_xy(30, 120)
    pdf.cell(0, 20, text)
    pdf.set_text_color(*DARK)

def footer_stamp(pdf: FPDF, issuer: str, ref: str):
    pdf.set_xy(20, 265)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(140, 140, 150)
    pdf.cell(0, 5, f"Issued by: {issuer}   |   Reference: {ref}   |   This is a specimen document for testing purposes only.")

# ── 1. PASSPORT (Identity) ────────────────────────────────────────────────────

def doc_passport():
    pdf = new_doc()
    header_bar(pdf, "PASSPORT", "United Kingdom of Great Britain and Northern Ireland", BLUE)

    pdf.set_fill_color(*LIGHT)
    pdf.rect(20, 48, 170, 60, "F")
    pdf.set_xy(25, 52)

    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 9, "JAMES WILLIAM HARTLEY", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(25)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(80, 80, 100)
    pdf.cell(0, 6, "Surname: HARTLEY   |   Given Names: JAMES WILLIAM", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_xy(25, 70)
    field(pdf, "Nationality", "British Citizen")
    field(pdf, "Date of Birth", "14 March 1978")
    field(pdf, "Place of Birth", "Manchester, England")
    field(pdf, "Sex", "M")
    field(pdf, "Date of Issue", "02 September 2019")
    field(pdf, "Date of Expiry", "01 September 2029")
    field(pdf, "Passport No.", "GBR-294-881-042-7")

    section_title(pdf, "MACHINE READABLE ZONE")
    pdf.set_font("Courier", "", 10)
    pdf.set_text_color(40, 40, 40)
    pdf.cell(0, 7, "P<GBRHARTLEY<<JAMES<WILLIAM<<<<<<<<<<<<<<<<<", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 7, "GBR294881042<<7803144M2909015GBR<<<<<<<<<<6")

    watermark(pdf, "SPECIMEN")
    footer_stamp(pdf, "HM Passport Office", "GBR-294-881-042-7")
    pdf.output(os.path.join(OUT, "01_passport_james_hartley.pdf"))
    print("✓  01_passport_james_hartley.pdf")


# ── 2. LAST WILL & TESTAMENT (Legal) ─────────────────────────────────────────

def doc_will():
    pdf = new_doc()
    header_bar(pdf, "LAST WILL & TESTAMENT", "Legally Witnessed Document", (80, 40, 40))

    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 9, "THE LAST WILL AND TESTAMENT OF", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*AMBER)
    pdf.cell(0, 10, "JAMES WILLIAM HARTLEY", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_text_color(*DARK)
    divider(pdf)

    pdf.set_font("Helvetica", "", 11)
    paras = [
        ("I, James William Hartley, of 14 Elmwood Crescent, Manchester, M14 5GH, being of sound "
         "mind and memory, hereby revoke all former wills and testamentary dispositions made by me "
         "and declare this to be my Last Will and Testament."),

        ("APPOINTMENT OF EXECUTOR: I appoint my spouse, Margaret Anne Hartley, as sole Executor "
         "of this Will. Should she be unable or unwilling to act, I appoint my son Thomas Edward "
         "Hartley as substitute Executor."),

        ("RESIDUARY ESTATE: I give, bequeath, and devise all my real and personal property, "
         "wheresoever situated, to my spouse Margaret Anne Hartley absolutely. Should my spouse "
         "predecease me, I direct that my estate be divided equally between my children."),

        ("DIGITAL ASSETS: I direct my Executor to access my After Me digital vault using the "
         "Family Kit provided, and to distribute digital documents as described therein."),

        ("IN WITNESS WHEREOF I have hereunto set my hand this 5th day of January 2024."),
    ]
    for p in paras:
        pdf.multi_cell(0, 7, p)
        pdf.ln(4)

    section_title(pdf, "SIGNATURES")
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(85, 7, "Testator Signature: __________________")
    pdf.cell(0, 7, "Date: _____________________", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(8)
    pdf.cell(85, 7, "Witness 1: __________________")
    pdf.cell(0, 7, "Witness 2: __________________", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    watermark(pdf, "SPECIMEN")
    footer_stamp(pdf, "Hartley & Moore Solicitors LLP", "HM/WILL/2024/00472")
    pdf.output(os.path.join(OUT, "02_last_will_testament.pdf"))
    print("✓  02_last_will_testament.pdf")


# ── 3. BANK STATEMENT (Finance) ───────────────────────────────────────────────

def doc_bank_statement():
    pdf = new_doc()
    header_bar(pdf, "BANK STATEMENT", "Personal Current Account - October 2024", GREEN)

    field(pdf, "Account Holder", "James William Hartley")
    field(pdf, "Account Number", "xxxx xxxx 4421")
    field(pdf, "Sort Code", "20-14-57")
    field(pdf, "Statement Period", "01 Oct 2024 - 31 Oct 2024")
    field(pdf, "Opening Balance", "£ 8,241.16")
    field(pdf, "Closing Balance", "£ 7,619.43")
    divider(pdf)

    section_title(pdf, "TRANSACTIONS")
    # Table header
    pdf.set_fill_color(*MID)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(28, 8, "Date", fill=True)
    pdf.cell(82, 8, "Description", fill=True)
    pdf.cell(28, 8, "Debit (£)", fill=True, align="R")
    pdf.cell(28, 8, "Credit (£)", fill=True, align="R")
    pdf.cell(0, 8, "Balance (£)", fill=True, align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    rows = [
        ("01 Oct", "Opening Balance",           "",          "",        "8,241.16"),
        ("03 Oct", "TESCO STORES 3142",          "67.22",     "",        "8,173.94"),
        ("05 Oct", "DIRECT DEBIT - BRITISH GAS", "142.00",    "",        "8,031.94"),
        ("07 Oct", "SALARY - HARTLEY DESIGNS",   "",          "3,500.00","11,531.94"),
        ("10 Oct", "AMAZON MARKETPLACE",         "89.99",     "",        "11,441.95"),
        ("12 Oct", "COUNCIL TAX OCT",            "172.00",    "",        "11,269.95"),
        ("15 Oct", "NETFLIX SUBSCRIPTION",       "17.99",     "",        "11,251.96"),
        ("18 Oct", "ATM WITHDRAWAL",             "200.00",    "",        "11,051.96"),
        ("20 Oct", "NATIONWIDE MTG PMNT",        "1,204.00",  "",        "9,847.96"),
        ("22 Oct", "SAINSBURYS SUPERSTORE",      "124.37",    "",        "9,723.59"),
        ("25 Oct", "BT INTERNET DD",             "54.99",     "",        "9,668.60"),
        ("28 Oct", "WATER PLUS DD",              "49.17",     "",        "9,619.43"),
        ("31 Oct", "INTEREST CREDIT",            "",          "0.00",    "9,619.43"),
        ("31 Oct", "CHARGES",                    "2,000.00",  "",        "7,619.43"),
    ]
    pdf.set_font("Helvetica", "", 9)
    for i, (date, desc, debit, credit, bal) in enumerate(rows):
        fill = i % 2 == 0
        pdf.set_fill_color(248, 249, 252) if fill else pdf.set_fill_color(*WHITE)
        pdf.set_text_color(*DARK)
        pdf.cell(28, 7, date, fill=fill)
        pdf.cell(82, 7, desc, fill=fill)
        pdf.set_text_color(*RED if debit else DARK)
        pdf.cell(28, 7, debit, fill=fill, align="R")
        pdf.set_text_color(*GREEN if credit else DARK)
        pdf.cell(28, 7, credit, fill=fill, align="R")
        pdf.set_text_color(*DARK)
        pdf.cell(0, 7, bal, fill=fill, align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    watermark(pdf, "SPECIMEN")
    footer_stamp(pdf, "Barclays Bank UK PLC", "STM/OCT2024/JWHART")
    pdf.output(os.path.join(OUT, "03_bank_statement_oct2024.pdf"))
    print("✓  03_bank_statement_oct2024.pdf")


# ── 4. MEDICAL RECORD SUMMARY (Medical) ───────────────────────────────────────

def doc_medical():
    pdf = new_doc()
    header_bar(pdf, "MEDICAL RECORD SUMMARY", "Confidential Patient Record", (60, 120, 100))

    field(pdf, "Patient Name",   "James William Hartley")
    field(pdf, "NHS Number",     "485 777 3321")
    field(pdf, "Date of Birth",  "14 March 1978  (Age 46)")
    field(pdf, "GP Practice",    "Fallowfield Medical Centre, Manchester")
    field(pdf, "GP",             "Dr. Priya Nair  |  GMC: 7441023")
    field(pdf, "Blood Group",    "O Positive (O+)")
    divider(pdf)

    section_title(pdf, "CURRENT MEDICATIONS")
    meds = [
        ("Atorvastatin 20mg",     "Once daily at night",        "Cholesterol management"),
        ("Lisinopril 10mg",       "Once daily in the morning",  "Hypertension"),
        ("Aspirin 75mg",          "Once daily with food",       "Cardiovascular prophylaxis"),
    ]
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(100, 100, 110)
    pdf.cell(55, 7, "MEDICATION"); pdf.cell(55, 7, "DOSE"); pdf.cell(0, 7, "INDICATION", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*DARK)
    for med, dose, ind in meds:
        pdf.cell(55, 7, med); pdf.cell(55, 7, dose); pdf.cell(0, 7, ind, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    section_title(pdf, "SIGNIFICANT MEDICAL HISTORY")
    conditions = [
        ("2019", "Hypertension",              "Managed with medication. Annual review."),
        ("2021", "Hypercholesterolaemia",      "Diet-controlled and statin therapy."),
        ("2022", "Appendectomy",               "Uncomplicated laparoscopic procedure."),
    ]
    for yr, cond, note in conditions:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(18, 7, yr)
        pdf.cell(60, 7, cond)
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, note, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    section_title(pdf, "ALLERGIES & ALERTS")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*RED)
    pdf.cell(0, 7, "[!]  Penicillin - severe allergic reaction (anaphylaxis)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 7, "No known food or latex allergies.")

    watermark(pdf, "CONFIDENTIAL")
    footer_stamp(pdf, "Fallowfield Medical Centre, NHS Greater Manchester", "FMC/2024/JWH-485777")
    pdf.output(os.path.join(OUT, "04_medical_record_summary.pdf"))
    print("✓  04_medical_record_summary.pdf")


# ── 5. LIFE INSURANCE POLICY (Insurance) ─────────────────────────────────────

def doc_insurance():
    pdf = new_doc()
    header_bar(pdf, "LIFE INSURANCE POLICY", "Policy Schedule - Level Term Assurance", (40, 60, 120))

    field(pdf, "Policyholder",     "James William Hartley")
    field(pdf, "Policy Number",    "LTA-2019-00447821")
    field(pdf, "Policy Type",      "Level Term Life Assurance")
    field(pdf, "Start Date",       "01 February 2019")
    field(pdf, "End Date",         "01 February 2044  (25-year term)")
    field(pdf, "Sum Assured",      "£ 450,000")
    field(pdf, "Monthly Premium",  "£ 38.74  (paid by Direct Debit)")
    divider(pdf)

    section_title(pdf, "BENEFICIARIES")
    pdf.set_font("Helvetica", "", 10)
    bens = [
        ("Margaret Anne Hartley", "Spouse",  "60%"),
        ("Thomas Edward Hartley", "Child",   "20%"),
        ("Emily Rose Hartley",    "Child",   "20%"),
    ]
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(100, 100, 110)
    pdf.cell(70, 7, "NAME"); pdf.cell(40, 7, "RELATIONSHIP"); pdf.cell(0, 7, "SHARE", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*DARK)
    for name, rel, share in bens:
        pdf.cell(70, 7, name); pdf.cell(40, 7, rel); pdf.cell(0, 7, share, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    section_title(pdf, "KEY POLICY CONDITIONS")
    conditions = [
        "Cover is valid for death from any cause after the 12-month exclusion period.",
        "Suicide is excluded during the first 12 months of the policy.",
        "Policy is written in trust for the benefit of named beneficiaries.",
        "To claim: contact Aviva Claims on 0800 015 1142. Policy number required.",
        "The policy document and original trust deed are held by Hartley & Moore Solicitors.",
    ]
    pdf.set_font("Helvetica", "", 10)
    for c in conditions:
        pdf.set_x(20)
        pdf.multi_cell(0, 7, "* " + c)

    watermark(pdf, "SPECIMEN")
    footer_stamp(pdf, "Aviva Insurance Limited - Authorised by PRA & regulated by FCA", "LTA-2019-00447821")
    pdf.output(os.path.join(OUT, "05_life_insurance_policy.pdf"))
    print("✓  05_life_insurance_policy.pdf")


# ── 6. PROPERTY DEED / TITLE REGISTER (Personal Property) ────────────────────

def doc_property():
    pdf = new_doc()
    header_bar(pdf, "OFFICIAL COPY - TITLE REGISTER", "HM Land Registry  |  England and Wales", (80, 80, 80))

    field(pdf, "Title Number",    "GM 824417")
    field(pdf, "Edition Date",    "15 August 2018")
    field(pdf, "Property",        "14 Elmwood Crescent, Manchester, M14 5GH")
    field(pdf, "Tenure",          "Freehold")
    divider(pdf)

    section_title(pdf, "A: PROPERTY REGISTER")
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 7,
        "The Freehold land shown edged with red on the plan of the above Title filed at the "
        "Registry and being 14 Elmwood Crescent, Manchester (M14 5GH). The property has the "
        "benefit of a right of way over the access road shown on title plan GM824417."
    )

    section_title(pdf, "B: PROPRIETORSHIP REGISTER")
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 7,
        "Title Absolute. Registered on 20 September 2018.\n"
        "PROPRIETORS: James William Hartley and Margaret Anne Hartley of "
        "14 Elmwood Crescent, Manchester, M14 5GH.\n"
        "Price stated to have been paid on 15 August 2018: £324,000."
    )

    section_title(pdf, "C: CHARGES REGISTER")
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 7,
        "Registered Charge dated 17 September 2018 in favour of Nationwide Building Society "
        "(registered number 00725875) to secure the moneys including the further advances "
        "therein mentioned. Amount: £243,000."
    )

    section_title(pdf, "END OF REGISTER")
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(120, 120, 130)
    pdf.multi_cell(0, 6,
        "This is an official copy of the register of the title number set out above, showing "
        "the entries in the register on 12 November 2024 at 09:41:04. This official copy is "
        "admissible in evidence to the same extent as the original."
    )

    watermark(pdf, "OFFICIAL COPY")
    footer_stamp(pdf, "HM Land Registry", "GM824417/OC/2024-11-12")
    pdf.output(os.path.join(OUT, "06_property_title_register.pdf"))
    print("✓  06_property_title_register.pdf")


# ── run all ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Generating After Me test documents...\n")
    doc_passport()
    doc_will()
    doc_bank_statement()
    doc_medical()
    doc_insurance()
    doc_property()
    print("\nAll 6 documents written to:", OUT)
