from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from channels.auth import AuthMiddlewareStack
from rest_framework_simplejwt.exceptions import TokenError
import logging

logger = logging.getLogger(__name__)


def get_token_from_scope(scope):
    token=None    
    try:
        query = parse_qs(scope["query_string"].decode())
        if 'token' in query:
            token = query['token'][0]

        if not token:
            headers = dict(scope["headers"])
            header = headers.get(b"authorization", None) or headers.get(b"Authorization", None)
            if header:
                token = header.decode().split(" ")[1]
    except Exception as e:
        logger.error(f"Error extracting token: {e}", exc_info=True)
    return token


#left this for if i'll ever need to get the user object
@database_sync_to_async
def get_user(token):
    try:
        access = AccessToken(token)
        user = get_user_model().objects.get(id=access["user_id"])
        return user
    except Exception as e:
        print(f"Error in get_user function: {e}")
        return AnonymousUser()



class JWTAuthMiddleware:
    #this is the middleware for authenticating users with JWT tokens
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        
        token = get_token_from_scope(scope)

        if token:
            try:
                scope["user"] = await get_user(token) 
            except Exception as e:
                logger.error(f"Trouble validating token: {e}", exc_info=True)
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)
    

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
    