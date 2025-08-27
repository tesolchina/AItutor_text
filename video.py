import asyncio
import datetime
from typing import Any, Dict
import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.background import BackgroundTasks

import json
import os
from pydantic import BaseModel
from dotenv import load_dotenv

import time
from vimeo import VimeoClient
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.dependencies import authenticate_user
from utils.chat.chat_openrouter import chat_by_openrouter_api
from app import models

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/api",
    tags=["video"],
)


class UpdateScriptRequest(BaseModel):
    session_id: str
    script: Dict[str, Any]


async def upload_to_vimeo_async(filename, metadata):
    client = VimeoClient(
        token=os.environ.get("VIMEO_TOKEN"),
        key=os.environ.get("VIMEO_KEY"),
        secret=os.environ.get("VIMEO_SECRET"),
    )

    uri = await asyncio.to_thread(client.upload, filename, data=metadata)
    client.patch(uri, data={"privacy": {"view": "anybody"}})
    client.patch(uri, data={"privacy": {"embed": "public"}})
    video_link = await asyncio.to_thread(
        lambda: client.get(uri + "?fields=link").json()["link"]
    )

    return {"uri": uri, "link": video_link}


async def generate_video_with_scripts(json_data, session_id):
    print("session_id:", session_id)
    def mark_session_error(error_msg: str = None):
        """Helper to update DB with vimeo_url='error'."""
        db = SessionLocal()
        try:
            db.query(models.ChatSession).filter(
                models.ChatSession.session_id == session_id
            ).update(
                {
                    "vimeo_url": "error",
                }
            )
            db.commit()
        finally:
            db.close()
        print(f"[ERROR] session {session_id}: {error_msg}")

    # Extract scripts
    script1 = json_data.get("script1") or "no script found"
    script2 = json_data.get("script2") or "no script found"

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": os.environ.get("HEYGEN_API_KEY"),
    }

    variables = {
        "text1": {"name": "text1", "type": "text", "properties": {"content": script1}},
        "text2": {"name": "text2", "type": "text", "properties": {"content": script2}},
    }

    payload = {
        "caption": False,
        "callback_id": "<callback_id>",
        "title": "Untitled Video",
        "dimension": {"width": 1280, "height": 720},
        "include_gif": False,
        "enable_sharing": False,
        "variables": variables,
    }

    generate_url = (
        "https://api.heygen.com/v2/template/499c7707017a4b1abb1f80937ea35abe/generate"
    )

    try:
        async with aiohttp.ClientSession() as session:
            # Step 1: Request video generation
            async with session.post(
                generate_url, json=payload, headers=headers
            ) as resp:
                if not resp.ok:
                    raise Exception(f"Generation request failed: {resp.status}")
                generate_response = await resp.json()
                if generate_response.get("error"):
                    raise Exception(generate_response["error"])
                video_id = generate_response["data"]["video_id"]

            # Step 2: Poll status
            status_url = (
                f"https://api.heygen.com/v1/video_status.get?video_id={video_id}"
            )
            for _ in range(150):  # 150 retries max
                await asyncio.sleep(10)
                async with session.get(status_url, headers=headers) as status_resp:
                    if not status_resp.ok:
                        raise Exception(f"Status check failed: {status_resp.status}")
                    status_data = await status_resp.json()
                    if status_data["code"] != 100:
                        raise Exception(status_data["message"])

                    video_status = status_data["data"]["status"]
                    if video_status == "completed":
                        video_url = status_data["data"]["video_url"]
                        break
                    elif video_status not in ["processing", "waiting"]:
                        raise Exception(f"Unexpected status: {video_status}")
            else:
                raise Exception("Video generation timed out")

            # Step 3: Download video
            async with session.get(video_url) as video_resp:
                filename = f"{video_id}_{int(time.time())}.mp4"
                import aiofiles

                async with aiofiles.open(filename, "wb") as f:
                    await f.write(await video_resp.read())

            # Step 4: Upload to Vimeo
            vimeo_metadata = {
                "name": "Generated Video",
                "description": f"Script1: {script1}, Script2: {script2}",
            }
            vimeo_result = await upload_to_vimeo_async(filename, vimeo_metadata)

            # Step 5: Save Vimeo URL to DB
            db = SessionLocal()
            try:
                db.query(models.ChatSession).filter(
                    models.ChatSession.session_id == session_id
                ).update(
                    {
                        "vimeo_url": vimeo_result["link"],
                        "uploaded_at": datetime.datetime.now(datetime.timezone.utc),
                    }
                )
                db.commit()
            finally:
                db.close()

            os.remove(filename)

            return {
                "local_file": filename,
                "vimeo_uri": vimeo_result["uri"],
                "vimeo_link": vimeo_result["link"],
            }

    except Exception as e:
        # One centralized error handler
        mark_session_error(str(e))
        return {
            "local_file": None,
            "vimeo_uri": None,
            "vimeo_link": "error",
        }


