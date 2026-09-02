import cv2
import insightface
import numpy as np

print("Loading InsightFace...")

face_app = insightface.app.FaceAnalysis(
    name="buffalo_l", providers=["CPUExecutionProvider"]
)

face_app.prepare(ctx_id=0, det_size=(256, 256))

print("Model loaded.")
print("Starting camera...")
print("Press C to capture a sample.")
print("Press Q to quit.")

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Could not open camera.")
    exit()

embeddings = []
required_samples = 5

while True:

    success, frame = camera.read()

    if not success:
        print("Could not read frame.")
        break

    display_frame = frame.copy()

    cv2.putText(
        display_frame,
        f"Samples: {len(embeddings)}/{required_samples}",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2,
    )

    cv2.putText(
        display_frame,
        "Press C = Capture | Q = Quit",
        (20, 70),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (0, 255, 0),
        2,
    )

    cv2.imshow("Student Face Registration", display_frame)

    key = cv2.waitKey(1) & 0xFF

    # Capture sample
    if key == ord("c"):

        print("\nProcessing sample...")

        faces = face_app.get(frame)

        if len(faces) == 0:
            print("❌ No face detected.")
            continue

        if len(faces) > 1:
            print("❌ Multiple faces detected.")
            continue

        face = faces[0]

        x1, y1, x2, y2 = map(int, face.bbox)

        face_width = x2 - x1
        face_height = y2 - y1

        if face_width < 120 or face_height < 120:
            print("❌ Face is too small. Move closer.")
            continue

        embedding = face.embedding

        embeddings.append(embedding)

        print(f"✅ Sample {len(embeddings)} captured.")

        print(f"Embedding size: {len(embedding)}")

        if len(embeddings) == required_samples:

            print("\n================================")
            print("All samples captured!")
            print("================================")

            # Convert embeddings into NumPy array
            embedding_array = np.array(embeddings)

            print("Embedding array shape:", embedding_array.shape)

            # Average the embeddings
            average_embedding = np.mean(embedding_array, axis=0)

            # Normalize the final embedding
            norm = np.linalg.norm(average_embedding)

            if norm != 0:
                average_embedding = average_embedding / norm

            print("Final embedding size:", len(average_embedding))

            print("Final embedding norm:", np.linalg.norm(average_embedding))

            print("\n✅ Student face profile created!")

            break

    elif key == ord("q"):
        break

camera.release()
cv2.destroyAllWindows()
