class CacheKeys:

    @staticmethod
    def dashboard_stats(user_id):
        return f"dashboard:stats:user:{user_id}"

    @staticmethod
    def project_stats(user_id, project_id):
        return f"project:stats:user:{user_id}:project:{project_id}"

    @staticmethod
    def budget_stats(user_id, budget_id):
        return f"budget:stats:user:{user_id}:budget:{budget_id}"

    @staticmethod
    def client_intelligence(user_id, client_id):
        return f"client:intelligence:user:{user_id}:client:{client_id}"

    @staticmethod
    def unread_notifications(user_id):
        return f"notifications:unread:user:{user_id}"