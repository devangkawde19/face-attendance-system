import cv2
import insightface
import numpy as np

print("Loading InsightFace...")

face_app = insightface.app.FaceAnalysis(
    name="buffalo_l", providers=["CPUExecutionProvider"]
)

face_app.prepare(ctx_id=0, det_size=(256, 256))

print("Model loaded.")


def normalize(embedding):
    norm = np.linalg.norm(embedding)

    if norm == 0:
        return embedding

    return embedding / norm


def cosine_similarity(embedding1, embedding2):
    embedding1 = normalize(embedding1)
    embedding2 = normalize(embedding2)

    return float(np.dot(embedding1, embedding2))


# ---------------------------------------
# STEP 1: Capture registered profile
# ---------------------------------------

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Could not open camera.")
    exit()

registered_embeddings = []

required_samples = 5

print("\nREGISTRATION")
print("Capture 5 samples.")
print("Press C for each sample.")
print("Press Q to quit.")

while len(registered_embeddings) < required_samples:

    success, frame = camera.read()

    if not success:
        break

    display = frame.copy()

    cv2.putText(
        display,
        f"Registration: {len(registered_embeddings)}/{required_samples}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 0),
        2,
    )

    cv2.putText(
        display,
        "Press C to capture",
        (20, 75),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 0),
        2,
    )

    cv2.imshow("Similarity Test", display)

    key = cv2.waitKey(1) & 0xFF

    if key == ord("c"):

        faces = face_app.get(frame)

        if len(faces) == 0:
            print("No face detected.")

        elif len(faces) > 1:
            print("Multiple faces detected.")

        else:
            face = faces[0]

            x1, y1, x2, y2 = map(int, face.bbox)

            face_width = x2 - x1
            face_height = y2 - y1

            if face_width < 120 or face_height < 120:
                print("Face too small.")

            else:
                embedding = normalize(face.embedding)

                registered_embeddings.append(embedding)

                print(f"Registered sample " f"{len(registered_embeddings)}")

    elif key == ord("q"):
        camera.release()
        cv2.destroyAllWindows()
        exit()


# ---------------------------------------
# STEP 2: Create profile
# ---------------------------------------

embedding_array = np.array(registered_embeddings)

profile_embedding = np.mean(embedding_array, axis=0)

profile_embedding = normalize(profile_embedding)

print("\nRegistration profile created.")
print("Profile shape:", profile_embedding.shape)


# ---------------------------------------
# STEP 3: Capture NEW sample
# ---------------------------------------

print("\n--------------------------------")
print("NOW TEST A NEW FACE SAMPLE")
print("--------------------------------")

print("Change your position slightly.")
print("Press C to test.")
print("Press Q to quit.")

while True:

    success, frame = camera.read()

    if not success:
        break

    display = frame.copy()

    cv2.putText(
        display,
        "New test sample - Press C",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 0),
        2,
    )

    cv2.imshow("Similarity Test", display)

    key = cv2.waitKey(1) & 0xFF

    if key == ord("c"):

        print("\nProcessing new sample...")

        faces = face_app.get(frame)

        if len(faces) == 0:
            print("No face detected.")
            continue

        if len(faces) > 1:
            print("Multiple faces detected.")
            continue

        new_embedding = normalize(faces[0].embedding)

        similarity = cosine_similarity(profile_embedding, new_embedding)

        print(f"\nCosine similarity: " f"{similarity:.4f}")

        print(f"Similarity percentage: " f"{similarity * 100:.2f}%")

        if similarity >= 0.50:
            print("Possible match")

        else:
            print("Likely different person")

        print("\nPress C to test another sample.")

    elif key == ord("q"):
        break


camera.release()
cv2.destroyAllWindows()
