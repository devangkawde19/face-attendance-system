import cv2
import numpy as np
from insightface.app import FaceAnalysis


class FaceRecognitionService:
    def __init__(self):
        print("Loading InsightFace model...")

        self.app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])

        self.app.prepare(ctx_id=0, det_size=(320, 320))

        print("InsightFace model loaded successfully!")

    def get_embedding(self, image):
        """
        Detect exactly one face and return its
        normalized 512-dimensional embedding.
        """

        if image is None:
            raise ValueError("Image is empty")

        faces = self.app.get(image)

        if len(faces) == 0:
            raise ValueError("No face detected")

        if len(faces) > 1:
            raise ValueError("Multiple faces detected")

        face = faces[0]

        embedding = face.embedding

        if embedding is None:
            raise ValueError("Could not generate face embedding")

        embedding = np.asarray(embedding, dtype=np.float32)

        if embedding.shape != (512,):
            raise ValueError(f"Unexpected embedding shape: {embedding.shape}")

        # Normalize embedding
        norm = np.linalg.norm(embedding)

        if norm == 0:
            raise ValueError("Invalid face embedding")

        embedding = embedding / norm

        return embedding
