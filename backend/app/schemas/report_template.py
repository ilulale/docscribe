from pydantic import BaseModel


class SectionInput(BaseModel):
    key: str
    label: str
    prompt_instructions: str = ""
    order: int = 0
    visible: bool = True


class ReportTemplateInput(BaseModel):
    sections: list[SectionInput]
    pdf_footer: str | None = None


class SectionResponse(BaseModel):
    key: str
    label: str
    prompt_instructions: str = ""
    order: int = 0
    visible: bool = True


class ReportTemplateResponse(BaseModel):
    sections: list[SectionResponse]
    pdf_footer: str | None = None