@router.post("/generate-video")
async def generate_video(
    generate_data: UpdateScriptRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(authenticate_user),
    db: Session = Depends(get_db),
):
    try:
        session_id = generate_data.session_id
        session = (
            db.query(models.ChatSession)
            .filter(models.ChatSession.session_id == session_id)
            .first()
        )

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if str(session.user_id) != str(user_id):
            raise HTTPException(
                status_code=403, detail="You are not authorized to update this script"
            )

        session.vimeo_url = "generating"
        db.commit()

        script_data = generate_data.script
        if script_data is not None:
            background_tasks.add_task(
                generate_video_with_scripts, script_data, session_id
            )

        return {
            "status": "success",
            "message": "script received",
        }

    except json.JSONDecodeError:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Invalid JSON format in request"},
        )


@router.post("/update-script")
async def update_script(
    update_data: UpdateScriptRequest,
    user_id: str = Depends(authenticate_user),
    db: Session = Depends(get_db),
):
    """
    Update script content for a session after verifying user ownership
    """
    session_id = update_data.session_id
    script_data = update_data.script

    if not session_id or not script_data:
        raise HTTPException(
            status_code=400, detail="Both session_id and script data are required"
        )

    try:
        # First verify the user owns this session
        session = (
            db.query(models.ChatSession)
            .filter(models.ChatSession.session_id == session_id)
            .first()
        )

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if str(session.user_id) != str(user_id):
            raise HTTPException(
                status_code=403, detail="You are not authorized to update this script"
            )

        # Update the script
        session.script = script_data
        db.commit()
        db.refresh(session)

        return {
            "status": "success",
            "message": "Script updated successfully",
            "data": {
                "session_id": session_id,
                "updated_at": (
                    session.created_at.isoformat() if session.created_at else None
                ),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating script: {str(e)}")


@router.get("/get-script/{session_id}")
async def get_script(
    session_id: str,
    user_id: str = Depends(authenticate_user),
    db: Session = Depends(get_db),
):
    try:
        # Single query to get both user_id (for auth) and script
        session = (
            db.query(models.ChatSession)
            .filter(models.ChatSession.session_id == session_id)
            .first()
        )

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Check authorization
        if str(session.user_id) != str(user_id):
            raise HTTPException(
                status_code=403, detail="Not authorized to access this session"
            )

        # Check if script exists
        if session.script is None:
            raise HTTPException(
                status_code=404, detail="Script not found for this session"
            )

        # Get vimeo_url and uploaded_at
        vimeo_url = session.vimeo_url
        uploaded_at = session.uploaded_at

        # If vimeo_url is None or "generating", return it directly
        if vimeo_url is None or vimeo_url == "generating":
            pass
        elif uploaded_at:
            current_time = datetime.datetime.now(datetime.timezone.utc)
            time_difference = current_time - uploaded_at

            # If less than 7 minutes and vimeo_url is valid, return "generating"
            if time_difference < datetime.timedelta(minutes=7):
                vimeo_url = "generating"

        return {
            "status": "success",
            "data": session.script,
            "vimeo_url": vimeo_url,
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"An error occurred: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Internal server error"},
        )


@router.post("/generate-script")
async def generate_script(
    request: Request,
    user_id: str = Depends(authenticate_user),
    db: Session = Depends(get_db),
):
    try:
        # Query user information
        user = db.query(models.User).filter(models.User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get request body and parse as JSON
        body = await request.body()
        data = json.loads(body)

        # Extract conversation field with default empty list
        conversation = data.get("conversation_list", [])
        session_id = data.get("session_id", None)
        if not conversation:
            raise ValueError("Conversation list cannot be empty")

        # If check is True, query the database to see if script exists
        if session_id:
            session = (
                db.query(models.ChatSession)
                .filter(models.ChatSession.session_id == session_id)
                .first()
            )
            if session and session.script is not None:
                return {
                    "status": "success",
                    "message": "Script already exists, no update performed",
                }

        # Replace the 0th element with system prompt
        conversation[0] = {
            "role": "system",
            "content": """
                Review the provided chat history between a user and a chatbot discussing script content. Your task is to:  
                1. Identify exactly two finalized scripts:  
                2. If either script is missing or the conversation lacks finalized content, respond with `"No script found."` for the missing script(s).  

                Response Format (JSON):  
                json
                {
                "script1": "The real script content here or 'No script found.'",
                "script2": "The real script content here or 'No script found.'"
                }


                Rules:  
                Extract only the final agreed-upon versions of both scripts. Ignore drafts, edits, or rejected ideas.  
                If the chat history contains only one script, set the other value to `"No script found."`.  
                Ensure the scripts are copied verbatim without modifications.  
                """,
        }

        # Get chat response from API
        chat_response, res, time_elapsed = await chat_by_openrouter_api(
            conversation_list=conversation, model_name="openai/gpt-4.1-mini"
        )

        if chat_response is None:
            raise ValueError("No response received from the API")

        # Clean and parse the response
        chat_response = chat_response.replace("json", "").replace("`", "")
        script_data = json.loads(chat_response)

        if session_id:
            if session:
                session.script = script_data
                db.commit()
            else:
                raise HTTPException(status_code=404, detail="Session not found")

        return {
            "status": "success",
            "message": "Script generated and saved successfully",
        }

    except json.JSONDecodeError as _:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Invalid JSON format in request"},
        )
    except ValueError as e:
        return JSONResponse(
            status_code=400, content={"status": "error", "message": str(e)}
        )
    except Exception as e:
        print(f"An error occurred: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Internal server error"},
        )
