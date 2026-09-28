"""Training entry point placeholder for the future deep-learning version.

Expected training data:
- project-level train/validation/test splits;
- plot polygons, setbacks, north direction, and floor level;
- labelled room polygons or boxes;
- walls, doors, windows, stairs, and adjacency edges;
- architect/code/Vastu validation labels.

Real training is deliberately not started from this file because the repository
does not include licensed architectural geometry data or heavy ML dependencies.
"""


def main():
    raise SystemExit(
        "Training requires a licensed labelled floor-plan geometry dataset and "
        "an installed deep-learning framework such as PyTorch or TensorFlow."
    )


if __name__ == "__main__":
    main()
