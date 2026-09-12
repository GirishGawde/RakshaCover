from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("aftermath")

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    logger.error(f"422 Error! Body: {body.decode()} - Errors: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})
