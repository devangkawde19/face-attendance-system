import numpy as np

from sqlalchemy import text
from sqlalchemy.orm import Session


def find_matching_student(
    db: Session,
    embedding: np.ndarray,
    threshold: float = 0.60,
):
    """
    Find the closest stored face embedding using
    cosine similarity.

    Returns:
        Matching student information if similarity
        is above the threshold.
        Otherwise returns None.
    """

    # Make sure embedding is a NumPy array
    embedding = np.asarray(embedding, dtype=np.float32)

    # Make sure it has 512 dimensions
    if embedding.shape != (512,):
        raise ValueError(
            f"Expected 512-dimensional embedding, " f"got {embedding.shape}"
        )

    # Normalize the embedding
    norm = np.linalg.norm(embedding)

    if norm == 0:
        raise ValueError("Invalid face embedding")

    embedding = embedding / norm

    # Convert to Python list for PostgreSQL
    embedding_list = embedding.tolist()

    query = text("""
        SELECT
            fe.id AS embedding_id,
            s.id AS student_id,
            s.student_code,
            s.full_name,
            s.email,
            s.course,
            1 - (fe.embedding <=> CAST(:embedding AS vector)) AS similarity
        FROM face_embeddings fe
        JOIN students s
            ON s.id = fe.student_id
        ORDER BY fe.embedding <=> CAST(:embedding AS vector)
        LIMIT 1
    """)

    result = db.execute(query, {"embedding": str(embedding_list)}).mappings().first()

    if result is None:
        return None

    similarity = float(result["similarity"])

    if similarity < threshold:
        return None

    return {
        "student_id": result["student_id"],
        "student_code": result["student_code"],
        "full_name": result["full_name"],
        "email": result["email"],
        "course": result["course"],
        "similarity": similarity,
        "embedding_id": result["embedding_id"],
    }
