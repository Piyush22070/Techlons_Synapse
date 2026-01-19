import os
import shutil
from enum import Enum
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

SQLALCHEMY_DATABASE_URL = "sqlite:///./lab.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class RequestStatus(str, Enum):
    PENDING = "pending"
    FILE_UPLOADED = "file uploaded"
    DONE = "done"

class LabRequest(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    details = Column(String)
    status = Column(String, default=RequestStatus.PENDING)
    fastq_file_path = Column(String, nullable=True)
    report_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

class RequestCreate(BaseModel):
    name: str
    details: str

class RequestResponse(BaseModel):
    id: int
    name: str
    details: str
    status: str
    fastq_file_path: Optional[str] = None
    report_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

app = FastAPI()

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/request", response_model=RequestResponse)
def create_request(request: RequestCreate, db: Session = Depends(get_db)):
    db_request = LabRequest(
        name=request.name,
        details=request.details,
        status=RequestStatus.PENDING
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@app.get("/get-request", response_model=List[RequestResponse])
def get_requests(db: Session = Depends(get_db)):
    return db.query(LabRequest).all()

@app.put("/modify-request/{request_id}", response_model=RequestResponse)
async def modify_request(
    request_id: int,
    fastq_file: Optional[UploadFile] = File(None),
    report_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    db_request = db.query(LabRequest).filter(LabRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")

    if fastq_file:
        file_location = f"{UPLOAD_DIR}/{request_id}_fastq_{fastq_file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(fastq_file.file, file_object)
        db_request.fastq_file_path = file_location
        db_request.status = RequestStatus.FILE_UPLOADED

    if report_file:
        report_location = f"{UPLOAD_DIR}/{request_id}_report_{report_file.filename}"
        with open(report_location, "wb+") as file_object:
            shutil.copyfileobj(report_file.file, file_object)
        db_request.report_path = report_location
        db_request.status = RequestStatus.DONE
    
    db.commit()
    db.refresh(db_request)
    return db_request

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=filename)
    raise HTTPException(status_code=404, detail="File not found")