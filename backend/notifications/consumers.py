from channels.generic.websocket import AsyncWebsocketConsumer
import json
from channels.db import database_sync_to_async



class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if not user or user.is_anonymous:
            await self.close()
        else:
            self.group_name = f'user_{user.id}_group'

            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
        if self.scope['user'] and not self.scope['user'].is_anonymous:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
    #handle incoming messages from client if needed
    async def receive(self, text_data):
        pass

    
    async def notify(self, event):
        #this method is called when a notification is sent to the group of the user
        #using channellayer.group_send method is my view or signal if i create one

        await self.send(text_data=json.dumps({
            'type': event.get('type', 'notification'),
            'title': event.get('title', 'New Notification'),
            'message': event.get('message', ''),
            'extra': event.get('extra', {})
        }))
    