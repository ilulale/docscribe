import base64
from dataclasses import dataclass

import httpx

from app.config import settings

CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

TRANSCRIPTION_PROMPT = (
    "You are an expert medical scribe. You will hear an audio recording of a "
    "doctor-patient interaction in Hindi, Marathi, or English.\n"
    "1. TRANSCRIPTION: Transcribe the medical conversation exactly.\n"
    "2. TRANSLATION: Translate any Hindi/Marathi directly into professional clinical English.\n"
    "3. NOISE HANDLING: Ignore background noises, silence, or irrelevant chatter.\n"
    "4. OUTPUT: Output ONLY the final English transcript. Do not include timestamps or intro text."
)

SOAP_PROMPT = """You are an expert medical scribe generating a clinical SOAP note from a doctor-patient conversation transcript.

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


@dataclass
class OpenRouterResponse:
    content: str
    prompt_tokens: int
    completion_tokens: int


def encode_audio_bytes(audio_bytes: bytes) -> str:
    return base64.b64encode(audio_bytes).decode("utf-8")


def call_openrouter(messages: list[dict]) -> OpenRouterResponse:
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com",
    }
    payload = {
        "model": settings.openrouter_model,
        "messages": messages,
    }

    resp = httpx.post(CHAT_URL, headers=headers, json=payload, timeout=300.0)
    resp.raise_for_status()

    data = resp.json()
    choice = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})

    return OpenRouterResponse(
        content=choice,
        prompt_tokens=usage.get("prompt_tokens", 0),
        completion_tokens=usage.get("completion_tokens", 0),
    )


def transcribe_audio(audio_bytes: bytes) -> OpenRouterResponse:
    b64_audio = encode_audio_bytes(audio_bytes)
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": TRANSCRIPTION_PROMPT},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:audio/mp3;base64,{b64_audio}"},
                },
            ],
        }
    ]
    return call_openrouter(messages)


def build_soap_prompt_from_sections(sections: list[dict]) -> str:
    """Build a dynamic SOAP prompt from template sections."""
    sorted_sections = sorted(sections, key=lambda s: s.get("order", 0))
    visible = [s for s in sorted_sections if s.get("visible", True)]

    format_block = "\n\n".join(
        f"- {s['label'].upper()}:\n  Instructions for the AI: {s.get('prompt_instructions', '')}"
        for s in visible
    )

    return f"""You are an expert medical scribe generating a clinical note from a doctor-patient conversation transcript.

You will receive a transcript of a doctor-patient interaction (already translated into English). Convert it into a detailed, professional clinical note following the sections below.

STRICT RULES:
- Base every statement ONLY on information explicitly present in the transcript. Do NOT infer, assume, or fabricate any clinical detail, vital sign, history, or diagnosis that was not stated.
- If a section has no corresponding information in the transcript, write "Not discussed" or "Not documented" for that section — do not guess or leave it blank.
- Use standard clinical terminology and formatting a physician would expect in a medical record.
- Do not include any commentary, disclaimers, or notes about the AI process itself. Output ONLY the clinical note.

OUTPUT FORMAT:
{format_block}

Transcript:
{{transcript}}
"""


def generate_soap(transcript: str, sections: list[dict] | None = None) -> OpenRouterResponse:
    prompt = build_soap_prompt_from_sections(sections) if sections else SOAP_PROMPT
    messages = [
        {"role": "user", "content": prompt.format(transcript=transcript)}
    ]
    return call_openrouter(messages)
