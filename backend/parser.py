from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_resume(text):
    prompt = f"""
Extract the following fields from this resume:
name, email, phone, skills, experience, education, projects

Return ONLY valid JSON.

Resume:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    return json.loads(response.choices[0].message.content)


def parse_job_description(text):
    prompt = f"""
Extract structured information from this job description:
title, skills, experience, education, responsibilities

Return ONLY valid JSON.

Job Description:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    return json.loads(response.choices[0].message.content)