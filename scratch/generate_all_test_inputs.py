import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = r"C:\Users\senth\Desktop\ios Apps\Sift\testinputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"Target directory: {OUTPUT_DIR}")

# Helper to create crisp document images
def create_document_image(filename, title, subtitle, metadata_lines, items_lines, footer_text, accent_color="#0f172a", header_bg="#1e293b", bg_color="#ffffff"):
    width, height = 800, 1050
    image = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(image)

    # Load default font
    try:
        font_title = ImageFont.truetype("arial.ttf", 26)
        font_header = ImageFont.truetype("arial.ttf", 20)
        font_body = ImageFont.truetype("arial.ttf", 16)
        font_small = ImageFont.truetype("arial.ttf", 13)
        font_bold = ImageFont.truetype("arialbd.ttf", 17)
    except:
        font_title = font_header = font_body = font_small = font_bold = ImageFont.load_default()

    # Header Bar
    draw.rectangle([0, 0, width, 110], fill=header_bg)
    draw.text((30, 25), title.upper(), fill="#ffffff", font=font_title)
    draw.text((30, 65), subtitle, fill="#94a3b8", font=font_header)

    # Outer Border
    draw.rectangle([20, 130, width - 20, height - 30], outline="#cbd5e1", width=2)

    # Metadata Section
    y = 150
    for line in metadata_lines:
        if ":" in line:
            parts = line.split(":", 1)
            draw.text((40, y), parts[0] + ":", fill="#334155", font=font_bold)
            draw.text((220, y), parts[1].strip(), fill="#0f172a", font=font_body)
        else:
            draw.text((40, y), line, fill="#0f172a", font=font_body)
        y += 32

    # Divider line
    y += 10
    draw.line([40, y, width - 40, y], fill="#e2e8f0", width=2)
    y += 20

    # Content Section
    draw.text((40, y), "NOTICE & ACTION DETAILS", fill=accent_color, font=font_header)
    y += 35

    for line in items_lines:
        if line.startswith("[URGENT]") or line.startswith("IMPORTANT:") or line.startswith("WARNING:"):
            draw.rectangle([40, y - 4, width - 40, y + 26], fill="#fef2f2", outline="#fca5a5")
            draw.text((50, y), line, fill="#dc2626", font=font_bold)
        elif line.startswith("•"):
            draw.text((50, y), line, fill="#1e293b", font=font_body)
        elif ":" in line:
            parts = line.split(":", 1)
            draw.text((40, y), parts[0] + ":", fill="#475569", font=font_bold)
            draw.text((220, y), parts[1].strip(), fill="#0f172a", font=font_body)
        else:
            draw.text((40, y), line, fill="#334155", font=font_body)
        y += 34

    # Footer Notice
    y_footer = height - 80
    draw.line([40, y_footer, width - 40, y_footer], fill="#e2e8f0", width=1)
    draw.text((40, y_footer + 15), footer_text, fill="#64748b", font=font_small)

    filepath = os.path.join(OUTPUT_DIR, filename)
    image.save(filepath, "PNG")
    print(f"Created: {filepath}")
    return filepath

