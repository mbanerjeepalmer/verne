"""
ListenNotes API Client
A shared module for interacting with the ListenNotes API.
"""

import os
import sys
import time
from typing import Optional, Dict, Any
import requests


class ListenNotesAPI:
    """Client for interacting with the ListenNotes API."""

    PRODUCTION_URL = "https://listen-api.listennotes.com/api/v2"
    MOCK_URL = "https://listen-api-test.listennotes.com/api/v2"

    def __init__(self, api_key: Optional[str] = None, use_mock: bool = False):
        """
        Initialize the API client.

        Args:
            api_key: ListenNotes API key. If not provided, reads from LISTENNOTES_API_KEY env var.
                     Not required when using mock server.
            use_mock: If True, use the mock/test server (doesn't require API key)
        """
        self.use_mock = use_mock
        self.base_url = self.MOCK_URL if use_mock else self.PRODUCTION_URL

        # API key is optional for mock server
        self.api_key = api_key or os.getenv("LISTENNOTES_API_KEY")

        if not use_mock and not self.api_key:
            raise ValueError(
                "API key required for production server. Set LISTENNOTES_API_KEY environment variable "
                "or pass api_key parameter, or use --mock flag for testing."
            )

        self.headers = {}
        if self.api_key:
            self.headers["X-ListenAPI-Key"] = self.api_key

    def _request(self, method: str, url: str, **kwargs) -> requests.Response:
        """Make an HTTP request with logging."""
        params = kwargs.get("params", {})
        print(f"[ListenNotes] {method} {url} params={params}", file=sys.stderr)
        start = time.time()
        try:
            resp = requests.request(method, url, headers=self.headers, timeout=30, **kwargs)
            elapsed_ms = (time.time() - start) * 1000
            print(f"[ListenNotes] {resp.status_code} in {elapsed_ms:.0f}ms ({len(resp.content)} bytes)", file=sys.stderr)
            resp.raise_for_status()
            return resp
        except requests.exceptions.Timeout:
            elapsed_ms = (time.time() - start) * 1000
            print(f"[ListenNotes] TIMEOUT after {elapsed_ms:.0f}ms", file=sys.stderr)
            raise
        except requests.exceptions.HTTPError as e:
            body = ""
            if e.response is not None:
                try:
                    body = e.response.text[:500]
                except Exception:
                    pass
            print(f"[ListenNotes] HTTP {e.response.status_code if e.response else '?'}: {body}", file=sys.stderr)
            raise

    def search(self, **params) -> Dict[str, Any]:
        """Search for podcasts or episodes."""
        url = f"{self.base_url}/search"
        clean_params = {k: v for k, v in params.items() if v is not None}
        return self._request("GET", url, params=clean_params).json()

    def best_podcasts(self, **params) -> Dict[str, Any]:
        """Fetch best podcasts."""
        url = f"{self.base_url}/best_podcasts"
        clean_params = {k: v for k, v in params.items() if v is not None}
        return self._request("GET", url, params=clean_params).json()

    def get_podcast(self, podcast_id: str, **params) -> Dict[str, Any]:
        """Get detailed podcast information by ID."""
        url = f"{self.base_url}/podcasts/{podcast_id}"
        clean_params = {k: v for k, v in params.items() if v is not None}
        return self._request("GET", url, params=clean_params).json()

    def get_episode(self, episode_id: str, **params) -> Dict[str, Any]:
        """Get detailed episode information by ID."""
        url = f"{self.base_url}/episodes/{episode_id}"
        clean_params = {k: v for k, v in params.items() if v is not None}
        return self._request("GET", url, params=clean_params).json()

    def get_podcast_recommendations(self, podcast_id: str, **params) -> Dict[str, Any]:
        """Get podcast recommendations based on a podcast ID."""
        url = f"{self.base_url}/podcasts/{podcast_id}/recommendations"
        clean_params = {k: v for k, v in params.items() if v is not None}
        return self._request("GET", url, params=clean_params).json()

    def get_episode_recommendations(self, episode_id: str, **params) -> Dict[str, Any]:
        """Get episode recommendations based on an episode ID."""
        url = f"{self.base_url}/episodes/{episode_id}/recommendations"
        clean_params = {k: v for k, v in params.items() if v is not None}
        return self._request("GET", url, params=clean_params).json()
