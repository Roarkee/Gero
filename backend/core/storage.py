from django.core.files.storage import Storage
from django.conf import settings
from supabase import create_client, Client
import os
from urllib.parse import urljoin

class SupabaseStorage(Storage):
    def __init__(self):
        url = os.environ.get("supabaseURL")
        key = os.environ.get("supabaseKey")
        self.bucket_name = os.environ.get("SUPABASE_BUCKET", "Gero")
        self.supabase: Client = create_client(url, key)
        
    def _save(self, name, content):
        # Read file content
        file_content = content.read()
        
        # Upload to Supabase Storage
        self.supabase.storage.from_(self.bucket_name).upload(name, file_content, {"upsert": "true"})
        
        return name
        
    def exists(self, name):
        try:
            # Check if file exists by listing
            res = self.supabase.storage.from_(self.bucket_name).list(path=os.path.dirname(name))
            for f in res:
                if f['name'] == os.path.basename(name):
                    return True
        except Exception:
            pass
        return False
        
    def url(self, name):
        return self.supabase.storage.from_(self.bucket_name).get_public_url(name)
        
    def delete(self, name):
        self.supabase.storage.from_(self.bucket_name).remove([name])
        
    def size(self, name):
        return 0 # Stub if not strictly needed
