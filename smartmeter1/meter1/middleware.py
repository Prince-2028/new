# middleware.py - Custom middleware for cache control and CORS headers

class NoCacheMiddleware:
    """
    Middleware to prevent browser caching of API responses and dynamic content.
    This ensures that updates are immediately visible without requiring hard refresh.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add no-cache headers for API endpoints and dynamic content
        if request.path.startswith('/meter1/api/') or request.path.startswith('/api/'):
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
        return response


class CORSHeadersMiddleware:
    """
    Middleware to add CORS headers to all responses.
    Ensures frontend can properly communicate with backend.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add CORS headers
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response['Access-Control-Max-Age'] = '3600'
        
        return response
