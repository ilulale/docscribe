#!/usr/bin/env python3
"""Transcribe/Translate medical audio using Gemini 1.5 Flash via OpenRouter."""

import argparse
import base64
import os
import sys
from datetime import datetime
from pathlib import Path

import requests

# Gemini 1.5 Flash is 10x cheaper and significantly smarter at
# ignoring silence/noise than Whisper.
MODEL = "google/gemini-3.1-flash-lite"
CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"


def load_env(path: str = ".env") -> None:
    env_file = Path(path)
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ[key.strip()] = val.strip().strip("\"'")
    # alias OPEN_ROUTER_API_KEY -> OPENROUTER_API_KEY
    if "OPEN_ROUTER_API_KEY" in os.environ:
        os.environ["OPENROUTER_API_KEY"] = os.environ["OPEN_ROUTER_API_KEY"]


def encode_audio(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def transcribe_with_gemini(api_key: str, audio_path: str) -> str:
    b64_audio = encode_audio(audio_path)

    # Precise System Instruction to prevent hallucinations
    system_prompt = (
        "You are an expert medical scribe. You will hear an audio recording of a "
        "doctor-patient interaction in Hindi, Marathi, or English.\n"
        "1. TRANSCRIPTION: Transcribe the medical conversation exactly.\n"
        "2. TRANSLATION: Translate any Hindi/Marathi directly into professional clinical English.\n"
        "3. NOISE HANDLING: Ignore background noises, silence, or irrelevant chatter.\n"
        "4. OUTPUT: Output ONLY the final English transcript. Do not include timestamps or intro text."
    )

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": system_prompt},
                    {
                        "type": "image_url",  # OpenRouter/Gemini often uses the image_url schema for multimodal files
                        "image_url": {
                            "url": f"data:audio/mp3;base64,{b64_audio}"
                        }
                    }
                ]
            }
        ]
    }

    resp = requests.post(
        CHAT_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com",
        },
        json=payload,
    )

    if not resp.ok:
        print(f"Error: {resp.status_code} {resp.text}", file=sys.stderr)
        sys.exit(1)

    return resp.json()["choices"][0]["message"]["content"]


SOAP_SYSTEM_PROMPT = """You are an expert medical scribe generating a clinical SOAP note from a doctor-patient conversation transcript.

You will receive a transcript of a doctor-patient interaction (already translated into English). Convert it into a detailed, professional SOAP note.

STRICT RULES:
- Base every statement ONLY on information explicitly present in the transcript. Do NOT infer, assume, or fabricate any clinical detail, vital sign, history, or diagnosis that was not stated.
- If a standard SOAP section has no corresponding information in the transcript, write "Not discussed" or "Not documented" for that section/field — do not guess or leave it blank.
- Use standard clinical terminology and formatting a physician would expect in a medical record.
- Do not include any commentary, disclaimers, or notes about the AI process itself. Output ONLY the SOAP note.

OUTPUT FORMAT:

SUBJECTIVE:
- Chief Complaint (CC):
- History of Present Illness (HPI): (onset, location, duration, character, aggravating/relieving factors, timing, severity — include only what was mentioned)
- Past Medical History (PMH):
- Medications:
- Allergies:
- Family/Social History (if mentioned):
- Review of Systems (ROS): (only systems discussed)

OBJECTIVE:
- Vital Signs (if mentioned):
- Physical Examination Findings (if mentioned):
- Investigations/Labs/Imaging discussed or ordered:

ASSESSMENT:
- Clinical impression / working diagnosis (only if the doctor stated or clearly implied one)
- Differential diagnoses (only if explicitly discussed)

PLAN:
- Medications prescribed (name, dose, frequency, duration — as stated)
- Investigations ordered
- Referrals
- Follow-up instructions
- Patient education/counseling given

Additional Notes: (anything clinically relevant that doesn't fit above categories, e.g. patient concerns, non-compliance mentioned, etc.)

Transcript:
{transcript}
"""


def generate_soap(api_key: str, transcript: str) -> str:
    resp = requests.post(
        CHAT_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com",
        },
        json={
            "model": MODEL,
            "messages": [
                {"role": "user", "content": SOAP_SYSTEM_PROMPT.format(transcript=transcript)},
            ],
        },
    )
    if not resp.ok:
        print(f"Error: {resp.status_code} {resp.text}", file=sys.stderr)
        sys.exit(1)
    return resp.json()["choices"][0]["message"]["content"]


def main():
    load_env()
    parser = argparse.ArgumentParser(description="Medical Scribe via Gemini Flash")
    parser.add_argument("audio_file", help="Path to mp3/wav file")
    parser.add_argument(
        "--transcript-only",
        action="store_true",
        help="Output only the transcript, skip SOAP note generation",
    )
    args = parser.parse_args()

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("Error: OPENROUTER_API_KEY not found.", file=sys.stderr)
        sys.exit(1)

    print("Processing...")
    transcript = transcribe_with_gemini(api_key, args.audio_file)

    if args.transcript_only:
        print("\n--- Transcript ---\n")
        print(transcript)
    else:
        print("Generating SOAP note...")
        note = generate_soap(api_key, transcript)
        filename = datetime.now().strftime("%Y-%m-%d-%H%M%S.md")
        Path(filename).write_text(note)
        print(f"\nSaved: {filename}")


if __name__ == "__main__":
    main()
