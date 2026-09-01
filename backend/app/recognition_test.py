import cv2
import insightface
import time

print("Loading InsightFace...")

face_app = insightface.app.FaceAnalysis(
    name="buffalo_l", providers=["CPUExecutionProvider"]
)

face_app.prepare(ctx_id=0, det_size=(256, 256))

print("Model loaded.")
print("Starting camera...")
print("Press Q to quit.")

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Could not open the camera.")
    exit()

frame_count = 0
recognition_interval = 10

last_faces = []
last_process_time = 0

while True:
    success, frame = camera.read()

    if not success:
        print("Could not read frame.")
        break

    frame_count += 1

    # Run InsightFace only every 10th frame
    if frame_count % recognition_interval == 0:
        last_faces = face_app.get(frame)
        last_process_time = time.time()

    # Draw the most recent recognition result
    for face in last_faces:
        x1, y1, x2, y2 = map(int, face.bbox)

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        embedding_size = len(face.embedding)

        cv2.putText(
            frame,
            f"Embedding: {embedding_size}D",
            (x1, max(y1 - 10, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2,
        )

    cv2.putText(
        frame,
        f"Faces detected: {len(last_faces)}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2,
    )

    cv2.imshow("Optimized Face Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

camera.release()
cv2.destroyAllWindows()
