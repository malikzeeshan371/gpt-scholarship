from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class CourseLevel(str, Enum):
    bachelors = "Bachelors"
    masters = "Masters"
    phd = "PhD"


class ScholarshipBase(BaseModel):
    title: str = Field(min_length=1)
    country: str = Field(min_length=1)
    course_levels: list[str]
    provider: str = "Government of Pakistan / HEC"
    description: str = ""
    eligibility: str = ""
    deadline: Optional[str] = None
    application_url: str = ""
    source_url: str = ""


class Scholarship(ScholarshipBase):
    id: int
    updated_at: Optional[str] = None


class SearchRequest(BaseModel):
    country: str = Field(min_length=1)
    course_level: CourseLevel
