"""Generate sample resume PDFs for testing"""

import os
from pathlib import Path
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
except ImportError:
    print("reportlab not installed. Installing...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'reportlab'])
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors


def create_resume_pdf(filename, name, email, phone, experience_years, skills, education):
    """Create a sample resume PDF"""
    
    doc = SimpleDocTemplate(filename, pagesize=letter, topMargin=0.5*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        textColor=colors.HexColor('#1f4788'),
        spaceAfter=6,
        alignment=0
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=11,
        textColor=colors.HexColor('#1f4788'),
        spaceAfter=6,
        spaceBefore=8,
        borderBottomColor=colors.HexColor('#1f4788'),
        borderBottomWidth=1,
    )
    
    normal_style = styles['Normal']
    normal_style.fontSize = 9
    
    # Header with contact info
    header_data = [
        [Paragraph(f"<b>{name}</b>", title_style)],
        [Paragraph(f"Email: {email} | Phone: {phone}", normal_style)],
    ]
    
    header_table = Table(header_data, colWidths=[7*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    
    story.append(header_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Professional Summary
    story.append(Paragraph("<b>PROFESSIONAL SUMMARY</b>", heading_style))
    story.append(Paragraph(
        f"Experienced professional with {experience_years} years of proven expertise in development and technical roles. "
        f"Strong background in various technologies and methodologies.",
        normal_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    # Skills
    story.append(Paragraph("<b>SKILLS</b>", heading_style))
    skills_text = ", ".join(skills)
    story.append(Paragraph(skills_text, normal_style))
    story.append(Spacer(1, 0.15*inch))
    
    # Experience
    story.append(Paragraph("<b>PROFESSIONAL EXPERIENCE</b>", heading_style))
    
    # Create experience entries
    exp_per_job = experience_years // 2 if experience_years > 0 else 0
    remaining = experience_years % 2
    
    companies = [
        ("Senior Developer", "Tech Solutions Inc.", f"{exp_per_job + remaining} years"),
        ("Software Engineer", "Digital Innovations Ltd.", f"{exp_per_job} years"),
    ]
    
    for i, (title, company, duration) in enumerate(companies[:2]):
        if experience_years > 0 or i == 0:
            story.append(Paragraph(f"<b>{title}</b> - {company} ({duration})", normal_style))
            story.append(Paragraph(
                f"• Developed and maintained applications\n"
                f"• Collaborated with cross-functional teams\n"
                f"• Improved system performance and reliability",
                normal_style
            ))
            story.append(Spacer(1, 0.1*inch))
    
    # Education
    story.append(Paragraph("<b>EDUCATION</b>", heading_style))
    for edu in education:
        story.append(Paragraph(f"• {edu}", normal_style))
    
    story.append(Spacer(1, 0.15*inch))
    
    # Certifications
    story.append(Paragraph("<b>CERTIFICATIONS</b>", heading_style))
    story.append(Paragraph("• Professional Certification in Software Development", normal_style))
    story.append(Paragraph("• Advanced Technical Skills Certification", normal_style))
    
    # Build PDF
    doc.build(story)
    print(f"✓ Created {filename}")


def main():
    """Generate all sample resumes"""
    
    # Create data directory
    data_dir = Path("data/sample_resumes")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # Resume 1: Excellent Match
    create_resume_pdf(
        str(data_dir / "resume_1_excellent.pdf"),
        name="Alice Johnson",
        email="alice.johnson@email.com",
        phone="+1-555-0101",
        experience_years=6,
        skills=[
            "Python", "Django", "PostgreSQL", "REST APIs", 
            "AWS", "Docker", "Git", "Machine Learning",
            "SQL", "JavaScript"
        ],
        education=[
            "Bachelor of Science in Computer Science (2018)",
            "Master of Science in Data Science (2020)"
        ]
    )
    
    # Resume 2: Good Match
    create_resume_pdf(
        str(data_dir / "resume_2_good.pdf"),
        name="Bob Smith",
        email="bob.smith@email.com",
        phone="+1-555-0102",
        experience_years=4,
        skills=[
            "Python", "Flask", "MySQL", "HTML", "CSS",
            "JavaScript", "Linux", "Git", "Agile",
            "API Development", "Testing"
        ],
        education=[
            "Bachelor of Science in Information Technology (2019)"
        ]
    )
    
    # Resume 3: Partial Match
    create_resume_pdf(
        str(data_dir / "resume_3_partial.pdf"),
        name="Carol Williams",
        email="carol.williams@email.com",
        phone="+1-555-0103",
        experience_years=2,
        skills=[
            "Java", "Spring Boot", "Oracle", "C++",
            "Python", "Git", "Windows", "Databases",
            "Object-Oriented Programming"
        ],
        education=[
            "Bachelor of Science in Computer Engineering (2021)"
        ]
    )
    
    print("\n✓ All sample resumes created successfully!")
    print(f"✓ Location: {data_dir.absolute()}")


if __name__ == "__main__":
    main()
