from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="listennotes-cli",
    version="2.0.0",
    author="Verne",
    description="Command-line interface for the ListenNotes Podcast API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/listennotes-cli",
    py_modules=[
        "listennotes_api",
        "podcast_search",
        "podcast_best",
        "podcast_get",
        "episode_get",
        "podcast_recommendations",
        "episode_recommendations",
    ],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "podcast-search=podcast_search:main",
            "podcast-best=podcast_best:main",
            "podcast-get=podcast_get:main",
            "episode-get=episode_get:main",
            "podcast-recommendations=podcast_recommendations:main",
            "episode-recommendations=episode_recommendations:main",
        ],
    },
)
