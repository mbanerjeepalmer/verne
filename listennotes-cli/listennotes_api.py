"""
ListenNotes API Client
A shared module for interacting with the ListenNotes API.
"""

import os
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

    def search(self, **params) -> Dict[str, Any]:
        """
        Search for podcasts or episodes.

        Args:
            **params: Query parameters for the search endpoint

        Returns:
            JSON response from the API
        """
        url = f"{self.base_url}/search"

        # Remove None values from params
        clean_params = {k: v for k, v in params.items() if v is not None}

        response = requests.get(url, headers=self.headers, params=clean_params)
        response.raise_for_status()

        return response.json()

    def best_podcasts(self, **params) -> Dict[str, Any]:
        """
        Fetch best podcasts.

        Args:
            **params: Query parameters for the best_podcasts endpoint

        Returns:
            JSON response from the API
        """
        url = f"{self.base_url}/best_podcasts"

        # Remove None values from params
        clean_params = {k: v for k, v in params.items() if v is not None}

        response = requests.get(url, headers=self.headers, params=clean_params)
        response.raise_for_status()

        return response.json()

    def get_podcast(self, podcast_id: str, **params) -> Dict[str, Any]:
        """
        Get detailed podcast information by ID.

        Args:
            podcast_id: The podcast identifier
            **params: Query parameters (next_episode_pub_date, sort)

        Returns:
            JSON response from the API
        """
        url = f"{self.base_url}/podcasts/{podcast_id}"

        # Remove None values from params
        clean_params = {k: v for k, v in params.items() if v is not None}

        response = requests.get(url, headers=self.headers, params=clean_params)
        response.raise_for_status()

        return response.json()

    def get_episode(self, episode_id: str, **params) -> Dict[str, Any]:
        """
        Get detailed episode information by ID.

        Args:
            episode_id: The episode identifier
            **params: Query parameters (show_transcript)

        Returns:
            JSON response from the API
        """
        url = f"{self.base_url}/episodes/{episode_id}"

        # Remove None values from params
        clean_params = {k: v for k, v in params.items() if v is not None}

        response = requests.get(url, headers=self.headers, params=clean_params)
        response.raise_for_status()

        return response.json()

    def get_podcast_recommendations(self, podcast_id: str, **params) -> Dict[str, Any]:
        """
        Get podcast recommendations based on a podcast ID.

        Args:
            podcast_id: The podcast identifier
            **params: Query parameters (safe_mode)

        Returns:
            JSON response from the API
        """
        url = f"{self.base_url}/podcasts/{podcast_id}/recommendations"

        # Remove None values from params
        clean_params = {k: v for k, v in params.items() if v is not None}

        response = requests.get(url, headers=self.headers, params=clean_params)
        response.raise_for_status()

        return response.json()

    def get_episode_recommendations(self, episode_id: str, **params) -> Dict[str, Any]:
        """
        Get episode recommendations based on an episode ID.

        Args:
            episode_id: The episode identifier
            **params: Query parameters (safe_mode)

        Returns:
            JSON response from the API
        """
        url = f"{self.base_url}/episodes/{episode_id}/recommendations"

        # Remove None values from params
        clean_params = {k: v for k, v in params.items() if v is not None}

        response = requests.get(url, headers=self.headers, params=clean_params)
        response.raise_for_status()

        return response.json()