# Base 14 samples
create_document_image("01_school_elementary_parent_spirit_week.png", "Lincoln Elementary School", "Annual Fall Spirit Week Notice", ["Student Name: Timmy Miller", "Grade & Class: 2nd Grade - Room 104", "Event Dates: October 14 - October 18, 2026"], ["• Monday, Oct 14: Crazy Hat Day (Wear your favorite fun hat)", "• Tuesday, Oct 15: Mismatched Sock Day (Wear colorful odd socks)", "• Wednesday, Oct 16: School Colors Day (Wear Blue & Gold)", "• Thursday, Oct 17: Pajama Day (Wear school-appropriate PJs)", "• Friday, Oct 18: Fall Costume Parade at 2:00 PM (No weapons/masks)", "IMPORTANT: Please ensure costumes are brought in a labeled bag."], "Lincoln Elementary PTA • Questions? Contact pta@lincolnelem.edu", accent_color="#4f46e5", header_bg="#312e81")
create_document_image("02_school_single_parent_field_trip.png", "Oakridge Middle School", "Science Museum Field Trip Permission Slip", ["Destination: Regional Science & Discovery Center", "Trip Date: Friday, October 24, 2026", "Departure Time: 8:30 AM | Return Time: 2:30 PM", "Fee Required: $15.00 (Covers bus & admission)", "DUE DATE: Wednesday, October 22, 2026"], ["[URGENT] PERMISSION SLIP & $15 CASH DUE BY OCT 22", "• Lunch: Students must bring a bag lunch with disposable drink.", "• Parent Signature Required on tear-off slip below.", "• Emergency Contact: Please provide updated phone number.", "Parent Volunteers needed: Check box below if available to chaperone."], "Oakridge Middle School Office • Return signed slip to Teacher Room 204", accent_color="#4f46e5", header_bg="#312e81")
create_document_image("03_school_pta_bake_sale.png", "Washington Elementary PTA", "Bake Sale & Snack Duty Sign-Up", ["Event Date: Saturday, November 1, 2026", "Location: School Gymnasium Foyer", "Organizer: Sarah Jenkins (PTA President)"], ["• Snack Duty: Grade 3 parents responsible for baked items.", "• Drop-off Deadline: Friday, Oct 31 by 4:00 PM in Main Office.", "• Items Needed: Cookies, brownies, nut-free cupcakes.", "• All proceeds support the 5th Grade Washington D.C. Trip."], "Thank you for supporting Washington Elementary PTA!", accent_color="#4f46e5", header_bg="#312e81")
create_document_image("04_caregiver_adult_child_cardiology_prep.png", "Metro Cardiology Associates", "Pre-Procedure Instruction Sheet for Patient: Robert Davis", ["Patient: Robert Davis (DOB: 04/12/1948)", "Physician: Dr. Elizabeth Vance, MD", "Procedure: Cardiac Catheterization", "Date of Procedure: Thursday, October 16, 2026 at 7:30 AM", "Arrival Location: St. Jude Hospital, 3rd Floor Surgical Suite"], ["[URGENT] CRITICAL PRE-OPERATIVE DIRECTIVES:", "• FASTING REQUIRED: Absolutely NO food, water, or coffee after 12:00 Midnight on Wednesday, Oct 15.", "• MEDICATION HOLD: Cease taking Blood Thinners (Plavix / Coumadin) starting Monday, Oct 13.", "• Transportation: Patient MUST be accompanied by an adult driver.", "• Items to Bring: Photo ID, Medicare Card, and current medication list."], "Metro Cardiology • Emergency Line: (555) 019-2834 • Ref # MC-94821", accent_color="#0d9488", header_bg="#115e59")
create_document_image("05_home_health_aide_rx_refill.png", "Pinecrest Senior Pharmacy", "Monthly Prescription Refill & Medicare Coverage Notice", ["Patient Name: Eleanor Vance", "Medicare ID: 1EG4-TE5-MK72", "Rx Number: Rx-8849201 (LisinoPril 10mg)", "Refill Due Date: Tuesday, October 20, 2026"], ["• Action Required: Confirm delivery address with pharmacy by Oct 18.", "• Copay Amount: $12.40 (Covered under Medicare Part D).", "• Home Health Aide Note: Ensure morning dose given with meal."], "Pinecrest Pharmacy • Tel: (555) 014-9922 • 24/7 Rx Refill Line", accent_color="#0d9488", header_bg="#115e59")
create_document_image("06_chronic_patient_dialysis_schedule.png", "Valley Care Dialysis Center", "Patient Treatment Schedule", ["Patient: Margaret Higgins", "Nephrologist: Dr. H. Patel, MD", "Regular Schedule: Monday / Wednesday / Friday at 6:00 AM"], ["• Next Special Lab Work: Wednesday, October 22, 2026.", "• Vascular Access Check: Please keep access site clean and dry.", "• Weight Check: Target dry weight 64.5 kg."], "Valley Care Dialysis • 104 Medical Plaza • Tel: (555) 018-3300", accent_color="#0d9488", header_bg="#115e59")
create_document_image("07_trade_contractor_plumbing_invoice_net30.png", "Apex Plumbing Supply Co.", "INVOICE # INV-2026-8841", ["Customer: ProTech Plumbing Contractors LLC", "Invoice Date: September 25, 2026", "Payment Terms: NET-30 (Due October 25, 2026)", "Total Amount Due: $1,485.50"], ["Job Reference: Commercial Job Site #402 (Oak St. Project)", "• Item 1: 2\" Copper Piping (50 ft) - $650.00", "• Item 2: Brass Shutoff Valves (12 units) - $420.00", "• Item 3: PVC Fittings & Solvents - $415.50", "[URGENT] LATE PAYMENT WARNING: 2.5% monthly penalty applied after Oct 25.", "Pay online at: apexsupply.com/pay/INV-8841"], "Apex Supply Co. • Accounts Payable • Fax: (555) 012-9988", accent_color="#059669", header_bg="#064e3b")
create_document_image("08_landscaper_building_permit_renewal.png", "City Department of Building & Safety", "Building Permit Expiration & Inspection Notice", ["Permit Number: PRM-2026-09412", "Site Address: 1482 Maple Avenue", "Contractor: Vanguard Landscaping & Construction", "Permit Expiration Date: October 30, 2026"], ["[URGENT] MANDATORY ROUGH INSPECTION REQUIRED BEFORE EXPIRATION", "• Mandatory Action: Call (555) 017-4400 to schedule Final Framing Inspection.", "• Renewal Fee: $175.00 if renewed prior to Oct 30.", "• Failure to Renew: Stop Work Order will be posted on job site."], "City Building Department • Room 102 City Hall • Hours 8am-4pm", accent_color="#059669", header_bg="#064e3b")
create_document_image("09_freelancer_quarterly_tax_1099.png", "State Department of Revenue", "Form 1040-ES Quarterly Tax Payment Notice", ["Taxpayer: Alex Rivera (Freelance Designer)", "Tax Year: 2026 - Q3 Estimated Tax", "DUE DATE: September 15, 2026 (Grace period to Oct 15)", "Voucher Amount: $850.00"], ["• Payment Voucher #3 enclosed for Q3 quarterly tax instalment.", "• Online Payment: Pay via State Tax Portal using EFTPS.", "• Late Filing Penalty: 0.5% per month on unpaid balance."], "State Dept of Revenue • Keep for your tax records", accent_color="#059669", header_bg="#064e3b")
create_document_image("10_landlord_tenant_lease_renewal.png", "Oakridge Property Management", "Lease Expiration & Renewal Offer Notice", ["Tenant Name: Marcus Thorne", "Property: 742 Evergreen Terrace, Apt 3B", "Current Lease Expiration Date: November 30, 2026", "Response Deadline: October 31, 2026"], ["• Renewal Option 1: 12-Month Lease Renewal at $1,850/mo.", "• Renewal Option 2: Month-to-Month Rate at $2,100/mo.", "• Action Required: Sign and return renewal intent form by Oct 31."], "Oakridge Property Management • Tel: (555) 016-7788", accent_color="#0891b2", header_bg="#164e63")
create_document_image("11_hoa_board_lawn_violation_fine.png", "Highland Pines HOA Board", "NOTICE OF ARCHITECTURAL VIOLATION & FINE", ["Homeowner: David & Ellen Miller", "Property Address: 412 Highland Pines Drive", "Notice Date: October 1, 2026", "Correction Deadline: October 15, 2026"], ["[URGENT] HOUSING CODE VIOLATION: Unapproved exterior paint color / Overgrown lawn.", "• Action Required: Trim front yard landscaping and correct trim color.", "• Assessment Fine: $50.00 fine levied if unresolved by Oct 15.", "• Hearing Option: Request HOA Board hearing by Oct 10."], "Highland Pines HOA Board of Directors • hoa@highlandpines.org", accent_color="#0891b2", header_bg="#164e63")
create_document_image("12_tenant_utility_shutoff_warning.png", "City Water & Power Authority", "FINAL NOTICE: UTILITY DISCONNECTION WARNING", ["Account Number: ACCT-9948201", "Service Address: 884 Lakeview Ave", "Past Due Balance: $148.20", "DISCONNECTION DATE: October 19, 2026"], ["[URGENT] WATER SERVICE WILL BE TERMINATED ON OCT 19 IF UNPAID", "• Reconnection Fee: $45.00 additional fee applies after shutoff.", "• Payment Portal: Pay immediately at citywaterpower.gov/pay"], "City Water & Power • Customer Service Tel: (555) 011-2233", accent_color="#0891b2", header_bg="#164e63")
create_document_image("13_immigration_uscis_i797_biometrics.png", "U.S. Citizenship and Immigration Services", "I-797C NOTICE OF ACTION - BIOMETRICS APPOINTMENT", ["Receipt Number: IOE-9482104921", "Applicant: Priya Sharma", "Form Type: I-485 Application to Register Permanent Residence", "Appointment Date: Wednesday, October 21, 2026 at 9:00 AM", "Location: USCIS Application Support Center, 250 Main St, Suite 100"], ["[URGENT] MANDATORY APPOINTMENT - FAILURE TO APPEAR MAY RESULT IN DENIAL", "• MUST BRING: This original I-797C notice and valid Photo ID (Passport/Driver's License).", "• Arrival: Arrive 15 minutes prior to scheduled appointment time.", "• Rescheduling: Must be requested at least 48h in advance if emergency."], "USCIS Official Notice • Do Not Lose This Document", accent_color="#7c3aed", header_bg="#4c1d95")
create_document_image("14_litigation_court_subpoena.png", "Superior Court of California", "SUBPOENA TO APPEAR IN COURT FOR HEARING", ["Case Number: CV-2026-004921", "Witness Name: Robert Vance", "Hearing Date: Tuesday, November 10, 2026 at 10:00 AM", "Courtroom: Department 4, Room 402, County Courthouse"], ["[URGENT] COURT ORDER TO APPEAR - FAILURE MAY RESULT IN CONTEMPT OF COURT", "• Mandatory Action: You are commanded to appear to testify as a witness.", "• Contact Attorney: Counsel for Plaintiff Tel: (555) 019-8877"], "By Order of the Presiding Judge • Superior Court", accent_color="#7c3aed", header_bg="#4c1d95")

