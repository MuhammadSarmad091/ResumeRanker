"""Generate sample job description PDFs for testing."""

from pathlib import Path

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib import colors
except ImportError:
    import subprocess

    subprocess.check_call(["pip", "install", "reportlab"])
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib import colors


def create_jd_pdf(filename: str, title: str, body_lines: list[str]) -> None:
    doc = SimpleDocTemplate(filename, pagesize=letter, topMargin=0.6 * inch)
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle(
        "JdTitle",
        parent=styles["Heading1"],
        fontSize=16,
        textColor=colors.HexColor("#1f4788"),
        spaceAfter=10,
    )

    text_style = ParagraphStyle(
        "JdText",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        spaceAfter=6,
    )

    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 0.12 * inch))

    for line in body_lines:
        story.append(Paragraph(line, text_style))

    doc.build(story)
    print(f"Created: {filename}")


def main() -> None:
    out_dir = Path("data/sample_jobs")
    out_dir.mkdir(parents=True, exist_ok=True)

    create_jd_pdf(
        str(out_dir / "jd_python_backend_engineer.pdf"),
        "Senior Python Backend Engineer",
        [
            "We are hiring a Senior Python Backend Engineer to build robust APIs and data workflows.",
            "Required Skills: Python, Flask or Django, PostgreSQL, REST APIs, Docker, Git.",
            "Preferred Skills: AWS, CI/CD, automated testing, monitoring and observability.",
            "Experience: 4+ years in backend systems with production ownership.",
            "Education: Bachelor's degree in Computer Science or equivalent experience.",
            "Responsibilities: design endpoints, optimize performance, review code, and mentor junior developers.",
        ],
    )

    create_jd_pdf(
        str(out_dir / "jd_ml_engineer.pdf"),
        "Machine Learning Engineer",
        [
            "We are looking for an ML Engineer to productionize machine learning models.",
            "Required Skills: Python, scikit-learn, pandas, SQL, API integration, model deployment.",
            "Preferred Skills: PyTorch or TensorFlow, Docker, Kubernetes, cloud services.",
            "Experience: 3+ years with applied machine learning and data pipelines.",
            "Education: Bachelor's or Master's in Computer Science, Data Science, or related field.",
            "Responsibilities: feature engineering, model training, evaluation, deployment, and lifecycle monitoring.",
        ],
    )


if __name__ == "__main__":
    main()
