import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404

logger = logging.getLogger('django')


def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework.
    Standardizes all API error responses across the entire application into:
    {
        "status": "error",
        "status_code": 400,
        "code": "VALIDATION_ERROR",
        "message": "Human readable summary",
        "errors": { "field": ["detail"] },
        "detail": "Human readable summary"
    }
    """
    # Call REST framework's default exception handler first to get the standard response
    response = exception_handler(exc, context)

    # Handle Django's native ValidationError if unhandled by DRF
    if response is None and isinstance(exc, DjangoValidationError):
        if hasattr(exc, 'message_dict'):
            errors = exc.message_dict
            message = "; ".join(f"{k}: {', '.join(v)}" for k, v in errors.items())
        elif hasattr(exc, 'messages'):
            errors = {'non_field_errors': exc.messages}
            message = "; ".join(exc.messages)
        else:
            errors = {'detail': str(exc)}
            message = str(exc)

        return Response({
            'status': 'error',
            'status_code': status.HTTP_400_BAD_REQUEST,
            'code': 'VALIDATION_ERROR',
            'message': message,
            'errors': errors,
            'detail': message,
        }, status=status.HTTP_400_BAD_REQUEST)

    # Handle standard 404
    if response is None and isinstance(exc, Http404):
        return Response({
            'status': 'error',
            'status_code': status.HTTP_404_NOT_FOUND,
            'code': 'NOT_FOUND',
            'message': 'Resource not found',
            'detail': 'Resource not found',
            'errors': {'detail': 'Resource not found'}
        }, status=status.HTTP_404_NOT_FOUND)

    # Handle unexpected 500 exceptions
    if response is None:
        view_name = context.get('view').__class__.__name__ if context.get('view') else 'UnknownView'
        logger.error(f"Unhandled Exception in {view_name}: {str(exc)}", exc_info=True)
        return Response({
            'status': 'error',
            'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'code': 'INTERNAL_SERVER_ERROR',
            'message': 'An internal server error occurred. Please try again later.',
            'detail': 'An internal server error occurred. Please try again later.',
            'errors': {'server': [str(exc)]}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Standardize DRF standard response
    status_code = response.status_code
    data = response.data

    errors_dict = {}
    message_parts = []
    error_code = 'API_ERROR'

    if status_code == 400:
        error_code = 'VALIDATION_ERROR'
    elif status_code == 401:
        error_code = 'AUTHENTICATION_REQUIRED'
    elif status_code == 403:
        error_code = 'PERMISSION_DENIED'
    elif status_code == 404:
        error_code = 'NOT_FOUND'
    elif status_code == 429:
        error_code = 'THROTTLED'
    elif status_code >= 500:
        error_code = 'SERVER_ERROR'

    if isinstance(data, dict):
        for field, detail in data.items():
            if isinstance(detail, list):
                errors_dict[field] = [str(d) for d in detail]
                message_parts.append(f"{field}: {', '.join(str(d) for d in detail)}")
            elif isinstance(detail, dict):
                errors_dict[field] = detail
                message_parts.append(f"{field}: {detail}")
            else:
                errors_dict[field] = [str(detail)]
                message_parts.append(f"{field}: {detail}")
    elif isinstance(data, list):
        errors_dict['non_field_errors'] = [str(d) for d in data]
        message_parts = [str(d) for d in data]
    else:
        errors_dict['detail'] = [str(data)]
        message_parts = [str(data)]

    primary_message = "; ".join(message_parts) if message_parts else 'An error occurred.'

    # Re-structure response data preserving backwards-compatible keys
    response.data = {
        'status': 'error',
        'status_code': status_code,
        'code': error_code,
        'message': primary_message,
        'detail': primary_message,
        'errors': errors_dict,
        **({k: v for k, v in data.items()} if isinstance(data, dict) else {})
    }

    return response