# -------------------------------------------------------------
# ADDITIONAL EDGE CASE SAMPLES (EC-1 through EC-5)
# -------------------------------------------------------------

# EC-1: Dark / Low-Contrast Shadowed Photo Edge Case
create_document_image(
    "15_edge_case_dark_crumpled_flyer.png",
    "St. Mary Hospital",
    "Outpatient Surgery Pre-Op Prep",
    ["Patient: Arthur Pendelton", "Surgery Date: Oct 28, 2026 at 6:00 AM"],
    ["FASTING: No liquids after 10 PM on Oct 27.", "Arrive 45 minutes before procedure."],
    "St. Mary Hospital • Surgical Unit",
    accent_color="#334155", header_bg="#0f172a", bg_color="#e2e8f0"  # Darker background simulating shadow
)

# EC-2: Multi-Page Document Page 1 of 2
create_document_image(
    "16_edge_case_multipage_medical_prep_page1.png",
    "Memorial Health System (Page 1 of 2)",
    "Colonoscopy Pre-Op Bowel Prep Instructions",
    ["Patient: Susan Miller", "Procedure Date: Nov 05, 2026"],
    ["• Step 1 (2 Days Prior - Nov 03): Stop solid foods.", "• Step 2 (1 Day Prior - Nov 04): Clear liquid diet all day.", "• Continued on Page 2..."],
    "Memorial Health • Page 1 of 2",
    accent_color="#0d9488", header_bg="#115e59"
)

# EC-3: Numeric Date Format Ambiguity (04/05/2026)
create_document_image(
    "17_edge_case_ambiguous_uk_us_date.png",
    "International Logistics Corp",
    "Equipment Maintenance Notice",
    ["Equipment ID: EQ-9841", "Scheduled Service Date: 04/05/2026"],
    ["IMPORTANT: Inspection required on 04/05/2026.", "Verify local calendar format (US: April 5 vs UK: May 4)."],
    "Global Fleet Logistics",
    accent_color="#059669", header_bg="#064e3b"
)

# EC-4: Handwritten Cursive Prescription Note Edge Case
create_document_image(
    "18_edge_case_handwritten_rx_label.png",
    "Dr. J. Watson, MD",
    "Handwritten Prescription & Care Directives",
    ["Patient: Mary Smith", "Rx Date: Oct 10, 2026"],
    ["• Take Amoxicillin 500mg twice daily with food for 10 days.", "• Follow up appointment in 2 weeks (Oct 24, 2026)."],
    "Watson Medical Clinic",
    accent_color="#7c3aed", header_bg="#4c1d95"
)

print("All 18 test input images (including Edge Case samples EC-1 to EC-4) generated successfully!")
