"""Neural layout model specification.

This module documents the intended deep-learning model boundary. A production
implementation should replace these placeholders with a trained PyTorch or
TensorFlow model after a licensed, architect-labelled geometry dataset exists.
"""


MODEL_CARD = {
    "name": "DreamHome Neural Layout Generator",
    "version": "0.1-architecture",
    "stage": "deep-learning-ready hybrid prototype",
    "inputs": [
        "plot size and orientation",
        "room programme",
        "floor count",
        "style, Vastu, parking, and feature constraints",
    ],
    "outputs": [
        "room adjacency graph",
        "candidate room boxes or polygons",
        "layout quality score",
    ],
}


def describe_model():
    """Return model metadata used by the local API and documentation."""
    return MODEL_CARD.copy()
